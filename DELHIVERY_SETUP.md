# Delhivery API Setup Guide

## Getting Your Delhivery API Token

1. **Sign up for Delhivery Business Account**
   - Go to [Delhivery Business](https://business.delhivery.com/)
   - Create an account or log in to your existing account

2. **Access API Configuration**
   - Navigate to your dashboard
   - Go to "API Configuration" or "Developer Settings"
   - You should see your API token/key

3. **Configure Environment Variables**
   - Copy your API token
   - Open `.env.local` file in your project root
   - Replace `your-delhivery-auth-token-here` with your actual token:
   ```
   DELHIVERY_AUTH_TOKEN=your-actual-token-here
   ```

4. **Test the Integration**
   - Restart your development server: `npm run dev`
   - Try creating a warehouse through the admin/vendor panel
   - Check the logs for successful API calls

## API Endpoints Used

- **Staging**: `https://staging-express.delhivery.com/api/backend/clientwarehouse/create/`
- **Production**: `https://track.delhivery.com/api/backend/clientwarehouse/edit/`

## Current Status

✅ **Working without Delhivery API**: The system creates warehouses in your MongoDB database with demo responses
✅ **Fallback handling**: If Delhivery API fails, warehouses are still saved locally
⚠️ **401 Unauthorized**: This means your API token needs to be configured properly

## Next Steps

1. Get your Delhivery API token
2. Update `.env.local` with the token
3. Restart the development server
4. Test warehouse creation - you should see successful Delhivery API calls in the logs

## Support

If you continue to face issues:
- Check that your Delhivery account is properly activated
- Ensure you're using the correct API token format
- Verify your account has warehouse creation permissions
- Contact Delhivery support for API-specific issues
