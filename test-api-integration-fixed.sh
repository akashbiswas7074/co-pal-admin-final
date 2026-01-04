#!/bin/bash

# Updated API integration test with correct payloads
echo "🔍 Testing Delhivery API Integration (Fixed)"
echo "==========================================="

# Test waybill generation
echo "Testing waybill generation..."
curl -s -X POST "http://localhost:3000/api/shipment/waybills" \
  -H "Content-Type: application/json" \
  -d '{"count": 2, "mode": "bulk", "store": false}' | jq '.'

echo -e "\n"

# Test serviceability check (fixed - GET request)
echo "Testing serviceability check..."
curl -s "http://localhost:3000/api/shipment/serviceability?pincode=110001" | jq '.'

echo -e "\n"

# Test serviceability check (POST method)
echo "Testing serviceability check (POST)..."
curl -s -X POST "http://localhost:3000/api/shipment/serviceability" \
  -H "Content-Type: application/json" \
  -d '{"pincode": "110001"}' | jq '.'

echo -e "\n"

# Test tracking (fixed - GET request)
echo "Testing tracking functionality (GET)..."
curl -s "http://localhost:3000/api/shipment/tracking?waybill=30802810001315" | jq '.'

echo -e "\n"

# Test tracking (POST method)
echo "Testing tracking functionality (POST)..."
curl -s -X POST "http://localhost:3000/api/shipment/tracking" \
  -H "Content-Type: application/json" \
  -d '{"waybillNumber": "30802810001315"}' | jq '.'

echo -e "\n"

# Test e-waybill update (fixed - POST request)
echo "Testing e-waybill update..."
curl -s -X POST "http://localhost:3000/api/shipment/ewaybill" \
  -H "Content-Type: application/json" \
  -d '{"waybill": "30802810001315", "dcn": "INV123", "ewbn": "EWB456"}' | jq '.'

echo -e "\n"

# Test pickup request (fixed payload)
echo "Testing pickup request..."
curl -s -X POST "http://localhost:3000/api/shipment/pickup" \
  -H "Content-Type: application/json" \
  -d '{
    "waybillNumbers": ["30802810001315"],
    "pickupDate": "2025-07-05",
    "pickupTime": "10:30",
    "pickupAddress": "123 Test Street, Test City",
    "contactPerson": "Test Person",
    "contactNumber": "9876543210"
  }' | jq '.'

echo -e "\n"

# Test auto-shipment (fixed payload)
echo "Testing auto-shipment..."
curl -s -X POST "http://localhost:3000/api/shipment/create-auto" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "ORDER123",
    "shipmentType": "FORWARD",
    "pickupLocation": "Default Warehouse",
    "shippingMode": "Surface",
    "autoGenerateWaybill": true,
    "autoSchedulePickup": true
  }' | jq '.'

echo -e "\n"
echo "✅ API Integration Test Complete (Fixed)"
