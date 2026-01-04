#!/bin/bash

# Setup script for Delhivery E-commerce Admin Panel
# This script helps configure the environment and API tokens

echo "🚀 Setting up Delhivery E-commerce Admin Panel..."
echo "================================================"

# Check if .env.local exists
if [ -f ".env.local" ]; then
    echo "✅ .env.local file already exists"
    echo "📝 To reconfigure, you can manually edit .env.local or delete it and run this script again"
else
    echo "📄 Creating .env.local file from template..."
    cp .env.example .env.local
    echo "✅ Created .env.local file"
fi

# Function to update environment variable
update_env_var() {
    local var_name=$1
    local var_description=$2
    local current_value=$(grep "^$var_name=" .env.local | cut -d'=' -f2)
    
    if [ "$current_value" = "your_delhivery_token_here" ] || [ "$current_value" = "your_${var_name,,}_here" ] || [ -z "$current_value" ]; then
        echo ""
        echo "⚙️  $var_description"
        echo "Current value: $current_value"
        read -p "Enter new value (or press Enter to skip): " new_value
        
        if [ ! -z "$new_value" ]; then
            # Use sed to update the value in .env.local
            sed -i "s|^$var_name=.*|$var_name=$new_value|" .env.local
            echo "✅ Updated $var_name"
        else
            echo "⏭️  Skipped $var_name"
        fi
    else
        echo "✅ $var_name is already configured"
    fi
}

echo ""
echo "🔑 DELHIVERY API TOKEN CONFIGURATION"
echo "===================================="
echo ""
echo "To get your Delhivery API token:"
echo "1. Go to https://track.delhivery.com/"
echo "2. Log in to your Delhivery account"
echo "3. Navigate to 'API' or 'Integration' section"
echo "4. Copy your API token"
echo "5. For staging/testing, use the staging token"
echo "6. For production, use the production token"

# Configure Delhivery API token
update_env_var "DELHIVERY_API_TOKEN" "Delhivery API Token (REQUIRED for shipment creation)"

echo ""
echo "🌍 ENVIRONMENT CONFIGURATION"
echo "============================"
echo ""
echo "Current NODE_ENV: $(grep "^NODE_ENV=" .env.local | cut -d'=' -f2)"
echo "- Set to 'development' for staging/testing"
echo "- Set to 'production' for live shipments"

read -p "Do you want to use production environment? (y/N): " use_production
if [[ $use_production =~ ^[Yy]$ ]]; then
    sed -i "s|^NODE_ENV=.*|NODE_ENV=production|" .env.local
    echo "✅ Set to production environment"
else
    sed -i "s|^NODE_ENV=.*|NODE_ENV=development|" .env.local
    echo "✅ Set to development environment"
fi

# Configure other important variables
update_env_var "MONGODB_URI" "MongoDB Connection String"
update_env_var "NEXTAUTH_URL" "Next.js Site URL (e.g., http://localhost:3000)"
update_env_var "NEXTAUTH_SECRET" "NextAuth.js Secret (generate a random string)"

echo ""
echo "🎯 SETUP COMPLETE!"
echo "=================="
echo ""
echo "✅ Environment configuration file created/updated: .env.local"
echo ""
echo "🔍 Next steps:"
echo "1. Verify your .env.local file has the correct values"
echo "2. Make sure your Delhivery API token is valid"
echo "3. Ensure your warehouse is registered in Delhivery"
echo "4. Test the shipment creation with: npm run dev"
echo "5. Check the shipment dashboard: http://localhost:3000/admin/shipments"
echo ""
echo "📚 For more information, see:"
echo "- DELHIVERY_SETUP.md"
echo "- IMPLEMENTATION_CHECKLIST.md"
echo "- SHIPMENT_SYSTEM.md"
echo ""
echo "🐛 If you encounter issues:"
echo "1. Check the browser console for errors"
echo "2. Check the server logs for API errors"
echo "3. Test with the debug endpoints: /api/debug/shipment"
echo "4. Run the test script: node test-delhivery-live.js"
echo ""
echo "🎉 Happy shipping!"
