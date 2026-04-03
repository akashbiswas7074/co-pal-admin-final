#!/bin/bash

echo "🔧 Testing Fixed APIs"
echo "===================="

# Test pickup API with correct payload
echo "Testing pickup API..."
curl -s -X POST "http://localhost:3000/api/shipment/pickup" \
  -H "Content-Type: application/json" \
  -d '{
    "waybillNumbers": ["TEST123"],
    "pickupDate": "2025-07-05",
    "pickupTime": "10:00",
    "pickupAddress": "123 Test Street, Test City",
    "contactPerson": "Test Person",
    "contactNumber": "9876543210"
  }' | jq '.'

echo -e "\n"

# Test auto-shipment API
echo "Testing auto-shipment API..."
curl -s -X POST "http://localhost:3000/api/shipment/create-auto" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "TEST_ORDER_001",
    "shipmentType": "FORWARD",
    "pickupLocation": "Main Warehouse",
    "shippingMode": "Surface",
    "autoGenerateWaybill": true,
    "autoSchedulePickup": true
  }' | jq '.'

echo -e "\n"
echo "✅ API Fix Test Complete"
