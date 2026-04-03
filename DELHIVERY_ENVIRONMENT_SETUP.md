# Delhivery Environment Setup Guide

## Overview
This guide explains how to configure and use the Delhivery API in both **test (staging)** and **production** environments.

## Quick Start

### 1. Check Current Environment
```bash
npm run env:status
```

### 2. Switch to Test Environment
```bash
npm run env:test
```

### 3. Switch to Production Environment
```bash
npm run env:prod
```

### 4. Test Delhivery API
```bash
npm run test:delhivery
```

### 5. Test Shipment Creation
```bash
npm run test:shipment
```

## Environment Details

### Test/Staging Environment
- **URL**: `https://staging-express.delhivery.com`
- **Purpose**: Safe testing without real charges
- **Configuration**: `DELHIVERY_TEST_MODE=true` or `NODE_ENV=development`
- **Benefits**:
  - No real shipments created
  - No charges applied
  - Full API functionality
  - Safe for development and testing

### Production Environment
- **URL**: `https://track.delhivery.com`
- **Purpose**: Live shipment creation
- **Configuration**: `DELHIVERY_TEST_MODE=false` and `NODE_ENV=production`
- **⚠️ Warning**: Real charges and shipments will be created

## API Configuration

### Environment Variables
```bash
# Enable test mode
DELHIVERY_TEST_MODE=true
NODE_ENV=development

# Authentication
DELHIVERY_AUTH_TOKEN=your_token_here

# Optional: Override base URL
DELHIVERY_BASE_URL=https://track.delhivery.com
```

### Important Notes
1. **Different Credentials**: Staging and production may require different authentication tokens
2. **Warehouse Registration**: Warehouses need to be registered separately in each environment
3. **Token Validation**: Your production token might not work in staging

## API Endpoints

### Staging Environment
- **Shipment Creation**: `https://staging-express.delhivery.com/api/cmu/create.json`
- **Pincode Check**: `https://staging-express.delhivery.com/c/api/pin-codes/json/`
- **Waybill Generation**: `https://staging-express.delhivery.com/waybill/api/bulk/json/`
- **Warehouse List**: `https://staging-express.delhivery.com/api/backend/clientwarehouse/all/`

### Production Environment
- **Shipment Creation**: `https://track.delhivery.com/api/cmu/create.json`
- **Pincode Check**: `https://track.delhivery.com/c/api/pin-codes/json/`
- **Waybill Generation**: `https://track.delhivery.com/waybill/api/bulk/json/`
- **Warehouse List**: `https://track.delhivery.com/api/backend/clientwarehouse/all/`

## Testing Commands

### Environment Management
```bash
# Check current environment
npm run env:status

# Switch to test mode
npm run env:test

# Switch to production mode
npm run env:prod
```

### API Testing
```bash
# Test environment configuration
npm run test:env

# Test Delhivery API endpoints
npm run test:delhivery

# Test shipment creation flow
npm run test:shipment
```

### Warehouse Management
```bash
# Check warehouse configuration
npm run check-warehouse

# Test warehouse fetching
npm run test-warehouse

# Verify warehouse system
npm run verify-warehouse
```

## Shipment Creation Example

### Test Shipment Payload
```json
{
  "shipments": [
    {
      "name": "Test Customer",
      "add": "Test Address, Test Area",
      "pin": "700001",
      "city": "Kolkata",
      "state": "West Bengal",
      "country": "India",
      "phone": "9999999999",
      "order": "TEST_ORDER_123",
      "payment_mode": "Prepaid",
      "return_pin": "700001",
      "return_city": "Kolkata",
      "return_phone": "9999999999",
      "return_add": "Test Warehouse Address",
      "return_state": "West Bengal",
      "return_country": "India",
      "products_desc": "Test Product",
      "hsn_code": "1234",
      "cod_amount": "0",
      "order_date": "2025-01-04",
      "total_amount": "100",
      "seller_add": "Test Seller Address",
      "seller_name": "Test Seller",
      "seller_inv": "INV_123",
      "quantity": "1",
      "waybill": "",
      "shipment_width": "10",
      "shipment_height": "10",
      "shipment_length": "10",
      "weight": "500",
      "shipping_mode": "Surface",
      "address_type": "home"
    }
  ],
  "pickup_location": {
    "name": "Test Warehouse"
  }
}
```

## Common Issues and Solutions

### 1. Authentication Error (401)
- **Issue**: Token not valid for staging environment
- **Solution**: Staging may require different credentials

### 2. Warehouse Not Found (404)
- **Issue**: Warehouse not registered in current environment
- **Solution**: Register warehouse in staging/production separately

### 3. Bad Request (400)
- **Issue**: Invalid payload format
- **Solution**: Check payload structure against API documentation

### 4. Insufficient Balance
- **Issue**: Not enough credits in Delhivery account
- **Solution**: Recharge account or use staging for testing

## Security Best Practices

1. **Never commit credentials** to version control
2. **Use environment variables** for sensitive data
3. **Test in staging** before production deployment
4. **Monitor API usage** and costs
5. **Implement error handling** for API failures

## Integration Flow

1. **Start with staging** environment for development
2. **Test all features** thoroughly in staging
3. **Validate credentials** and warehouse registration
4. **Switch to production** only when ready
5. **Monitor production** shipments closely

## Support

For issues:
1. Check the console logs for detailed error messages
2. Verify environment configuration with `npm run env:status`
3. Test API connectivity with `npm run test:delhivery`
4. Review Delhivery API documentation
5. Contact Delhivery support for authentication issues

---

**Remember**: Always test in staging before production deployment!
