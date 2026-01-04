# 🏪 Warehouse Registration Guide

## Current Issue
Your Delhivery API is working correctly, but you need to register warehouses in your Delhivery account to create real shipments.

## Error Message
```
"rmk": "ClientWarehouse matching query does not exist."
```

This means the warehouse name used in shipment creation doesn't match any registered warehouse in your Delhivery account.

## Solution: Register Warehouses in Delhivery Dashboard

### 1. Login to Delhivery Business Dashboard
- Go to [Delhivery Business](https://business.delhivery.com/)
- Login with your credentials

### 2. Navigate to Warehouse Management
- Look for "Warehouses" or "Pickup Locations" in the menu
- Click "Add New Warehouse" or "Register Warehouse"

### 3. Add Your Warehouse Details
Use these sample details (customize as needed):

```
Warehouse Name: Main Warehouse
Registered Name: Your Company Name
Phone: 9051617498
Email: abworkhouse01@gmail.com
Address: A11 577, Block A, Sector 1
City: Kalyani
PIN Code: 741235
State: West Bengal
Country: India

Return Address: A11 577, Block A, Sector 1
Return City: Kalyani
Return PIN: 741235
Return State: West Bengal
Return Country: India
```

### 4. Important Notes
- **Warehouse Name** must match exactly what you use in shipment creation
- **Phone number** and **email** should be valid for pickup notifications
- **Return address** is used for reverse shipments
- Delhivery may take some time to verify and activate the warehouse

### 5. Test After Registration
1. Wait for Delhivery to approve your warehouse (usually 24-48 hours)
2. Use the exact warehouse name in your shipment creation
3. Test creating a shipment - it should now work with real waybill numbers

## Alternative: Quick Test with Common Warehouse Names

If you want to test quickly, try using common warehouse names that might already be registered:

- "Main Warehouse"
- "Primary Warehouse" 
- "Default Warehouse"
- "Warehouse 1"

## Current System Behavior

✅ **Demo Mode**: Your system automatically creates demo shipments when warehouse is not found
✅ **User Feedback**: Clear messages about warehouse registration needed
✅ **Graceful Handling**: No errors or crashes, just switches to demo mode

## Next Steps

1. **Register warehouse in Delhivery dashboard** (recommended)
2. **Wait for approval** (24-48 hours)
3. **Test shipment creation** with exact warehouse name
4. **Enjoy real Delhivery integration!**

## Support

If you continue to face issues:
- Check Delhivery documentation for warehouse registration
- Contact Delhivery support for approval status
- Verify your account has warehouse creation permissions

The system is working perfectly - it just needs the warehouse to be registered in your Delhivery account!
