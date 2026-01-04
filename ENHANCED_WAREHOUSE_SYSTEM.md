# 🏪 Enhanced Warehouse Management System

## Overview

The Enhanced Warehouse Management System provides comprehensive warehouse creation, update, and synchronization functionality with the Delhivery API. This system ensures seamless integration between your local MongoDB database and Delhivery's warehouse registry.

## Features

### ✨ Core Features
- **Robust Warehouse Creation**: Create warehouses with comprehensive validation
- **Smart Update System**: Update warehouse details with selective field updates
- **Bidirectional Sync**: Synchronize data between MongoDB and Delhivery
- **Enhanced Error Handling**: Graceful fallbacks and detailed error messages
- **Multi-endpoint Support**: Try multiple Delhivery endpoints for reliability
- **Real-time Validation**: Validate data before sending to Delhivery
- **Comprehensive Logging**: Detailed logs for debugging and monitoring

### 🔄 Sync Capabilities
- **Sync from Delhivery**: Import warehouses from Delhivery to MongoDB
- **Sync to Delhivery**: Register local warehouses with Delhivery
- **Full Bidirectional Sync**: Complete synchronization in both directions
- **Conflict Resolution**: Handle data conflicts intelligently

## API Endpoints

### Enhanced Warehouse Management
```
POST   /api/warehouse/enhanced          - Create warehouse with enhanced validation
GET    /api/warehouse/enhanced          - List warehouses with pagination
PUT    /api/warehouse/enhanced/update   - Update warehouse details
DELETE /api/warehouse/enhanced/update   - Deactivate warehouse
GET    /api/warehouse/enhanced/update   - Get warehouse details
```

### Synchronization
```
POST   /api/warehouse/sync              - Trigger sync operations
GET    /api/warehouse/sync              - Get sync status and statistics
```

### Legacy Support
```
POST   /api/warehouse                   - Legacy warehouse creation (enhanced)
GET    /api/warehouse                   - Legacy warehouse listing
PUT    /api/warehouse/update            - Legacy warehouse update
DELETE /api/warehouse/update            - Legacy warehouse deletion
```

## Usage Examples

### 1. Create Warehouse

```javascript
const response = await fetch('/api/warehouse/enhanced', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: 'Main Warehouse',
    phone: '9051617498',
    email: 'warehouse@example.com',
    address: 'A11 577, Block A, Sector 1',
    city: 'Kalyani',
    pin: '741235',
    state: 'West Bengal',
    country: 'India',
    return_address: 'A11 577, Block A, Sector 1',
    return_city: 'Kalyani',
    return_pin: '741235',
    return_state: 'West Bengal',
    return_country: 'India'
  })
});

const result = await response.json();
console.log(result);
```

### 2. Update Warehouse

```javascript
const response = await fetch('/api/warehouse/enhanced/update', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: 'Main Warehouse',  // Required - cannot be changed
    address: 'Updated Address Line',
    pin: '741236',
    phone: '9051617499'
  })
});

const result = await response.json();
console.log(result);
```

### 3. Sync Warehouses

```javascript
// Sync from Delhivery to MongoDB
const syncFromDelhivery = await fetch('/api/warehouse/sync', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    action: 'sync-from-delhivery'
  })
});

// Sync to Delhivery from MongoDB
const syncToDelhivery = await fetch('/api/warehouse/sync', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    action: 'sync-to-delhivery'
  })
});

// Full bidirectional sync
const fullSync = await fetch('/api/warehouse/sync', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    action: 'full-sync'
  })
});
```

### 4. List Warehouses with Pagination

```javascript
const response = await fetch('/api/warehouse/enhanced?page=1&limit=10&status=active');
const result = await response.json();

console.log('Warehouses:', result.data);
console.log('Pagination:', result.pagination);
```

## Configuration

### Environment Variables

Ensure these environment variables are configured in your `.env.local` file:

```env
# Delhivery API Configuration
DELHIVERY_AUTH_TOKEN=your-actual-delhivery-token-here
DELHIVERY_BASE_URL=https://staging-express.delhivery.com
DELHIVERY_PRODUCTION_URL=https://track.delhivery.com

# Database Configuration
MONGODB_URI=your-mongodb-connection-string

# Application Environment
NODE_ENV=development
```

