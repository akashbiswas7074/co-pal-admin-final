# Complete Delhivery API Setup Guide

## 🚀 Quick Setup

### 1. Get Your Delhivery API Credentials

1. **Sign up for Delhivery Business Account**
   - Go to [Delhivery Business](https://business.delhivery.com/)
   - Create an account or log in to your existing account
   - Complete the KYC verification process

2. **Access API Configuration**
   - Navigate to your Delhivery dashboard
   - Go to "API Configuration" or "Developer Settings"
   - Copy your API token/key

### 2. Configure Environment Variables

1. **Create `.env.local` file**
   ```bash
   cp .env.example .env.local
   ```

2. **Update `.env.local` with your credentials**
   ```bash
   # Delhivery API Configuration
   DELHIVERY_AUTH_TOKEN=your-actual-delhivery-token-here
   DELHIVERY_BASE_URL=https://staging-express.delhivery.com
   DELHIVERY_PRODUCTION_URL=https://track.delhivery.com
   
   # Other required environment variables
   MONGODB_URI=your-mongodb-connection-string
   NEXTAUTH_SECRET=your-nextauth-secret
   JWT_SECRET=your-jwt-secret
   ```

3. **Restart your development server**
   ```bash
   npm run dev
   ```

## 🔧 Current System Status

### ✅ Working Features (Without API)
- **Shipment Management**: Create, view, and manage shipments in your database
- **Order Integration**: Link shipments to orders
- **Warehouse Management**: Select pickup locations
- **Auto-generation**: HSN codes and waybill numbers
- **Status Tracking**: Update shipment status
- **Demo Mode**: Fallback to demo data when API is not configured

### ⚠️ Features Requiring API Configuration
- **Real Delhivery Integration**: Actual shipment creation with Delhivery
- **Live Tracking**: Real-time shipment tracking
- **Waybill Generation**: Official Delhivery waybill numbers
- **Pickup Scheduling**: Automated pickup requests

## 🛠️ API Configuration Steps

### Step 1: Environment Setup
```bash
# Copy example environment file
cp .env.example .env.local

# Edit with your actual credentials
nano .env.local
```

### Step 2: Delhivery Token Configuration
Replace `your-delhivery-auth-token-here` with your actual token:
```bash
DELHIVERY_AUTH_TOKEN=your-actual-token-from-delhivery-dashboard
```

### Step 3: Test the Integration
```bash
# Restart server
npm run dev

# Test shipment creation through the admin panel
# Check browser console and terminal logs for API calls
```

## 🔍 Troubleshooting

### Common Issues

1. **401 Unauthorized Error**
   - Check if your API token is correct
   - Verify your Delhivery account is active
   - Ensure you have the right permissions

2. **Token Not Found**
   - Verify `.env.local` file exists
   - Check if `DELHIVERY_AUTH_TOKEN` is set
   - Restart the development server

3. **Demo Mode Always Active**
   - This means the API configuration is missing or incorrect
   - Check your token and restart the server

### Error Messages Guide

| Error Message | Meaning | Solution |
|--------------|---------|----------|
| "Delhivery auth token not configured" | No token set in environment | Add token to `.env.local` |
| "401 Unauthorized" | Invalid or expired token | Update token in Delhivery dashboard |
| "403 Forbidden" | Insufficient permissions | Contact Delhivery support |
| "Demo shipment created" | API fallback mode | Configure proper API credentials |

## 📊 Testing Your Setup

### 1. Check Environment Variables
```bash
# In your terminal (with server running)
echo $DELHIVERY_AUTH_TOKEN
```

### 2. Test API Connection
- Go to Admin → Shipments
- Click "Create New Shipment"
- Fill in the form and submit
- Check the success message:
  - ✅ "Shipment created successfully" = API working
  - ⚠️ "Demo shipment created" = API not configured

### 3. Check Logs
Monitor your terminal for API calls:
```
[Shipment API] Trying staging API: https://staging-express.delhivery.com/api/cmu/create.json
[Shipment API] Staging response status: 200
[Shipment API] Staging success: { success: true, ... }
```

## 📞 Support

### If You Need Help
1. Check the [Delhivery API Documentation](https://www.delhivery.com/api/)
2. Verify your account status in the Delhivery dashboard
3. Contact Delhivery support for API-related issues
4. Check the browser console and terminal logs for detailed errors

### System Requirements
- ✅ Node.js 18+ 
- ✅ MongoDB database
- ✅ Active Delhivery business account
- ✅ Valid API credentials

## 🎯 Next Steps

Once configured, you can:
1. Create real shipments with Delhivery
2. Track shipments in real-time
3. Generate official waybill numbers
4. Schedule automated pickups
5. Integrate with your fulfillment workflow

---

**Note**: The system is designed to work gracefully without API configuration, falling back to demo mode for development and testing purposes.
