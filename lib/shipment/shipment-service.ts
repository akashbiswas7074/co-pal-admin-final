/**
 * Shipment Service
 * Handles all shipment-related business logic
 */

import { connectToDatabase } from '@/lib/database/connect';
import Order from '@/lib/database/models/order.model';
import Warehouse from '@/lib/database/models/warehouse.model';
import Shipment from '@/lib/database/models/shipment.model';
import { delhiveryAPI } from './delhivery-api';
import { waybillService } from './waybill-service';
import { generateHSNCode, generateHSNFromDescription } from '@/lib/utils/hsn-code-generator';
import Product from '@/lib/database/models/product.model';
import type {
  ShipmentCreateRequest,
  ShipmentDetails,
  ShipmentDimensions,
  ShipmentPackage,
  CreateShipmentResponse,
  TrackingInfo,
  WarehouseInfo
} from '@/types/shipment';
import type {
  DelhiveryShipmentData,
  DelhiveryCreatePayload,
  DelhiveryShipmentType,
  DelhiveryPaymentMode
} from '@/types/delhivery';

export class ShipmentService {
  /**
   * Create a new shipment
   */
  async createShipment(request: ShipmentCreateRequest): Promise<CreateShipmentResponse> {
    try {
      await connectToDatabase();

      console.log('[Shipment Service] Creating shipment:', request);

      // Validate order exists and status
      const order = await Order.findById(request.orderId);
      if (!order) {
        throw new Error('Order not found');
      }

      // Validate order status for shipment creation
      const allowedStatuses = this.getAllowedStatuses(request.shipmentType);
      if (!allowedStatuses.includes(order.status)) {
        throw new Error(`Order must be in one of these statuses: ${allowedStatuses.join(', ')} for ${request.shipmentType} shipment`);
      }

      // Check if shipment already exists
      if (request.shipmentType === 'FORWARD' && order.shipmentCreated) {
        throw new Error('Forward shipment already created for this order');
      }

      // Get warehouse details
      const pickupLocationName = request.pickupLocation || 'Main Warehouse';
      const warehouse = await this.getWarehouseByName(pickupLocationName);
      if (!warehouse) {
        throw new Error(`Warehouse not found: ${pickupLocationName}`);
      }

      // Pre-generate waybills using the enhanced API method with database storage
      let preGeneratedWaybills: string[] = [];
      // Temporarily disable waybill pre-generation due to API issues
      if (false && request.customFields?.auto_generate_waybill && delhiveryAPI.isConfigured()) {
        try {
          const waybillCount = request.shipmentType === 'MPS' && request.packages && request.packages.length > 0
            ? request.packages.length
            : 1;

          console.log(`[Shipment Service] Pre-generating ${waybillCount} waybills for shipment using enhanced API with database storage`);

          // Try to get from stored waybills first
          preGeneratedWaybills = await waybillService.getAvailableWaybills(waybillCount);

          if (preGeneratedWaybills.length < waybillCount) {
            // Generate additional waybills if needed
            const additionalNeeded = waybillCount - preGeneratedWaybills.length;
            console.log(`[Shipment Service] Need ${additionalNeeded} more waybills, generating...`);

            const additionalWaybills = await waybillService.generateAndStoreWaybills(additionalNeeded);
            preGeneratedWaybills = preGeneratedWaybills.concat(additionalWaybills.slice(0, additionalNeeded));
          }

          // Reserve the waybills for this shipment
          if (preGeneratedWaybills.length > 0) {
            await waybillService.reserveWaybills(preGeneratedWaybills, `order_${request.orderId}`);
          }

          console.log('[Shipment Service] Pre-generated and reserved waybills:', preGeneratedWaybills);

          // Store waybills for later use (recommended by Delhivery)
          // Note: Waybills are generated in batches of 25 at the backend
          console.log('[Shipment Service] Waybills stored and reserved for manifest creation');
        } catch (waybillError: any) {
          console.warn('[Shipment Service] Failed to pre-generate waybills:', waybillError.message);
          // Continue without pre-generated waybills
        }
      }    // Create shipment data
      const shipmentData = this.createShipmentData(order, request, warehouse);

      // Debug: Log the created shipment data
      console.log('[Shipment Service] Created shipment data:', {
        order: shipmentData.order,
        send_date: shipmentData.send_date,
        end_date: shipmentData.end_date,
        name: shipmentData.name,
        pin: shipmentData.pin
      });

      // If we have pre-generated waybills, use them
      if (preGeneratedWaybills.length > 0) {
        shipmentData.waybill = preGeneratedWaybills[0];
      }

      // Prepare Delhivery payload
      const delhiveryPayload: DelhiveryCreatePayload = {
        shipments: request.shipmentType === 'MPS' && request.packages && request.packages.length > 0
          ? request.packages.map((pkg, index) => {
            const packageShipmentData = this.createShipmentData(order, request, warehouse, index);
            // Debug: Log package shipment data
            console.log(`[Shipment Service] Package ${index + 1} shipment data:`, {
              order: packageShipmentData.order,
              send_date: packageShipmentData.send_date,
              end_date: packageShipmentData.end_date,
              name: packageShipmentData.name,
              pin: packageShipmentData.pin
            });
            // Use pre-generated waybill if available
            if (preGeneratedWaybills[index]) {
              packageShipmentData.waybill = preGeneratedWaybills[index];
            }
            return packageShipmentData;
          })
          : [shipmentData],
        pickup_location: {
          name: warehouse.name
        }
      };

      // Call Delhivery API or create demo shipment
      let delhiveryResponse: any;
      let waybillNumbers: string[] = [];

      if (delhiveryAPI.isConfigured()) {
        try {
          // Get environment info for logging
          const envInfo = delhiveryAPI.getEnvironmentInfo();
          console.log(`[Shipment Service] Creating shipment using ${envInfo.environment} environment (${envInfo.baseUrl})`);

          delhiveryResponse = await delhiveryAPI.createShipment(delhiveryPayload);

          // BLOCK SHIPMENT CREATION IF DELHIVERY API FAILS
          if (!delhiveryResponse.success || delhiveryResponse.error) {
            console.error(`[Shipment Service] Delhivery API failed in ${envInfo.environment} environment - BLOCKING shipment creation:`, {
              environment: envInfo.environment,
              success: delhiveryResponse.success,
              error: delhiveryResponse.error,
              rmk: delhiveryResponse.rmk,
              packages: delhiveryResponse.packages
            });

            const rmk = delhiveryResponse.rmk || '';

            // Determine specific error message
            if (rmk.includes('Insufficient Balance') || rmk.includes('insufficient balance')) {
              throw new Error('Insufficient balance in Delhivery account. Please recharge your account to continue creating shipments.');
            } else if (rmk.includes('ClientWarehouse matching query does not exist')) {
              throw new Error(`Warehouse "${request.pickupLocation}" is not registered in your Delhivery account. Please register the warehouse first.`);
            } else if (rmk.includes('An internal Error has occurred')) {
              // Check if the error is actually about insufficient balance
              if (delhiveryResponse.packages && delhiveryResponse.packages.length > 0) {
                const packageRemarks = delhiveryResponse.packages[0].remarks;
                if (packageRemarks && Array.isArray(packageRemarks) && packageRemarks.length > 0) {
                  const remarksText = packageRemarks.join(' ');
                  if (remarksText.includes('insufficient balance') || remarksText.includes('Insufficient Balance')) {
                    throw new Error('Insufficient balance in Delhivery account. Please recharge your account to continue creating shipments.');
                  }
                }
              }
              throw new Error('Delhivery is experiencing technical issues. Please try again later.');
            } else {
              throw new Error(rmk || delhiveryResponse.error || 'Delhivery API error');
            }
          }

          // Check for failed packages
          const failedPackages = delhiveryResponse.packages?.filter((pkg: any) => pkg.status === 'Fail' || pkg.serviceable === false);
          if (failedPackages && failedPackages.length > 0) {
            console.error(`[Shipment Service] Packages failed in ${envInfo.environment} environment - BLOCKING shipment creation:`, failedPackages);

            // Check for duplicate order ID error first
            const hasDuplicateOrder = failedPackages.some((pkg: any) =>
              pkg.remarks && Array.isArray(pkg.remarks) &&
              pkg.remarks.some((remark: string) => remark.toLowerCase().includes('duplicate order'))
            );

            if (hasDuplicateOrder) {
              // For duplicate order, we should check if the shipment already exists and return that instead
              console.log(`[Shipment Service] Duplicate order detected for order ${request.orderId}. Checking for existing shipment...`);

              try {
                // Try to find existing shipment in our database
                const existingShipment = await Shipment.findOne({ orderId: request.orderId });
                if (existingShipment && existingShipment.waybillNumbers?.length > 0) {
                  console.log(`[Shipment Service] Found existing shipment for order ${request.orderId}:`, {
                    waybillNumbers: existingShipment.waybillNumbers,
                    status: existingShipment.status
                  });

                  // Return the existing waybill number instead of failing
                  waybillNumbers = existingShipment.waybillNumbers;
                  console.log(`[Shipment Service] Using existing shipment waybill for order ${request.orderId}`);
                } else {
                  // Also check in order model for backward compatibility
                  const existingOrder = await Order.findById(request.orderId);
                  if (existingOrder && existingOrder.shipmentCreated && existingOrder.shipmentDetails?.waybillNumbers?.length > 0) {
                    console.log(`[Shipment Service] Found existing shipment in order for order ${request.orderId}:`, {
                      waybillNumbers: existingOrder.shipmentDetails.waybillNumbers,
                      status: existingOrder.status
                    });

                    waybillNumbers = existingOrder.shipmentDetails.waybillNumbers;
                    console.log(`[Shipment Service] Using existing shipment waybill from order for order ${request.orderId}`);
                  } else {
                    throw new Error(`A shipment for order ${request.orderId} already exists in Delhivery but not found in our records. Please contact support to resolve this issue.`);
                  }
                }
              } catch (dbError) {
                console.error(`[Shipment Service] Error checking for existing shipment:`, dbError);
                throw new Error(`A shipment for order ${request.orderId} already exists. Please check if a shipment was already created for this order.`);
              }
            } else if (failedPackages.some((pkg: any) => pkg.serviceable === false)) {
              throw new Error('The delivery address is not serviceable by Delhivery. Please check the address and pincode.');
            } else {
              const errorDetails = failedPackages.map((pkg: any) => pkg.remarks || 'Processing failed').join(', ');
              throw new Error(`Package processing failed: ${errorDetails}`);
            }
          }

          // Check if API call was successful and extract waybills
          if (delhiveryResponse.success && delhiveryResponse.packages) {
            waybillNumbers = delhiveryResponse.packages
              .filter((pkg: any) => pkg.waybill && pkg.status === 'Success')
              .map((pkg: any) => pkg.waybill);
          }

          // If no valid waybills, throw error
          if (waybillNumbers.length === 0) {
            throw new Error(`No valid waybills received from Delhivery API (${envInfo.environment} environment)`);
          }

          console.log(`[Shipment Service] Successfully created shipment in ${envInfo.environment} environment:`, {
            environment: envInfo.environment,
            waybillCount: waybillNumbers.length,
            waybills: waybillNumbers
          });

        } catch (error) {
          console.error('[Shipment Service] Delhivery API error:', error);

          // Re-throw the error to block shipment creation
          throw error;
        }
      } else {
        // If API not configured, create demo shipment or throw error
        if (process.env.NODE_ENV === 'development') {
          console.log('[Shipment Service] API not configured - creating demo shipment for development');
          const demo = this.createDemoShipment(delhiveryPayload);
          delhiveryResponse = demo.response;
          waybillNumbers = demo.waybills;
        } else {
          throw new Error('Delhivery API not configured. Please set up your API credentials.');
        }
      }

      if (waybillNumbers.length === 0) {
        console.error('[Shipment Service] No waybills generated even in demo mode');
        throw new Error('Failed to generate waybill numbers');
      }

      // Update order with shipment details
      const shipmentDetails = this.createShipmentDetails(request, warehouse, waybillNumbers, delhiveryResponse);
      await this.updateOrderWithShipment(order, request.shipmentType, shipmentDetails);

      // Save shipment to MongoDB for better tracking and management
      try {
        const shippingAddress = order.shippingAddress || order.deliveryAddress || {};

        const shipmentData = {
          orderId: request.orderId,
          waybillNumbers,
          primaryWaybill: waybillNumbers[0],
          shipmentType: request.shipmentType,
          status: 'Created',
          pickupLocation: request.pickupLocation || warehouse.name,
          warehouse: {
            name: warehouse.name,
            address: warehouse.address,
            pincode: warehouse.pin,
            phone: warehouse.phone
          },
          customerDetails: {
            name: shippingAddress.firstName && shippingAddress.lastName
              ? `${shippingAddress.firstName} ${shippingAddress.lastName}`.trim()
              : shippingAddress.name || order.customerName || 'Customer',
            phone: shippingAddress.phoneNumber || shippingAddress.phone || '9999999999',
            address: shippingAddress.address1 && shippingAddress.address2
              ? `${shippingAddress.address1}, ${shippingAddress.address2}`.trim()
              : shippingAddress.address || shippingAddress.fullAddress || 'Default Address',
            pincode: shippingAddress.zipCode || shippingAddress.pincode || shippingAddress.postal_code,
            city: shippingAddress.city || 'Mumbai',
            state: shippingAddress.state || 'Maharashtra'
          },
          packageDetails: {
            weight: request.weight || 500,
            dimensions: request.dimensions || { length: 10, width: 10, height: 10 },
            productDescription: 'General Product',
            paymentMode: this.getPaymentMode(request.shipmentType, order.paymentMethod),
            codAmount: order.paymentMethod === 'cod' ? order.total : 0
          },
          delhiveryResponse,
          isActive: true
        };

        const newShipment = new Shipment(shipmentData);
        await newShipment.save();

        console.log('[Shipment Service] Shipment saved to MongoDB:', {
          shipmentId: newShipment._id,
          orderId: request.orderId,
          waybillNumbers
        });

        // Add shipment ID to shipment details for reference
        // shipmentDetails.shipmentId = newShipment._id;

      } catch (saveError: any) {
        console.error('[Shipment Service] Error saving shipment to MongoDB:', saveError);
        // Don't fail the entire process if MongoDB save fails
      }

      // Mark waybills as used in the database
      if (preGeneratedWaybills.length > 0) {
        try {
          const shipmentId = `shipment_${Date.now()}`;
          for (const waybill of waybillNumbers) {
            await waybillService.useWaybill(waybill, request.orderId, shipmentId);
          }
          console.log('[Shipment Service] Marked waybills as used in database');
        } catch (waybillError: any) {
          console.warn('[Shipment Service] Failed to mark waybills as used:', waybillError.message);
        }
      }

      // Create pickup request after successful shipment creation
      let pickupResponse;
      if (delhiveryAPI.isConfigured() && waybillNumbers.length > 0) {
        try {
          console.log('[Shipment Service] Creating pickup request for shipment...');

          // Calculate pickup date and time (next business day at 11:00 AM)
          const pickupDate = this.getNextBusinessDay();
          const pickupTime = '11:00:00';

          const pickupData = {
            pickup_time: pickupTime,
            pickup_date: pickupDate,
            pickup_location: warehouse.name,
            expected_package_count: waybillNumbers.length
          };

          pickupResponse = await delhiveryAPI.createPickupRequest(pickupData);
          console.log('[Shipment Service] Pickup request created successfully:', pickupResponse);

          // Add pickup info to shipment details
          shipmentDetails.pickupRequest = {
            pickup_date: pickupDate,
            pickup_time: pickupTime,
            pickup_location: warehouse.name,
            expected_package_count: waybillNumbers.length,
            pickup_id: pickupResponse?.pickup_id || pickupResponse?.id,
            response: pickupResponse
          };

        } catch (pickupError: any) {
          console.warn('[Shipment Service] Failed to create pickup request:', pickupError.message);
          // Don't fail the entire shipment creation if pickup request fails
          shipmentDetails.pickupRequest = {
            pickup_date: '',
            pickup_time: '',
            pickup_location: '',
            expected_package_count: 0,
            error: pickupError.message,
            attempted: true
          };
        }
      }

      console.log('[Shipment Service] Shipment created successfully:', {
        orderId: request.orderId,
        shipmentType: request.shipmentType,
        waybillNumbers
      });

      return {
        success: true,
        data: {
          shipmentDetails,
          delhiveryResponse
        }
      };

    } catch (error: any) {
      console.error('[Shipment Service] Error creating shipment:', error);
      return {
        success: false,
        error: error.message || 'Failed to create shipment'
      };
    }
  }

