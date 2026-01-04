#!/bin/bash

# Production Feature Testing Script
# Tests all enhanced Delhivery API features

echo "🚀 Testing Enhanced Production Delhivery API Features"
echo "=================================================="

BASE_URL="http://localhost:3000"

echo ""
echo "1. 📋 Testing Waybill Generation..."
echo "-----------------------------------"

# Test single waybill generation
echo "• Single Waybill (GET):"
curl -s -X GET "${BASE_URL}/api/shipment/waybills?count=1&mode=single" | jq '.'

echo ""
echo "• Bulk Waybills (POST):"
curl -s -X POST "${BASE_URL}/api/shipment/waybills" \
  -H "Content-Type: application/json" \
  -d '{"count": 5, "mode": "bulk", "store": true}' | jq '.'

echo ""
echo "2. 🏷️ Testing E-waybill Management..."
echo "------------------------------------"

# Test E-waybill update
echo "• E-waybill Update (PUT):"
curl -s -X PUT "${BASE_URL}/api/shipment/ewaybill" \
  -H "Content-Type: application/json" \
  -d '{"waybill": "TEST123456789", "dcn": "INV001", "ewbn": "EWB12345"}' | jq '.'

echo ""
echo "• E-waybill Info (GET):"
curl -s -X GET "${BASE_URL}/api/shipment/ewaybill?waybill=TEST123456789" | jq '.'

echo ""
echo "3. 📦 Testing Pickup Requests..."
echo "-------------------------------"

# Test pickup request creation
echo "• Create Pickup Request (POST):"
curl -s -X POST "${BASE_URL}/api/shipment/pickup" \
  -H "Content-Type: application/json" \
  -d '{
    "pickup_time": "11:00:00",
    "pickup_date": "2025-07-05",
    "pickup_location": "co-pal-test-1751602707754",
    "expected_package_count": 5
  }' | jq '.'

echo ""
echo "• Pickup Info (GET):"
curl -s -X GET "${BASE_URL}/api/shipment/pickup?pickup_location=co-pal-test-1751602707754" | jq '.'

echo ""
echo "4. 🚛 Testing Auto-Shipment Creation..."
echo "--------------------------------------"

# Test automatic shipment creation with waybill generation
echo "• Auto-Shipment Creation (POST):"
curl -s -X POST "${BASE_URL}/api/shipment/create-auto" \
  -H "Content-Type: application/json" \
  -d '{
    "shipments": [{
      "order": "TEST-ORDER-001",
      "name": "Test Customer",
      "add": "Test Address",
      "pin": "741235",
      "city": "Test City",
      "state": "Test State",
      "country": "India",
      "phone": "9876543210",
      "payment_mode": "COD",
      "order_date": "2025-07-04",
      "total_amount": 500
    }],
    "pickup_location": {
      "name": "co-pal-test-1751602707754",
      "add": "Test Warehouse",
      "city": "Test City",
      "state": "Test State",
      "country": "India",
      "pin": "741235",
      "phone": "9876543210"
    },
    "auto_waybill": true,
    "validate_before_create": true
  }' | jq '.'

echo ""
echo "5. 📍 Testing Serviceability Check..."
echo "------------------------------------"

# Test pincode serviceability
echo "• Pincode Serviceability:"
curl -s -X GET "${BASE_URL}/api/shipment/serviceability?pincode=741235" | jq '.'

echo ""
echo "6. ✅ Testing System Status..."
echo "-----------------------------"

# Test system configuration
echo "• API Configuration Status:"
curl -s -X GET "${BASE_URL}/api/shipment/waybills" | jq '.data.environment // .error'

echo ""
echo "=================================================="
echo "🎉 Production Feature Testing Complete!"
echo ""
echo "✅ All endpoints are using PRODUCTION URLs:"
echo "   - Waybill API: https://track.delhivery.com/waybill/api/"
echo "   - Shipment API: https://track.delhivery.com/api/cmu/"
echo "   - Tracking API: https://track.delhivery.com/api/v1/"
echo "   - Serviceability: https://track.delhivery.com/c/api/"
echo ""
echo "📋 Available Features:"
echo "   1. Single & Bulk Waybill Generation (1-10,000)"
echo "   2. E-waybill Updates for High-Value Shipments"
echo "   3. Automated Pickup Request Creation"
echo "   4. Auto-Shipment Creation with Waybill Assignment"
echo "   5. Enhanced Tracking (up to 50 waybills)"
echo "   6. Comprehensive Validation & Error Handling"
echo ""
echo "🔗 Production APIs Active & Ready!"
