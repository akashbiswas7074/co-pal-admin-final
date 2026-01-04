# Enhanced Delhivery Shipment Management System

## Overview

This comprehensive shipment management system provides full integration with Delhivery's API for creating and managing B2C shipments in the e-commerce admin panel. The system supports all major shipment types and provides a modern, user-friendly interface.

## Features

### Shipment Types Supported

1. **Forward Shipment (B2C)**
   - Standard delivery to customers
   - Automatic waybill generation
   - Real-time tracking integration

2. **Reverse Shipment (RVP)**
   - Return pickup from customers
   - Automated return processing
   - Return reason tracking

3. **Replacement Shipment (REPL)**
   - Exchange shipments for product replacement
   - Seamless return-to-replacement workflow
   - Customer satisfaction tracking

4. **Multi-Package Shipment (MPS)**
   - Multiple packages in a single shipment
   - Master waybill with child waybills
   - Individual package tracking

### Advanced Features

- **Warehouse Integration**: Multiple pickup location support
- **Custom Dimensions**: Flexible package sizing
- **Special Handling**: Fragile, dangerous goods, plastic packaging
- **Compliance**: HSN codes, E-waybill support for high-value shipments
- **Real-time Tracking**: Direct integration with Delhivery tracking
- **Responsive UI**: Mobile-friendly design with modern interface

## Architecture

### Frontend Components

```
components/shared/shipment/
├── ShipmentManager.tsx          # Main shipment management component
└── types/shipment.ts           # TypeScript definitions
```

### Backend APIs

```
app/api/shipment/
├── route.ts                    # Main shipment creation and fetching
├── waybills/route.ts          # Waybill generation
└── track/route.ts             # Shipment tracking
```

### Type Definitions

```typescript
// Core interfaces for type safety
export interface ShipmentCreateRequest {
  orderId: string;
  shipmentType: 'FORWARD' | 'REVERSE' | 'REPLACEMENT' | 'MPS';
  pickupLocation: string;
  shippingMode: 'Surface' | 'Express';
  weight?: number;
  dimensions?: ShipmentDimensions;
  packages?: ShipmentPackage[];
  customFields?: ShipmentCustomFields;
}
```

## API Endpoints

### GET /api/shipment
Fetch shipment data for an order

**Parameters:**
- `orderId`: Order ID to fetch shipment data for

**Response:**
```json
{
  "success": true,
  "data": {
    "orderId": "...",
    "hasShipment": false,
    "availableActions": ["FORWARD", "REVERSE", "REPLACEMENT", "MPS"],
    "warehouses": [...]
  }
}
```

### POST /api/shipment
Create a new shipment

**Request Body:**
```json
{
  "orderId": "...",
  "shipmentType": "FORWARD",
  "pickupLocation": "Main Warehouse",
  "shippingMode": "Surface",
  "weight": 500,
  "dimensions": {
    "length": 10,
    "width": 10,
    "height": 10
  },
  "customFields": {
    "fragile_shipment": false,
    "dangerous_good": false,
    "plastic_packaging": false,
    "hsn_code": "",
    "ewb": ""
  }
}
```

### POST /api/shipment/waybills
Generate waybills for existing packages

### GET /api/shipment/track
Track shipment by waybill number

## Usage

### Basic Implementation

```tsx
import { ShipmentManager } from '@/components/shared/shipment/ShipmentManager';

function OrderDetailsPage({ orderId }: { orderId: string }) {
  const handleShipmentCreated = (data) => {
    console.log('Shipment created:', data);
    // Handle shipment creation success
  };

  return (
    <ShipmentManager
      orderId={orderId}
      onShipmentCreated={handleShipmentCreated}
    />
  );
}
```

### Advanced Usage with Custom Styling

```tsx
<ShipmentManager
  orderId={orderId}
  onShipmentCreated={handleShipmentCreated}
  className="custom-shipment-manager"
/>
```

## Configuration

### Environment Variables

```env
# Delhivery API Configuration
DELHIVERY_API_TOKEN=your_delhivery_token
DELHIVERY_BASE_URL=https://staging-express.delhivery.com

# Database Configuration
MONGODB_URI=your_mongodb_connection_string
```

### Warehouse Setup

Warehouses must be configured in the database with the following structure:

```javascript
{
  name: "Main Warehouse",
  address: "123 Business Street",
  pincode: "110001",
  phone: "+91-9876543210",
  active: true
}
```

## Delhivery API Integration

### Supported Endpoints

- **Create Shipment**: `/api/cmu/create.json`
- **Generate Waybills**: `/waybill/api/bulk/json/`
- **Track Shipment**: `/api/v1/packages/json/`

### Error Handling

The system includes comprehensive error handling:

- API timeout handling
- Network failure recovery
- Invalid data validation
- User-friendly error messages

## Testing

### Test Page

A comprehensive test page is available at `/admin/dashboard/shipment-test` for testing all shipment functionalities.

### Sample Test Cases

1. **Forward Shipment Creation**
   - Single package delivery
   - Multi-package delivery (MPS)
   - Express vs Surface shipping

2. **Return Processing**
   - Reverse pickup (RVP)
   - Replacement shipment (REPL)

3. **Special Handling**
   - Fragile items
   - Dangerous goods
   - High-value shipments with e-waybill

## Security

- Server-side API authentication
- Input validation and sanitization
- Rate limiting for API calls
- Secure environment variable handling

## Performance

- Lazy loading of components
- Optimized API calls
- Efficient state management
- Responsive UI design

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Dependencies

### Core Dependencies
- React 18+
- Next.js 14+
- TypeScript 5+
- Tailwind CSS 3+

### UI Components
- Lucide React (icons)
- Custom UI components

### API Integration
- Native fetch API
- Error boundary handling

## Troubleshooting

### Common Issues

1. **Waybill Generation Fails**
   - Check Delhivery API credentials
   - Verify pickup location configuration
   - Ensure order data completeness

2. **Tracking Not Working**
   - Verify waybill number format
   - Check Delhivery API status
   - Ensure proper error handling

3. **UI Not Responsive**
   - Check CSS class conflicts
   - Verify Tailwind CSS configuration
   - Test mobile viewport settings

### Debug Mode

Enable debug logging by setting:
```env
NODE_ENV=development
DEBUG_SHIPMENT=true
```

## Contributing

1. Follow TypeScript best practices
2. Maintain comprehensive error handling
3. Add unit tests for new features
4. Update documentation for API changes

## Support

For issues and feature requests, please refer to the project documentation or contact the development team.

---

**Last Updated**: January 2025
**Version**: 2.0.0