  /**
   * Track shipment by waybill
   */
  async trackShipment(waybill: string): Promise<TrackingInfo | null> {
    try {
      if (!delhiveryAPI.isConfigured()) {
        return this.createDemoTracking(waybill);
      }

      const response = await delhiveryAPI.trackShipment(waybill);
      return this.parseTrackingResponse(response, waybill);
    } catch (error) {
      console.error('[Shipment Service] Error tracking shipment:', error);
      return this.createDemoTracking(waybill);
    }
  }

  /**
   * Get shipment details for an order
   */
  /**
   * Get shipment details for an order
   */
  async getShipmentDetails(orderId: string) {
    try {
      await connectToDatabase();

      const order = await Order.findById(orderId)
        .populate({
          path: 'orderItems.product',
          model: Product,
          select: 'shippingDimensions weight'
        })
        .populate({
          path: 'products.product',
          model: Product,
          select: 'shippingDimensions weight'
        });

      if (!order) {
        throw new Error('Order not found');
      }

      // Calculate total weight and dimensions from products
      let totalWeight = 0;
      let maxLength = 10;
      let maxBreadth = 10;
      let maxHeight = 10;
      const productNames: string[] = [];

      const items = order.orderItems?.length > 0 ? order.orderItems : (order.products || []);

      if (items && items.length > 0) {
        items.forEach((item: any) => {
          const product = item.product;
          const qty = item.qty || item.quantity || 1;

          if (product) {
            // Add name to list
            if (product.name) {
              productNames.push(product.name);
            }

            if (product.shippingDimensions) {
              const { length = 0, breadth = 0, height = 0, weight = 0 } = product.shippingDimensions;
              const itemWeight = (weight || 0) * 1000; // Convert kg to g if stored in kg (assuming schema default says cm/kg)

              totalWeight += (itemWeight * qty);

              if (length > maxLength) maxLength = length;
              if (breadth > maxBreadth) maxBreadth = breadth;
              if (height > maxHeight) maxHeight = height;
            }
          }
        });
      }

      // Default to 500g if 0
      if (totalWeight === 0) totalWeight = 500;

      // Generate description
      const productDescription = productNames.length > 0
        ? productNames.join(', ').substring(0, 50) // Limit to 50 chars for standard API compliance
        : 'General Product';

      const warehouses = await this.getActiveWarehouses();
      const availableActions = this.getAvailableActions(order);

      // Get shipping address details
      const shippingAddress = order.shippingAddress || order.deliveryAddress || {};
      const deliveryPincode = shippingAddress.zipCode || shippingAddress.pincode || shippingAddress.postal_code;

      console.log('[Shipment Service] Warehouses being returned:', warehouses);
      console.log('[Shipment Service] Warehouses count:', warehouses.length);

      return {
        success: true,
        data: {
          orderId: order._id,
          status: order.status,
          paymentMethod: order.paymentMethod, // Return payment method
          hasShipment: !!order.shipmentCreated,
          shipmentCreated: order.shipmentCreated,
          shipmentDetails: order.shipmentDetails,
          reverseShipment: order.reverseShipment,
          replacementShipment: order.replacementShipment,
          shippingAddress: {
            name: shippingAddress.firstName && shippingAddress.lastName
              ? `${shippingAddress.firstName} ${shippingAddress.lastName}`.trim()
              : shippingAddress.name || order.customerName || 'Customer',
            address: shippingAddress.address1 && shippingAddress.address2
              ? `${shippingAddress.address1}, ${shippingAddress.address2}`.trim()
              : shippingAddress.address || shippingAddress.fullAddress || 'Default Address',
            city: shippingAddress.city || 'Mumbai',
            state: shippingAddress.state || 'Maharashtra',
            pincode: deliveryPincode,
            phone: shippingAddress.phoneNumber || shippingAddress.phone || '9999999999',
            country: shippingAddress.country || 'India'
          },
          packageDetails: {
            weight: totalWeight,
            dimensions: {
              length: maxLength,
              width: maxBreadth, // Map breadth to width
              height: maxHeight
            },
            productDescription // Return the generated description
          },
          availableActions,
          warehouses: warehouses || [],
          canCreateShipment: availableActions.length > 0
        }
      };
    } catch (error: any) {
      console.error('[Shipment Service] Error getting shipment details:', error);
      return {
        success: false,
        error: error.message || 'Failed to get shipment details'
      };
    }
  }

