#!/bin/bash

# Test tracking API fix
echo "Testing tracking API fix..."

# Test waybill that doesn't exist
curl -s "http://localhost:3000/api/shipment/tracking?waybill=30802810001632" | jq .

echo -e "\n"

# Test waybill with typo
curl -s "http://localhost:3000/api/shipment/tracking?waybill=30802810001632p" | jq .

echo -e "\n"

# Test empty waybill
curl -s "http://localhost:3000/api/shipment/tracking?waybill=" | jq .

echo -e "\nTracking API tests completed!"
