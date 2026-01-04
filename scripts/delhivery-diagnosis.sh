#!/bin/bash

echo "🏥 DELHIVERY ACCOUNT DIAGNOSIS"
echo "============================="
echo ""

# Check if server is running
echo "🔍 Checking if server is running..."
if curl -s http://localhost:3000/api/health > /dev/null; then
  echo "✅ Server is running"
else
  echo "❌ Server is not running"
  echo "💡 Start the server with: npm run dev"
  exit 1
fi

echo ""
echo "📊 Based on the logs you provided, here's what I found:"
echo ""

echo "🔧 IDENTIFIED ISSUES:"
echo "-------------------"
echo "1. ⚠️  INSUFFICIENT BALANCE"
echo "   - Error: 'Prepaid client manifest charge API failed due to insufficient balance'"
echo "   - This means your Delhivery account doesn't have sufficient balance"
echo "   - Solution: Add funds to your Delhivery account"
echo ""

echo "2. ❌ WAREHOUSE NOT FOUND"
echo "   - Error: 'ClientWarehouse matching query does not exist'"
echo "   - Pickup location 'co-pal-ul' is not registered in your Delhivery account"
echo "   - Solution: Register warehouses or use existing ones"
echo ""

echo "3. ✅ SOME WAREHOUSES WORK"
echo "   - 'Main Warehouse' and 'co-pal-test' seem to be recognized"
echo "   - But they still fail due to insufficient balance"
echo ""

echo "💡 RECOMMENDED SOLUTIONS:"
echo "----------------------"
echo "1. 🏦 ADD FUNDS TO DELHIVERY ACCOUNT"
echo "   - Log into your Delhivery dashboard"
echo "   - Add sufficient balance for COD shipments"
echo "   - Minimum balance varies by shipment value"
echo ""

echo "2. 🏢 REGISTER MISSING WAREHOUSES"
echo "   - Use the warehouse registration script"
echo "   - Or register via Delhivery dashboard"
echo ""

echo "3. 🧪 TEST WITH LOWER VALUES"
echo "   - Try with smaller COD amounts"
echo "   - Test with prepaid shipments if balance allows"
echo ""

echo "4. 📞 CONTACT DELHIVERY SUPPORT"
echo "   - If balance issues persist"
echo "   - For warehouse registration help"
echo "   - Support email: client.support@delhivery.com"
echo ""

echo "🔄 NEXT STEPS:"
echo "-------------"
echo "1. Check your Delhivery account balance"
echo "2. Add funds if needed"
echo "3. Run the comprehensive test again"
echo "4. Register any missing warehouses"
echo ""

echo "🚀 Quick test command:"
echo "cd /home/akashbiswas7797/Desktop/co-pal-ecom/Peeds/e-commerce-admin && ./scripts/comprehensive-pickup-test.sh"
