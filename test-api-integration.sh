#!/bin/bash

# Quick test of Delhivery API integration
echo "🔍 Testing Delhivery API Integration"
echo "=================================="

# Test waybill generation
echo "Testing waybill generation..."
curl -s -X POST "http://localhost:3000/api/shipment/waybills" \
  -H "Content-Type: application/json" \
  -d '{"count": 2, "mode": "Express", "store": "default"}' | jq '.'

echo -e "\n"

# Test serviceability check
echo "Testing serviceability check..."
curl -s -X POST "http://localhost:3000/api/shipment/serviceability" \
  -H "Content-Type: application/json" \
  -d '{"pincode": "110001", "weight": 500, "mode": "Express"}' | jq '.'

echo -e "\n"

# Test tracking (with a sample waybill)
echo "Testing tracking functionality..."
curl -s -X POST "http://localhost:3000/api/shipment/tracking" \
  -H "Content-Type: application/json" \
  -d '{"waybillNumber": "30802810001315"}' | jq '.'

echo -e "\n"

# Test validation
echo "Testing validation..."
curl -s -X POST "http://localhost:3000/api/shipment/validate" \
  -H "Content-Type: application/json" \
  -d '{"waybillNumber": "30802810001315"}' | jq '.'

echo -e "\n"
echo "✅ API Integration Test Complete"
