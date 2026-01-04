#!/bin/bash

# Quick test of the specific failing APIs
echo "🔧 Testing Previously Failing APIs"
echo "================================="

BASE_URL="http://localhost:3000"

echo "1. Testing Pickup API (with wallet balance handling)..."
curl -s -X POST "$BASE_URL/api/shipment/pickup" \
  -H "Content-Type: application/json" \
  -d '{
    "waybillNumbers": ["TEST123"],
    "pickupDate": "2025-07-05", 
    "pickupTime": "10:00",
    "pickupAddress": "123 Test Street",
    "contactPerson": "Test Person",
    "contactNumber": "9876543210"
  }' | jq '.'

echo -e "\n2. Testing Auto-shipment API..."
curl -s -X POST "$BASE_URL/api/shipment/create-auto" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "TEST_ORDER_001",
    "shipmentType": "FORWARD",
    "autoGenerateWaybill": true
  }' | jq '.'

echo -e "\n✅ API Tests Complete"