  /**
   * Generate waybills for MPS shipments
   */
  async generateWaybills(count: number): Promise<string[]> {
    try {
      if (!delhiveryAPI.isConfigured()) {
        return this.generateDemoWaybills(count);
      }

      return await delhiveryAPI.generateWaybills(count);
    } catch (error) {
      console.error('[Shipment Service] Error generating waybills:', error);
      return this.generateDemoWaybills(count);
    }
  }

  /**
   * Edit existing shipment
   */
  async editShipment(waybill: string, editData: any) {
    try {
      if (!delhiveryAPI.isConfigured()) {
        return {
          success: true,
          message: 'Demo shipment edited successfully (Delhivery integration needed for production)',
          data: { waybill, editData }
        };
      }

      const response = await delhiveryAPI.editShipment({ waybill, ...editData });
      return {
        success: response.success,
        message: response.success ? 'Shipment edited successfully' : response.error,
        data: response
      };
    } catch (error: any) {
      console.error('[Shipment Service] Error editing shipment:', error);
      return {
        success: false,
        error: error.message || 'Failed to edit shipment'
      };
    }
  }

  /**
   * Cancel shipment
   */
  async cancelShipment(waybill: string) {
    try {
      if (!delhiveryAPI.isConfigured()) {
        return {
          success: true,
          message: 'Demo shipment cancelled successfully',
          data: { waybill }
        };
      }

      const success = await delhiveryAPI.cancelShipment(waybill);
      return {
        success,
        message: success ? 'Shipment cancelled successfully' : 'Failed to cancel shipment',
        data: { waybill }
      };
    } catch (error: any) {
      console.error('[Shipment Service] Error cancelling shipment:', error);
      return {
        success: false,
        error: error.message || 'Failed to cancel shipment'
      };
    }
  }