### Required Fields for Warehouse Creation

**Mandatory Fields:**
- `name` (string): Warehouse name (case-sensitive)
- `phone` (string): Contact number (10-15 digits)
- `pin` (string): 6-digit pincode
- `return_address` (string): Return address for shipments

**Optional Fields:**
- `registered_name` (string): Registered account name
- `email` (string): Email address
- `address` (string): Complete warehouse address
- `city` (string): City name
- `state` (string): State name
- `country` (string): Country (default: 'India')
- `return_city`, `return_pin`, `return_state`, `return_country`: Return address details

## Error Handling

The system provides comprehensive error handling:

### Common Error Codes
- `WAREHOUSE_DUPLICATE`: Warehouse name already exists
- `VALIDATION_ERROR`: Input validation failed
- `AUTH_ERROR`: Authentication failed
- `DELHIVERY_ERROR`: Delhivery API error
- `NETWORK_ERROR`: Network connectivity issue

### Error Response Format
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

### Success Response Format
```json
{
  "success": true,
  "message": "Success message",
  "data": {
    "warehouseId": "...",
    "warehouseName": "...",
    "warehouse": { ... },
    "delhiveryResponse": { ... }
  }
}
```

## Data Flow

### 1. Warehouse Creation Flow
```
User Input → Validation → MongoDB Check → Delhivery API → MongoDB Save → Response
```

### 2. Warehouse Update Flow
```
User Input → Validation → MongoDB Find → Delhivery API → MongoDB Update → Response
```

### 3. Sync Flow
```
Trigger → Fetch Data → Compare → Update/Create → Conflict Resolution → Response
```

## Best Practices

### 1. Warehouse Naming
- Use consistent, descriptive names
- Avoid special characters
- Keep names under 100 characters
- Use exact same name in shipment creation

### 2. Data Validation
- Always validate phone numbers and pincodes
- Ensure return address is provided
- Use valid email addresses

### 3. Error Handling
- Always check response status
- Handle network timeouts gracefully
- Provide user-friendly error messages
- Log errors for debugging

### 4. Synchronization
- Run sync operations during low-traffic periods
- Monitor sync status regularly
- Handle conflicts based on business rules
- Keep audit logs of sync operations

## Monitoring and Debugging

### Check Configuration
```bash
node scripts/check-warehouse-config.js
```

### Monitor API Calls
Check the console logs for detailed API call information:
```
[Warehouse API] Creating warehouse with data: {...}
[Warehouse API] Trying PUT https://staging-express.delhivery.com/...
[Warehouse API] Response status: 200
[Warehouse API] Success: {...}
```

### Database Queries
Monitor MongoDB operations:
```javascript
// Find warehouses needing sync
db.warehouses.find({ delhiveryResponse: { $exists: false } })

// Check warehouse status distribution
db.warehouses.aggregate([
  { $group: { _id: "$status", count: { $sum: 1 } } }
])
```

## Troubleshooting

### Common Issues

1. **Authentication Failed (401)**
   - Check DELHIVERY_AUTH_TOKEN in environment
   - Verify token is valid and active
   - Ensure token has warehouse management permissions

2. **Warehouse Already Exists (409)**
   - Use a different warehouse name
   - Check existing warehouses in Delhivery dashboard
   - Consider updating instead of creating

3. **Network Timeout**
   - Check internet connectivity
   - Verify Delhivery API status
   - Try again after some time

4. **Validation Errors**
   - Check required fields are provided
   - Validate phone number format
   - Ensure pincode is 6 digits

### Support

For additional support:
1. Check the console logs for detailed error information
2. Verify environment configuration
3. Test API connectivity using the check script
4. Contact Delhivery support for API-specific issues

## Migration from Legacy System

If you're migrating from the old warehouse system:

1. **Backup existing data**
2. **Update API endpoints** to use `/api/warehouse/enhanced`
3. **Run sync operations** to align with Delhivery
4. **Update frontend components** to use new features
5. **Test thoroughly** before going to production

The enhanced system is backward compatible with the legacy endpoints for smooth migration.
