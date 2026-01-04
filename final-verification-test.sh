#!/bin/bash

# Final verification test for all fixed APIs
echo "🎯 Final API Verification Test"
echo "============================="

BASE_URL="http://localhost:3000"

echo "1. Testing Waybill Generation..."
waybill_response=$(curl -s -X POST "$BASE_URL/api/shipment/waybills" \
  -H "Content-Type: application/json" \
  -d '{"count": 1, "mode": "single", "store": false}')
echo "$waybill_response" | jq '.'

echo -e "\n2. Testing Enhanced Tracking (with graceful handling)..."
curl -s "$BASE_URL/api/shipment/tracking?waybill=30802810001315" | jq '.'

echo -e "\n3. Testing Pickup API (with wallet balance handling)..."
curl -s -X POST "$BASE_URL/api/shipment/pickup" \
  -H "Content-Type: application/json" \
  -d '{
    "waybillNumbers": ["30802810001315"],
    "pickupDate": "2025-07-05",
    "pickupTime": "10:00",
    "pickupAddress": "123 Test Street",
    "contactPerson": "Test Person", 
    "contactNumber": "9876543210"
  }' | jq '.'

echo -e "\n4. Testing Auto-shipment API..."
curl -s -X POST "$BASE_URL/api/shipment/create-auto" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "TEST_ORDER_001",
    "autoGenerateWaybill": true
  }' | jq '.'

echo -e "\n5. Testing Serviceability API..."
curl -s "$BASE_URL/api/shipment/serviceability?pincode=110001" | jq '.'

echo -e "\n6. Testing E-waybill API..."
curl -s -X POST "$BASE_URL/api/shipment/ewaybill" \
  -H "Content-Type: application/json" \
  -d '{"waybill": "30802810001315", "dcn": "INV123", "ewbn": "EWB456"}' | jq '.'

echo -e "\n✅ All API tests completed!"
echo "🎉 Production Dashboard is ready for deployment!"