  /**
   * Generate shipping label for a waybill
   */
  async generateShippingLabel(waybill: string, options: { pdf?: boolean; pdf_size?: 'A4' | '4R' } = {}) {
    try {
      if (!delhiveryAPI.isConfigured()) {
        return {
          success: false,
          error: 'Delhivery API not configured'
        };
      }

      const labelData = await delhiveryAPI.generateShippingLabel(waybill, options);

      return {
        success: true,
        data: labelData,
        waybill
      };
    } catch (error: any) {
      console.error('[Shipment Service] Error generating shipping label:', error);
      return {
        success: false,
        error: error.message || 'Failed to generate shipping label'
      };
    }
  }

  /**
   * Get all shipments with pagination and filtering
   */
  async getShipments(options: {
    page?: number;
    limit?: number;
    status?: string;
    shipmentType?: string;
    orderId?: string;
    waybill?: string;
  } = {}) {
    try {
      await connectToDatabase();

      const { page = 1, limit = 10, status, shipmentType, orderId, waybill } = options;
      const skip = (page - 1) * limit;

      // Build query
      const query: any = { isActive: true };

      if (status) query.status = status;
      if (shipmentType) query.shipmentType = shipmentType;
      if (orderId) query.orderId = orderId;
      if (waybill) {
        query.$or = [
          { primaryWaybill: { $regex: waybill, $options: 'i' } },
          { waybillNumbers: { $regex: waybill, $options: 'i' } }
        ];
      }

      const shipments = await Shipment.find(query)
        .populate('orderId', 'customerName total status paymentMethod')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Shipment.countDocuments(query);

      return {
        success: true,
        data: {
          shipments,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalItems: total,
            itemsPerPage: limit
          }
        }
      };
    } catch (error: any) {
      console.error('[Shipment Service] Error getting shipments:', error);
      return {
        success: false,
        error: error.message || 'Failed to get shipments'
      };
    }
  }

  /**
   * Get shipment by ID
   */
  async getShipmentById(shipmentId: string) {
    try {
      await connectToDatabase();

      const shipment = await Shipment.findById(shipmentId)
        .populate('orderId', 'customerName total status paymentMethod shippingAddress');

      if (!shipment) {
        throw new Error('Shipment not found');
      }

      return {
        success: true,
        data: shipment
      };
    } catch (error: any) {
      console.error('[Shipment Service] Error getting shipment by ID:', error);
      return {
        success: false,
        error: error.message || 'Failed to get shipment'
      };
    }
  }

  /**
   * Get shipment by waybill
   */
  async getShipmentByWaybill(waybill: string) {
    try {
      await connectToDatabase();

      const shipment = await Shipment.findOne({
        $or: [
          { primaryWaybill: waybill },
          { waybillNumbers: waybill }
        ]
      }).populate('orderId', 'customerName total status paymentMethod shippingAddress');

      if (!shipment) {
        throw new Error('Shipment not found');
      }

      return {
        success: true,
        data: shipment
      };
    } catch (error: any) {
      console.error('[Shipment Service] Error getting shipment by waybill:', error);
      return {
        success: false,
        error: error.message || 'Failed to get shipment'
      };
    }
  }

  /**
   * Update shipment status
   */
  async updateShipmentStatus(shipmentId: string, status: string, trackingInfo?: any) {
    try {
      await connectToDatabase();

      const updateData: any = {
        status,
        updatedAt: new Date()
      };

      if (trackingInfo) {
        updateData.trackingInfo = trackingInfo;
      }

      const shipment = await Shipment.findByIdAndUpdate(
        shipmentId,
        updateData,
        { new: true }
      );

      if (!shipment) {
        throw new Error('Shipment not found');
      }

      console.log('[Shipment Service] Shipment status updated:', {
        shipmentId,
        newStatus: status
      });

      return {
        success: true,
        data: shipment
      };
    } catch (error: any) {
      console.error('[Shipment Service] Error updating shipment status:', error);
      return {
        success: false,
        error: error.message || 'Failed to update shipment status'
      };
    }
  }

  /**
   * Update shipment using Delhivery edit API with enhanced validation
   */
  async updateShipment(waybill: string, updateData: {
    name?: string;
    phone?: string[];
    pt?: 'COD' | 'Pre-paid';
    cod?: number;
    add?: string;
    products_desc?: string;
    weight?: number;
    shipment_height?: number;
    shipment_width?: number;
    shipment_length?: number;
  }) {
    try {
      await connectToDatabase();

      // Get shipment from our database for current state validation
      const shipment = await Shipment.findOne({
        $or: [
          { primaryWaybill: waybill },
          { waybillNumbers: waybill }
        ]
      });

      if (!shipment) {
        return {
          success: false,
          error: 'Shipment not found in database'
        };
      }

      // Check shipment status for edit eligibility
      const allowedEditStatuses = [
        'PENDING',
        'PICKUP_PENDING',
        'PICKUP_SCHEDULED',
        'MANIFEST_GENERATED'
      ];

      if (shipment.status && !allowedEditStatuses.includes(shipment.status)) {
        return {
          success: false,
          error: `Shipment cannot be edited in current status: ${shipment.status}. Allowed statuses: ${allowedEditStatuses.join(', ')}`
        };
      }

      if (!delhiveryAPI.isConfigured()) {
        return {
          success: false,
          error: 'Delhivery API not configured'
        };
      }

      // Prepare Delhivery edit payload
      const editPayload: any = { waybill };

      // Map our fields to Delhivery API fields
      if (updateData.name) editPayload.name = updateData.name;
      if (updateData.add) editPayload.add = updateData.add;
      if (updateData.phone && updateData.phone.length > 0) {
        editPayload.phone = updateData.phone[0];
      }
      if (updateData.pt) {
        // Convert our payment mode format to Delhivery format
        editPayload.payment_mode = updateData.pt === 'Pre-paid' ? 'Prepaid' : 'COD';
      }
      if (updateData.cod !== undefined) {
        editPayload.cod_amount = updateData.cod.toString();
      }
      if (updateData.weight !== undefined) {
        editPayload.weight = updateData.weight.toString();
      }
      if (updateData.shipment_height !== undefined) {
        editPayload.shipment_height = updateData.shipment_height.toString();
      }
      if (updateData.shipment_width !== undefined) {
        editPayload.shipment_width = updateData.shipment_width.toString();
      }
      if (updateData.shipment_length !== undefined) {
        editPayload.shipment_length = updateData.shipment_length.toString();
      }
      if (updateData.products_desc) {
        editPayload.products_desc = updateData.products_desc;
      }

      // Validate payment mode conversion if changing
      if (updateData.pt && shipment.packageDetails?.paymentMode) {
        const currentMode = shipment.packageDetails.paymentMode;
        const newMode = updateData.pt;

        // Only allow COD to Prepaid conversion, not the reverse
        if (currentMode === 'Pre-paid' && newMode === 'COD') {
          return {
            success: false,
            error: 'Cannot convert Prepaid shipment to COD. This conversion is not allowed by Delhivery.'
          };
        }
      }

      // Validate COD amount consistency
      if (updateData.pt === 'Pre-paid' && updateData.cod && updateData.cod > 0) {
        return {
          success: false,
          error: 'COD amount must be 0 for Prepaid shipments'
        };
      }
      if (updateData.pt === 'COD' && updateData.cod !== undefined && updateData.cod <= 0) {
        return {
          success: false,
          error: 'COD amount must be greater than 0 for COD shipments'
        };
      }

      try {
        // Call Delhivery edit API with enhanced validation
        const result = await delhiveryAPI.editShipment(editPayload);

        // If Delhivery API call was successful, update our database
        if (result.success) {
          // Update relevant fields in our database
          if (updateData.name) shipment.customerDetails.name = updateData.name;
          if (updateData.phone && updateData.phone.length > 0) {
            shipment.customerDetails.phone = updateData.phone[0];
          }
          if (updateData.add) shipment.customerDetails.address = updateData.add;
          if (updateData.weight) shipment.packageDetails.weight = updateData.weight;
          if (updateData.products_desc) {
            shipment.packageDetails.productDescription = updateData.products_desc;
          }
          if (updateData.pt) shipment.packageDetails.paymentMode = updateData.pt;
          if (updateData.cod !== undefined) shipment.packageDetails.codAmount = updateData.cod;

          if (updateData.shipment_height || updateData.shipment_width || updateData.shipment_length) {
            if (!shipment.packageDetails.dimensions) {
              shipment.packageDetails.dimensions = {};
            }
            if (updateData.shipment_height) {
              shipment.packageDetails.dimensions.height = updateData.shipment_height;
            }
            if (updateData.shipment_width) {
              shipment.packageDetails.dimensions.width = updateData.shipment_width;
            }
            if (updateData.shipment_length) {
              shipment.packageDetails.dimensions.length = updateData.shipment_length;
            }
          }

          // Update timestamp
          shipment.updatedAt = new Date();

          await shipment.save();
          console.log('[Shipment Service] Shipment updated successfully:', waybill);

          return {
            success: true,
            data: {
              waybill,
              updated_fields: Object.keys(updateData),
              delhivery_response: result
            },
            message: 'Shipment updated successfully'
          };
        } else {
          return {
            success: false,
            error: result.error || result.rmk || 'Failed to update shipment in Delhivery',
            details: result
          };
        }

      } catch (delhiveryError: any) {
        // Handle specific Delhivery API errors with user-friendly messages
        let errorMessage = delhiveryError.message;

        if (errorMessage.includes('cannot be edited in current status')) {
          return {
            success: false,
            error: errorMessage,
            suggestion: 'The shipment may have already been picked up or is in transit. Contact support for assistance.'
          };
        }

        if (errorMessage.includes('Payment mode conversion')) {
          return {
            success: false,
            error: errorMessage,
            suggestion: 'If you need to change payment mode, you may need to cancel and recreate the shipment.'
          };
        }

        // For other errors, update only in our database and provide helpful guidance
        console.warn('[Shipment Service] Delhivery edit failed, updating local database only:', errorMessage);

        // Update our database but inform user about limitations
        let localUpdatesApplied = false;
        const allowedLocalUpdates = ['products_desc']; // Fields we can update locally

        Object.keys(updateData).forEach(key => {
          if (allowedLocalUpdates.includes(key)) {
            if (key === 'products_desc' && updateData.products_desc) {
              shipment.packageDetails.productDescription = updateData.products_desc;
              localUpdatesApplied = true;
            }
          }
        });

        if (localUpdatesApplied) {
          shipment.updatedAt = new Date();
          await shipment.save();
        }

        return {
          success: false,
          error: `Delhivery edit failed: ${errorMessage}`,
          partial_success: localUpdatesApplied,
          suggestion: localUpdatesApplied
            ? 'Some fields were updated locally. For other changes, you may need to cancel and recreate the shipment.'
            : 'To modify this shipment, you may need to cancel it and create a new one with the updated details.'
        };
      }

    } catch (error: any) {
      console.error('[Shipment Service] Error updating shipment:', error);
      return {
        success: false,
        error: error.message || 'Failed to update shipment'
      };
    }
  }

  /**
   * Cancel shipment using Delhivery API with improved error handling
   */
  async cancelShipmentByWaybill(waybill: string) {
    try {
      await connectToDatabase();

      // First check if shipment exists in our database
      const shipment = await Shipment.findOne({
        $or: [
          { primaryWaybill: waybill },
          { waybillNumbers: waybill }
        ]
      });

      if (!shipment) {
        return {
          success: false,
          error: `Shipment with waybill ${waybill} not found in our records`
        };
      }

      // Check if already cancelled
      if (shipment.status === 'Cancelled') {
        return {
          success: true,
          message: 'Shipment is already cancelled',
          waybill
        };
      }

      if (!delhiveryAPI.isConfigured()) {
        // If Delhivery API is not configured, just update our database
        shipment.status = 'Cancelled';
        shipment.updatedAt = new Date();
        await shipment.save();

        return {
          success: true,
          message: 'Shipment cancelled in local database (Delhivery API not configured)',
          waybill,
          localOnly: true
        };
      }

      try {
        // Call Delhivery cancel API
        const success = await delhiveryAPI.cancelShipment(waybill);

        if (success) {
          // Update shipment status in our database
          shipment.status = 'Cancelled';
          shipment.updatedAt = new Date();
          await shipment.save();
          console.log('[Shipment Service] Shipment cancelled successfully:', waybill);

          return {
            success: true,
            message: 'Shipment cancelled successfully',
            waybill
          };
        } else {
          return {
            success: false,
            error: 'Delhivery API returned failure for cancellation'
          };
        }
      } catch (delhiveryError: any) {
        console.warn('[Shipment Service] Delhivery cancellation failed:', delhiveryError.message);

        // If Delhivery API fails but shipment exists in our DB, offer local cancellation
        if (delhiveryError.message.includes('not found') || delhiveryError.message.includes('404')) {
          // Shipment might not exist on Delhivery side, cancel locally
          shipment.status = 'Cancelled';
          shipment.updatedAt = new Date();
          await shipment.save();

          return {
            success: true,
            message: 'Shipment cancelled locally (not found on Delhivery)',
            waybill,
            warning: 'Shipment was not found on Delhivery servers, but cancelled in our database'
          };
        }

        // For other errors, return the error but don't update local status
        return {
          success: false,
          error: `Failed to cancel shipment: ${delhiveryError.message}`,
          suggestion: 'You may need to contact Delhivery support directly or try again later'
        };
      }
    } catch (error: any) {
      console.error('[Shipment Service] Error cancelling shipment:', error);
      return {
        success: false,
        error: error.message || 'Failed to cancel shipment'
      };
    }
  }

  // Private helper methods

  private getAllowedStatuses(shipmentType: DelhiveryShipmentType): string[] {
    switch (shipmentType) {
      case 'FORWARD':
      case 'MPS':
        return ['Confirmed', 'Processing', 'Pending', 'Paid', 'pending', 'confirmed', 'processing', 'paid'];
      case 'REVERSE':
      case 'REPLACEMENT':
        return ['Delivered', 'Completed', 'delivered', 'completed'];
      default:
        return [];
    }
  }

  private async getWarehouseByName(name: string) {
    try {
      // **PRIORITIZE MONGODB FIRST** - Search in MongoDB database as primary source
      try {
        console.log(`[Shipment Service] Searching for warehouse '${name}' in MongoDB (primary source)...`);
        await connectToDatabase();

        const warehouse = await Warehouse.findOne({
          name,
          status: 'active'
        });

        if (warehouse) {
          console.log(`[Shipment Service] Found warehouse '${name}' in MongoDB`);
          return warehouse;
        } else {
          console.log(`[Shipment Service] Warehouse '${name}' not found in MongoDB`);
        }
      } catch (dbError) {
        console.error('[Shipment Service] Error fetching warehouse from MongoDB:', dbError);
      }

      // **FALLBACK TO DELHIVERY API** if not found in MongoDB
      if (delhiveryAPI.isConfigured()) {
        try {
          console.log(`[Shipment Service] MongoDB search failed, trying Delhivery API for warehouse '${name}'...`);
          const delhiveryWarehouses = await delhiveryAPI.fetchWarehouses();
          console.log(`[Shipment Service] Searching for warehouse '${name}' in Delhivery warehouses`);

          const warehouse = delhiveryWarehouses.find(w =>
            (w.name && w.name.toLowerCase() === name.toLowerCase()) ||
            (w.warehouse_name && w.warehouse_name.toLowerCase() === name.toLowerCase()) ||
            (w.pickup_location_name && w.pickup_location_name.toLowerCase() === name.toLowerCase())
          );

          if (warehouse) {
            console.log(`[Shipment Service] Found warehouse '${name}' in Delhivery`);
            return {
              name: warehouse.name || warehouse.warehouse_name || warehouse.pickup_location_name || name,
              address: warehouse.address || warehouse.warehouse_address || warehouse.pickup_address || 'No address',
              pin: warehouse.pin || warehouse.pincode || warehouse.warehouse_pin || warehouse.pickup_pin || '000000',
              phone: warehouse.phone || warehouse.warehouse_phone || warehouse.pickup_phone || '+919876543210',
              status: 'active'
            };
          }
        } catch (apiError) {
          console.error('[Shipment Service] Error fetching warehouse from Delhivery API:', apiError);
        }
      }

      console.log(`[Shipment Service] Warehouse '${name}' not found, trying to get any active warehouse`);

      // Try to get any active warehouse as fallback
      const activeWarehouses = await this.getActiveWarehouses();
      if (activeWarehouses.length > 0) {
        const fallbackWarehouse = activeWarehouses[0];
        console.log(`[Shipment Service] Using fallback warehouse: ${fallbackWarehouse.name}`);
        return {
          name: fallbackWarehouse.name,
          address: fallbackWarehouse.address,
          pin: fallbackWarehouse.pincode,
          phone: fallbackWarehouse.phone,
          status: 'active'
        };
      }

      // If no warehouses exist, create a default one
      console.log('[Shipment Service] No active warehouses found, creating default warehouse');
      const defaultWarehouse = {
        name: 'Main Warehouse',
        registered_name: 'Default Warehouse',
        phone: '+919876543210',
        email: 'warehouse@example.com',
        address: 'Default Warehouse Address, Business District',
        city: 'Mumbai',
        pin: '400001',
        country: 'India',
        return_address: 'Default Warehouse Address, Business District',
        return_city: 'Mumbai',
        return_pin: '400001',
        return_state: 'Maharashtra',
        return_country: 'India',
        status: 'active',
        isDefault: true
      };

      return defaultWarehouse;
    } catch (error) {
      console.error('[Shipment Service] Error in getWarehouseByName:', error);
      throw error;
    }
  }

  private async getActiveWarehouses(): Promise<WarehouseInfo[]> {
    try {
      console.log('[Shipment Service] Starting getActiveWarehouses...');

      // **PRIORITIZE MONGODB FIRST** - Fetch from MongoDB database as primary source
      try {
        console.log('[Shipment Service] Fetching warehouses from MongoDB (primary source)...');
        await connectToDatabase();

        const mongoWarehouses = await Warehouse.find({ status: 'active' });
        console.log('[Shipment Service] Found MongoDB warehouses:', mongoWarehouses.length);

        if (mongoWarehouses.length > 0) {
          const mappedWarehouses = mongoWarehouses.map((w, index) => {
            const mapped = {
              name: w.name || `Warehouse ${index + 1}`,
              address: w.address || w.return_address || 'No address available',
              pincode: w.pin || w.return_pin || '000000',
              phone: w.phone || '+919876543210',
              active: w.status === 'active'
            };
            console.log(`[Shipment Service] Mapped MongoDB warehouse ${index + 1}:`, mapped);
            return mapped;
          });

          console.log('[Shipment Service] Successfully returning MongoDB warehouses:', mappedWarehouses.length);
          return mappedWarehouses;
        } else {
          console.log('[Shipment Service] No active warehouses found in MongoDB');
        }
      } catch (dbError) {
        console.error('[Shipment Service] Error fetching warehouses from MongoDB:', dbError);
      }

      // **FALLBACK TO DELHIVERY API** if MongoDB is empty or fails
      if (delhiveryAPI.isConfigured()) {
        try {
          console.log('[Shipment Service] MongoDB empty/failed, trying Delhivery API as fallback...');
          const delhiveryWarehouses = await delhiveryAPI.fetchWarehouses();
          console.log('[Shipment Service] Fetched warehouses from Delhivery:', delhiveryWarehouses.length);

          if (delhiveryWarehouses.length > 0) {
            const mappedWarehouses = delhiveryWarehouses.map((w, index) => {
              const mapped = {
                name: w.name || w.warehouse_name || w.pickup_location_name || `Warehouse ${index + 1}`,
                address: w.address || w.warehouse_address || w.pickup_address || 'No address available',
                pincode: w.pin || w.pincode || w.warehouse_pin || w.pickup_pin || '000000',
                phone: w.phone || w.warehouse_phone || w.pickup_phone || '+919876543210',
                active: true
              };
              console.log(`[Shipment Service] Mapped Delhivery warehouse ${index + 1}:`, mapped);
              return mapped;
            });

            console.log('[Shipment Service] Returning Delhivery warehouses as fallback:', mappedWarehouses.length);
            return mappedWarehouses;
          }
        } catch (apiError) {
          console.error('[Shipment Service] Error fetching warehouses from Delhivery API:', apiError);
        }
      } else {
        console.log('[Shipment Service] Delhivery API not configured, skipping API fetch');
      }

      // **FINAL FALLBACK** - Default warehouses if both MongoDB and Delhivery fail
      console.log('[Shipment Service] Both MongoDB and Delhivery failed, providing default warehouses');
      const defaultWarehouses = [
        {
          name: 'Main Warehouse',
          address: 'A-Block, Phase I, Kalyani Township, Near Kalyani University, Kalyani, Nadia, West Bengal',
          pincode: '741235',
          phone: '+919876543210',
          active: true
        },
        {
          name: 'Delhi Hub',
          address: 'Plot No. 123, Sector 63, Noida, Near Metro Station, Uttar Pradesh',
          pincode: '201301',
          phone: '+919876543211',
          active: true
        },
        {
          name: 'Mumbai Hub',
          address: 'Unit 45, Industrial Estate, Andheri East, Near Airport, Maharashtra',
          pincode: '400069',
          phone: '+919876543212',
          active: true
        }
      ];

      console.log('[Shipment Service] Returning default warehouses:', defaultWarehouses);
      return defaultWarehouses;
    } catch (error) {
      console.error('[Shipment Service] Error in getActiveWarehouses:', error);
      // Return default warehouses on error
      const fallbackWarehouses = [
        {
          name: 'Main Warehouse',
          address: 'Default Warehouse Address, Business District',
          pincode: '400001',
          phone: '+919876543210',
          active: true
        }
      ];

      console.log('[Shipment Service] Returning fallback warehouses due to error:', fallbackWarehouses);
      return fallbackWarehouses;
    }
  }

  private getAvailableActions(order: any): string[] {
    const actions = [];

    if (!order.shipmentCreated && ['Confirmed', 'Processing'].includes(order.status)) {
      actions.push('FORWARD', 'MPS');
    }

    if (['Delivered', 'Completed'].includes(order.status)) {
      if (!order.reverseShipment) {
        actions.push('REVERSE');
      }
      if (!order.replacementShipment) {
        actions.push('REPLACEMENT');
      }
    }

    return actions;
  }

  private createShipmentData(
    order: any,
    request: ShipmentCreateRequest,
    warehouse: any,
    packageIndex?: number
  ): DelhiveryShipmentData {
    const shippingAddress = order.shippingAddress || order.deliveryAddress || {};
    const packageDetails = request.packages?.[packageIndex || 0];

    // Calculate dimensions and weight
    const dimensions = packageDetails?.dimensions || request.dimensions || { length: 10, width: 10, height: 10 };
    const weight = packageDetails?.weight || request.weight || 500;

    // Generate HSN code
    const hsnCode = request.customFields?.hsn_code ||
      request.auto_hsn_code ||
      this.generateHSNFromDescription(order.orderItems?.[0]?.name || 'General Item');

    // Determine payment mode
    const paymentMode = this.getPaymentMode(request.shipmentType, order.paymentMethod);

    // Safely construct customer name
    const customerName = shippingAddress.firstName && shippingAddress.lastName
      ? `${shippingAddress.firstName} ${shippingAddress.lastName}`.trim()
      : shippingAddress.name || order.customerName || order.user?.name || 'Customer';

    // Safely construct address
    const customerAddress = shippingAddress.address1 && shippingAddress.address2
      ? `${shippingAddress.address1}, ${shippingAddress.address2}`.trim()
      : shippingAddress.address || shippingAddress.fullAddress || 'Default Address';

    // Safely get phone number
    const rawPhone = shippingAddress.phoneNumber ||
      shippingAddress.phone ||
      order.customerPhone ||
      order.user?.phone ||
      '9999999999';
    const customerPhone = this.formatPhoneNumber(rawPhone);

    // Safely get pincode
    const customerPin = shippingAddress.zipCode ||
      shippingAddress.pincode ||
      shippingAddress.postal_code ||
      '400001';

    // Safely get city and state
    const customerCity = shippingAddress.city || 'Mumbai';
    const customerState = shippingAddress.state || 'Maharashtra';

    // Get warehouse details with defaults
    const warehousePin = warehouse.pin || warehouse.pincode || warehouse.zipCode || '400001';
    const warehouseCity = warehouse.city || warehouse.warehouse_city || 'Mumbai';
    const warehouseState = warehouse.state || warehouse.warehouse_state || 'Maharashtra';
    const warehousePhone = warehouse.phone || warehouse.warehouse_phone || '9999999999';
    const warehouseAddress = warehouse.address || warehouse.warehouse_address || 'Warehouse Address';

    return {
      // Required fields
      name: customerName,
      add: customerAddress,
      pin: customerPin,
      phone: customerPhone,
      order: order._id.toString(),
      payment_mode: paymentMode,

      // Optional fields
      city: customerCity,
      state: customerState,
      country: shippingAddress.country || 'India',
      address_type: 'home',

      // Return address fields (required for all shipments)
      return_name: warehouse.name || 'Return Center',
      return_add: warehouseAddress,
      return_city: warehouseCity,
      return_phone: warehousePhone,
      return_pin: warehousePin,
      return_state: warehouseState,
      return_country: warehouse.country || 'India',

      // Product details
      products_desc: order.orderItems?.map((item: any) => item.name).join(', ') || 'E-commerce Product',
      hsn_code: hsnCode,
      cod_amount: paymentMode === 'COD' ? (order.totalAmount?.toString() || '0') : '0',
      order_date: new Date().toISOString().split('T')[0], // Current date in YYYY-MM-DD format
      send_date: new Date().toISOString().split('T')[0], // CRITICAL: This field is required by Delhivery API
      end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // CRITICAL: End date (7 days from now)
      total_amount: order.totalAmount?.toString() || '100',
      quantity: order.orderItems?.length?.toString() || '1',

      // Seller information (required)
      seller_name: warehouse.name || 'Seller',
      seller_add: warehouseAddress,
      seller_inv: `INV_${order._id.toString().slice(-8)}_${Date.now()}`,

      // Shipment specifications
      weight: weight.toString(),
      shipment_width: dimensions.width.toString(),
      shipment_height: dimensions.height.toString(),
      shipment_length: dimensions.length.toString(),
      shipping_mode: request.shippingMode || 'Surface',

      // Special handling
      fragile_shipment: request.customFields?.fragile_shipment || false,
      dangerous_good: request.customFields?.dangerous_good || false,
      plastic_packaging: request.customFields?.plastic_packaging || false,

      // E-waybill (if applicable)
      ewb: '',

      // MPS specific
      ...(request.shipmentType === 'MPS' && {
        shipment_type: 'MPS',
        mps_amount: paymentMode === 'COD' ? (order.totalAmount?.toString() || '0') : '0',
        mps_children: request.packages?.length?.toString() || '1',
        master_id: request.packages?.[0]?.waybill || `MASTER_${order._id}_${Date.now()}`
      })
    };
  }

  private getPaymentMode(shipmentType: DelhiveryShipmentType, orderPaymentMethod: string): DelhiveryPaymentMode {
    switch (shipmentType) {
      case 'REVERSE':
        return 'Pickup';
      case 'REPLACEMENT':
        return 'REPL';
      default:
        return orderPaymentMethod === 'cod' ? 'COD' : 'Prepaid';
    }
  }

  private createShipmentDetails(
    request: ShipmentCreateRequest,
    warehouse: any,
    waybillNumbers: string[],
    delhiveryResponse: any
  ): ShipmentDetails {
    return {
      waybillNumbers,
      pickupLocation: warehouse.name,
      shippingMode: request.shippingMode,
      shipmentType: request.shipmentType,
      weight: request.weight,
      dimensions: request.dimensions,
      packages: request.packages,
      masterWaybill: request.shipmentType === 'MPS' ? waybillNumbers[0] : undefined,
      childWaybills: request.shipmentType === 'MPS' ? waybillNumbers.slice(1) : undefined,
      createdAt: new Date().toISOString(),
      delhiveryResponse
    };
  }

  private async updateOrderWithShipment(order: any, shipmentType: string, shipmentDetails: ShipmentDetails) {
    const updateData: any = {};

    switch (shipmentType) {
      case 'FORWARD':
      case 'MPS':
        updateData.shipmentCreated = true;
        updateData.status = 'Dispatched';
        updateData.shipmentDetails = shipmentDetails;
        break;
      case 'REVERSE':
        updateData.reverseShipment = shipmentDetails;
        updateData.status = 'Return Initiated';
        break;
      case 'REPLACEMENT':
        updateData.replacementShipment = shipmentDetails;
        updateData.status = 'Replacement Initiated';
        break;
    }

    await Order.findByIdAndUpdate(order._id, updateData);
  }

  private createDemoShipment(payload: DelhiveryCreatePayload) {
    const waybills = payload.shipments.map((_, index) =>
      `DEMO_${Date.now()}_${Math.floor(Math.random() * 1000)}_${index}`
    );

    return {
      waybills,
      response: {
        success: true,
        packages: waybills.map(waybill => ({ waybill, status: 'Success' })),
        rmk: 'Demo shipment created - Delhivery integration needed for production'
      }
    };
  }

  private createDemoTracking(waybill: string): TrackingInfo {
    return {
      waybill,
      status: 'In Transit',
      currentLocation: 'Demo Location',
      estimatedDelivery: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      scans: [
        {
          location: 'Origin Hub',
          status: 'Picked Up',
          instructions: 'Package picked up from origin',
          description: 'Shipment has been picked up',
          date: new Date().toISOString().split('T')[0],
          timestamp: new Date().toISOString()
        },
        {
          location: 'Transit Hub',
          status: 'In Transit',
          instructions: 'Package in transit',
          description: 'Shipment is in transit',
          date: new Date().toISOString().split('T')[0],
          timestamp: new Date().toISOString()
        }
      ]
    };
  }

  private parseTrackingResponse(response: any, waybill: string): TrackingInfo {
    // Handle Delhivery API error responses
    if (response.Success === false || response.Error) {
      console.log('[Shipment Service] Delhivery API error for waybill:', waybill, response.Error);
      return {
        waybill,
        status: 'No tracking data available',
        currentLocation: 'Waybill not found in Delhivery system',
        estimatedDelivery: 'Pending shipment creation',
        scans: [],
        isAvailable: false,
        message: response.Error || 'This waybill was not found in the Delhivery system. Please verify the waybill number or try again later.'
      };
    }

    const shipmentTrack = response.ShipmentTrack?.[0];

    // Handle case where waybill exists but no tracking data yet
    if (!shipmentTrack) {
      console.log('[Shipment Service] No tracking data for waybill:', waybill);
      return {
        waybill,
        status: 'No tracking data available',
        currentLocation: 'Waybill generated but not yet in transit',
        estimatedDelivery: 'Pending shipment creation',
        scans: [],
        isAvailable: false,
        message: 'This waybill has been generated but the shipment has not been created yet. Tracking will be available once the package is handed over to Delhivery.'
      };
    }

    return {
      waybill,
      status: shipmentTrack.Status?.Status || 'Unknown',
      currentLocation: shipmentTrack.Status?.StatusLocation,
      estimatedDelivery: shipmentTrack.Status?.StatusDateTime,
      scans: (shipmentTrack.Shipment?.Scans || []).map((scan: any) => ({
        location: scan.ScanDetail?.ScanLocation || '',
        status: scan.ScanDetail?.Scan || '',
        instructions: scan.ScanDetail?.Instructions || '',
        description: scan.ScanDetail?.Scan || '',
        date: scan.ScanDetail?.ScanDateTime?.split(' ')[0] || '',
        timestamp: scan.ScanDetail?.ScanDateTime || ''
      })),
      isAvailable: true,
      message: 'Tracking data available'
    };
  }

  private generateDemoWaybills(count: number): string[] {
    return Array.from({ length: count }, (_, index) =>
      `DEMO_WB_${Date.now()}_${index}`
    );
  }

  private getNextBusinessDay(): string {
    const today = new Date();
    let nextDay = new Date(today);
    nextDay.setDate(today.getDate() + 1);

    // If next day is Saturday (6) or Sunday (0), move to Monday
    while (nextDay.getDay() === 0 || nextDay.getDay() === 6) {
      nextDay.setDate(nextDay.getDate() + 1);
    }

    return nextDay.toISOString().split('T')[0]; // Return YYYY-MM-DD format
  }

  private generateHSNFromDescription(productName: string): string {
    // Default HSN codes for common product categories
    const hsnMap: { [key: string]: string } = {
      'clothing': '6109',
      'shirt': '6205',
      'tshirt': '6109',
      'dress': '6204',
      'electronics': '8517',
      'mobile': '8517',
      'phone': '8517',
      'laptop': '8471',
      'computer': '8471',
      'book': '4901',
      'shoes': '6403',
      'bag': '4202',
      'watch': '9102',
      'jewelry': '7113',
      'cosmetics': '3304',
      'perfume': '3303',
      'toy': '9503',
      'furniture': '9403',
      'home': '9403',
      'kitchen': '7323',
      'food': '2106',
      'health': '3004',
      'medicine': '3004',
      'sports': '9506',
      'automotive': '8708',
      'general': '9999'
    };

    const productLower = productName.toLowerCase();

    // Check for keyword matches
    for (const [keyword, hsn] of Object.entries(hsnMap)) {
      if (productLower.includes(keyword)) {
        return hsn;
      }
    }

    // Default HSN code for general products
    return '9999';
  }

  /**
   * Format phone number to valid Indian format
   */
  private formatPhoneNumber(phone: string): string {
    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, '');

    // Handle different formats
    if (digits.length === 10) {
      return digits;
    } else if (digits.length === 11 && digits.startsWith('0')) {
      return digits.substring(1);
    } else if (digits.length === 12 && digits.startsWith('91')) {
      return digits.substring(2);
    } else if (digits.length === 13 && digits.startsWith('+91')) {
      return digits.substring(3);
    }

    // Default fallback
    return '9999999999';
  }
}

export const shipmentService = new ShipmentService();
