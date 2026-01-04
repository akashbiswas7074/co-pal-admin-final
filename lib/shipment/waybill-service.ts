/**
 * Waybill Management Service
 * Handles waybill generation, storage, and allocation
 * 
 * Implements Delhivery's recommended approach:
 * - Pre-generate waybills in bulk and store them
 * - Use stored waybills during shipment creation
 * - Handle waybill lifecycle (generated -> reserved -> used/cancelled)
 */

import { connectToDatabase } from '@/lib/database/connect';
import Waybill from '@/lib/database/models/waybill.model';
import { delhiveryAPI } from '@/lib/shipment/delhivery-api';

export class WaybillService {
  /**
   * Generate and store waybills in the database
   */
  async generateAndStoreWaybills(count: number, source: 'DELHIVERY_BULK' | 'DELHIVERY_SINGLE' | 'DEMO' = 'DELHIVERY_BULK'): Promise<string[]> {
    await connectToDatabase();
    
    console.log(`[Waybill Service] Generating and storing ${count} waybills`);
    
    let waybills: string[] = [];
    
    try {
      if (source === 'DEMO' || !delhiveryAPI.isConfigured()) {
        // Generate demo waybills
        waybills = this.generateDemoWaybills(count);
        source = 'DEMO';
      } else {
        // Generate real waybills from Delhivery API
        waybills = await delhiveryAPI.generateWaybillsWithFallback(count);
      }
      
      // Store waybills in database
      const waybillDocs = waybills.map(waybill => ({
        waybill,
        status: 'GENERATED',
        source,
        generatedAt: new Date(),
        metadata: {
          batchId: `batch_${Date.now()}`,
          generatedCount: count
        }
      }));
      
      await Waybill.insertMany(waybillDocs, { ordered: false });
      
      console.log(`[Waybill Service] Successfully stored ${waybills.length} waybills`);
      return waybills;
      
    } catch (error) {
      console.error('[Waybill Service] Error generating/storing waybills:', error);
      throw error;
    }
  }

  /**
   * Get available waybills from database
   */
  async getAvailableWaybills(count: number, source?: string): Promise<string[]> {
    await connectToDatabase();
    
    console.log(`[Waybill Service] Getting ${count} available waybills`);
    
    try {
      const waybillDocs = await (Waybill as any).getAvailableWaybills(count, source);
      const waybills = waybillDocs.map((doc: any) => doc.waybill);
      
      console.log(`[Waybill Service] Found ${waybills.length} available waybills`);
      return waybills;
      
    } catch (error) {
      console.error('[Waybill Service] Error getting available waybills:', error);
      throw error;
    }
  }

  /**
   * Reserve waybills for a specific use
   */
  async reserveWaybills(waybills: string[], reservedBy: string): Promise<boolean> {
    await connectToDatabase();
    
    console.log(`[Waybill Service] Reserving ${waybills.length} waybills for ${reservedBy}`);
    
    try {
      const result = await (Waybill as any).reserveWaybills(waybills, reservedBy);
      
      console.log(`[Waybill Service] Reserved ${result.modifiedCount} waybills`);
      return result.modifiedCount === waybills.length;
      
    } catch (error) {
      console.error('[Waybill Service] Error reserving waybills:', error);
      throw error;
    }
  }

  /**
   * Use a waybill for a specific order/shipment
   */
  async useWaybill(waybill: string, orderId: string, shipmentId: string): Promise<boolean> {
    await connectToDatabase();
    
    console.log(`[Waybill Service] Using waybill ${waybill} for order ${orderId}`);
    
    try {
      const result = await (Waybill as any).useWaybill(waybill, orderId, shipmentId);
      
      console.log(`[Waybill Service] Used waybill, modified count: ${result.modifiedCount}`);
      return result.modifiedCount === 1;
      
    } catch (error) {
      console.error('[Waybill Service] Error using waybill:', error);
      throw error;
    }
  }

  /**
   * Cancel a waybill
   */
  async cancelWaybill(waybill: string): Promise<boolean> {
    await connectToDatabase();
    
    console.log(`[Waybill Service] Cancelling waybill ${waybill}`);
    
    try {
      const result = await (Waybill as any).cancelWaybill(waybill);
      
      console.log(`[Waybill Service] Cancelled waybill, modified count: ${result.modifiedCount}`);
      return result.modifiedCount === 1;
      
    } catch (error) {
      console.error('[Waybill Service] Error cancelling waybill:', error);
      throw error;
    }
  }

  /**
   * Get waybill statistics
   */
  async getWaybillStats(): Promise<{
    total: number;
    generated: number;
    reserved: number;
    used: number;
    cancelled: number;
    bySource: Record<string, number>;
  }> {
    await connectToDatabase();
    
    try {
      const stats = await Waybill.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            generated: { $sum: { $cond: [{ $eq: ['$status', 'GENERATED'] }, 1, 0] } },
            reserved: { $sum: { $cond: [{ $eq: ['$status', 'RESERVED'] }, 1, 0] } },
            used: { $sum: { $cond: [{ $eq: ['$status', 'USED'] }, 1, 0] } },
            cancelled: { $sum: { $cond: [{ $eq: ['$status', 'CANCELLED'] }, 1, 0] } }
          }
        }
      ]);
      
      const sourceStats = await Waybill.aggregate([
        {
          $group: {
            _id: '$source',
            count: { $sum: 1 }
          }
        }
      ]);
      
      const bySource = sourceStats.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {});
      
      return {
        total: stats[0]?.total || 0,
        generated: stats[0]?.generated || 0,
        reserved: stats[0]?.reserved || 0,
        used: stats[0]?.used || 0,
        cancelled: stats[0]?.cancelled || 0,
        bySource
      };
      
    } catch (error) {
      console.error('[Waybill Service] Error getting waybill stats:', error);
      throw error;
    }
  }

  /**
   * Ensure minimum waybill stock
   */
  async ensureMinimumStock(minStock: number = 100): Promise<void> {
    await connectToDatabase();
    
    console.log(`[Waybill Service] Ensuring minimum stock of ${minStock} waybills`);
    
    try {
      const availableWaybills = await (Waybill as any).getAvailableWaybills(minStock);
      const currentStock = availableWaybills.length;
      
      if (currentStock < minStock) {
        const needed = minStock - currentStock;
        console.log(`[Waybill Service] Need to generate ${needed} more waybills`);
        
        await this.generateAndStoreWaybills(needed);
        console.log(`[Waybill Service] Successfully replenished waybill stock`);
      } else {
        console.log(`[Waybill Service] Stock is sufficient: ${currentStock} waybills available`);
      }
      
    } catch (error) {
      console.error('[Waybill Service] Error ensuring minimum stock:', error);
      throw error;
    }
  }

  /**
   * Generate demo waybills for testing
   */
  private generateDemoWaybills(count: number): string[] {
    const waybills: string[] = [];
    const timestamp = Date.now();
    
    for (let i = 0; i < count; i++) {
      const waybill = `DEMO_${timestamp}_${String(i + 1).padStart(3, '0')}`;
      waybills.push(waybill);
    }
    
    return waybills;
  }
}

export const waybillService = new WaybillService();
