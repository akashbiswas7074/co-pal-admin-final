# Shipment Management System

## Overview
The production-ready shipment management system integrates with the Delhivery API to provide complete shipment creation, tracking, and management capabilities.

## Features
- **Order Integration**: Fetch and select orders from your backend
- **Shipment Creation**: Create shipments with complete order data
- **Real-time Tracking**: Track shipments using Delhivery API
- **Management Dashboard**: View, filter, and manage all shipments
- **Bulk Operations**: Handle multiple shipments efficiently
- **Error Handling**: Comprehensive error handling and user feedback

## Usage

### Access the System
Navigate to `/admin/shipment` to access the shipment management interface.

### Order Selection
1. The system automatically fetches orders from your backend API (`/api/orders`)
2. Use the search and filter options to find specific orders
3. Select an order to enable shipment creation

### Creating Shipments
1. Select an order from the order list
2. The system will populate shipment details from the order data
3. Configure shipment settings (type, mode, special instructions)
4. Click "Create Shipment" to submit to Delhivery API

### Tracking Shipments
1. Use the dashboard to view all shipments
2. Click on waybill numbers to view tracking details
3. Shipments are automatically updated with latest status

### Managing Shipments
- **View Details**: Click on any shipment to see complete information
- **Edit**: Modify shipment details if needed
- **Cancel**: Cancel shipments that haven't been dispatched
- **Generate Labels**: Download waybill labels for printing

## API Endpoints
- `GET /api/orders` - Fetch orders for shipment
- `POST /api/shipment/create` - Create new shipment
- `GET /api/shipment/list` - List all shipments
- `GET /api/shipment/tracking` - Track shipment status
- `GET /api/shipment/details` - Get shipment details
- `PUT /api/shipment/manage` - Update shipment
- `DELETE /api/shipment/manage` - Cancel shipment

## Configuration

### Environment Variables
Ensure the following environment variables are set:
```
DELHIVERY_API_KEY=your_api_key
DELHIVERY_API_URL=https://track.delhivery.com/api/cmu/create.json
DELHIVERY_STAGING=false
```

### Order API
The system expects your `/api/orders` endpoint to return orders in this format:
```json
{
  "success": true,
  "data": [
    {
      "_id": "order_id",
      "status": "Confirmed",
      "customerName": "Customer Name",
      "totalAmount": 1500,
      "shippingAddress": {
        "firstName": "First",
        "lastName": "Last",
        "address1": "Address Line 1",
        "city": "City",
        "state": "State",
        "zipCode": "123456"
      },
      "orderItems": [
        {
          "name": "Product Name",
          "qty": 1
        }
      ]
    }
  ]
}
```

## Production Deployment
1. Ensure all environment variables are properly set
2. Configure your order API endpoint
3. Set up proper authentication and permissions
4. Test with a few orders before full deployment
5. Monitor error logs for any issues

## Troubleshooting

### Common Issues
- **Orders not loading**: Check that `/api/orders` is accessible and returns proper format
- **Shipment creation fails**: Verify Delhivery API credentials and format
- **Tracking not working**: Ensure waybill numbers are valid and shipment exists in Delhivery

### Error Messages
- "Failed to fetch orders": Order API is not accessible or returning errors
- "Invalid response format": Order API response doesn't match expected structure
- "Shipment creation failed": Delhivery API error or invalid data

## Support
For issues or questions, check:
1. Error logs in browser developer console
2. Server logs for API errors
3. Delhivery API documentation for shipping requirements
