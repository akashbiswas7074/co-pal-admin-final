# Deployment Guide

## Environment Variables Required

Create a `.env.local` file in the root directory with the following variables:

```env
# Database Configuration
MONGODB_URL=mongodb://localhost:27017/vibecart

# Authentication
NEXTAUTH_SECRET=your-nextauth-secret-key
NEXTAUTH_URL=http://localhost:3001

# Cloudinary Configuration (for image uploads)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_SECRET=your-secret

# Email Configuration (optional)
EMAIL_SERVER_HOST=smtp.gmail.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=your-email@gmail.com
EMAIL_SERVER_PASSWORD=your-app-password

# Delhivery Configuration (for shipping)
DELHIVERY_TOKEN=your-delhivery-token
DELHIVERY_BASE_URL=https://track.delhivery.com

# Other Configuration
NODE_ENV=development
```

## Vercel Deployment

For Vercel deployment, add these environment variables in your Vercel project settings:

1. Go to your Vercel project dashboard
2. Navigate to Settings > Environment Variables
3. Add each variable from the list above

## Build Issues Fixed

The following issues have been resolved in the codebase:

1. **Missing MONGODB_URL Error**: Added proper error handling for database connection failures
2. **Cannot read properties of undefined (reading 'length')**: Added safety checks for undefined data arrays
3. **Build-time data fetching**: Added try-catch blocks around all database operations

## Local Development

1. Install dependencies:
   ```bash
   npm install --legacy-peer-deps
   ```

2. Set up environment variables (see above)

3. Run the development server:
   ```bash
   npm run dev
   ```

## Production Build

1. Ensure all environment variables are set
2. Run the build command:
   ```bash
   npm run build
   ```

## Common Issues

### Build Fails with "Missing MONGODB_URL"
- Ensure `MONGODB_URL` is set in your environment variables
- For Vercel, add it in the project settings

### "Cannot read properties of undefined"
- This has been fixed with proper error handling
- The app will now gracefully handle missing data

### Material-UI Deprecation Warnings
- These are warnings and won't affect functionality
- Consider upgrading to MUI v5 in the future
