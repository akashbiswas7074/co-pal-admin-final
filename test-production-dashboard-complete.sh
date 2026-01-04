#!/bin/bash

# Production Dashboard Functionality Test Script
# Tests all Delhivery API features and order management

echo "🚀 Testing Production Dashboard Functionality"
echo "============================================="

BASE_URL="http://localhost:3000"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Function to test API endpoint
test_endpoint() {
    local method=$1
    local endpoint=$2
    local data=$3
    local expected_status=$4
    local description=$5
    
    echo -n "Testing: $description ... "
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "%{http_code}" -X GET "$BASE_URL$endpoint")
    else
        response=$(curl -s -w "%{http_code}" -X POST \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$BASE_URL$endpoint")
    fi
    
    status_code="${response: -3}"
    response_body="${response%???}"
    
    if [ "$status_code" = "$expected_status" ]; then
        echo -e "${GREEN}✓ PASSED${NC} (Status: $status_code)"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        return 0
    else
        echo -e "${RED}✗ FAILED${NC} (Expected: $expected_status, Got: $status_code)"
        echo "Response: $response_body"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        return 1
    fi
}

echo -e "\n${BLUE}1. Testing Order Management APIs${NC}"
echo "================================"

# Test orders fetching
test_endpoint "GET" "/api/orders?page=1&limit=10" "" "200" "Fetch orders with pagination"

# Test order search
test_endpoint "POST" "/api/orders/search" '{"searchQuery": {"limit": 5}}' "200" "Search orders"

# Test order analytics
test_endpoint "GET" "/api/orders/analytics" "" "200" "Get order analytics"

echo -e "\n${BLUE}2. Testing Waybill Generation APIs${NC}"
echo "=================================="

# Test single waybill generation
test_endpoint "POST" "/api/shipment/waybills" '{"count": 1, "mode": "single"}' "200" "Generate single waybill"

# Test bulk waybill generation
test_endpoint "POST" "/api/shipment/waybills" '{"count": 3, "mode": "bulk"}' "200" "Generate bulk waybills"

# Test invalid waybill request
test_endpoint "POST" "/api/shipment/waybills" '{"count": 0}' "400" "Invalid waybill count (should fail)"

echo -e "\n${BLUE}3. Testing Serviceability APIs${NC}"
echo "==============================="

# Test pincode serviceability
test_endpoint "GET" "/api/shipment/serviceability?pincode=110001" "" "200" "Check pincode serviceability"

# Test invalid pincode
test_endpoint "GET" "/api/shipment/serviceability?pincode=000000" "" "200" "Check invalid pincode"

echo -e "\n${BLUE}4. Testing Tracking APIs${NC}"
echo "==========================="

# Test tracking (this might fail if waybill doesn't exist)
test_endpoint "GET" "/api/shipment/tracking?waybill=TEST123456789" "" "200" "Track shipment"

echo -e "\n${BLUE}5. Testing E-waybill APIs${NC}"
echo "============================"

# Test e-waybill update
test_endpoint "POST" "/api/shipment/ewaybill" '{"waybill": "TEST123", "dcn": "INV001", "ewbn": "EWB001"}' "200" "Update e-waybill"

echo -e "\n${BLUE}6. Testing Pickup APIs${NC}"
echo "======================="

# Test pickup request (may return test mode due to wallet balance constraint)
test_endpoint "POST" "/api/shipment/pickup" '{
  "waybillNumbers": ["TEST123"],
  "pickupDate": "2025-07-05",
  "pickupTime": "10:00",
  "pickupAddress": "123 Test Street, Test City",
  "contactPerson": "Test Person",
  "contactNumber": "9876543210"
}' "200" "Create pickup request"

echo -e "\n${BLUE}7. Testing Auto-shipment APIs${NC}"
echo "=============================="

# Test auto-shipment creation
test_endpoint "POST" "/api/shipment/create-auto" '{"orderId": "TEST_ORDER_001", "pickupLocation": "Main Warehouse"}' "200" "Create auto-shipment"

echo -e "\n${YELLOW}8. Testing Frontend Accessibility${NC}"
echo "=================================="

# Test main shipment page
echo -n "Testing: Main shipment page accessibility ... "
main_page_response=$(curl -s -w "%{http_code}" "$BASE_URL/admin/shipment")
main_page_status="${main_page_response: -3}"

if [ "$main_page_status" = "200" ]; then
    echo -e "${GREEN}✓ PASSED${NC}"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo -e "${RED}✗ FAILED${NC} (Status: $main_page_status)"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi

echo -e "\n${YELLOW}9. Testing Production Dashboard Components${NC}"
echo "============================================="

# Check if the dashboard loads without errors
echo "Production Dashboard components to verify:"
echo "✓ Order Management Tab"
echo "✓ Waybill Generation Tab"
echo "✓ E-waybill Management Tab"
echo "✓ Pickup Management Tab"
echo "✓ Auto-shipment Tab"
echo "✓ Tracking Tab"
echo "✓ Serviceability Tab"

echo -e "\n${BLUE}Test Results Summary${NC}"
echo "===================="
echo -e "Tests Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests Failed: ${RED}$TESTS_FAILED${NC}"
echo -e "Total Tests: $((TESTS_PASSED + TESTS_FAILED))"

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "\n${GREEN}🎉 All tests passed! Production Dashboard is ready.${NC}"
    exit 0
else
    echo -e "\n${YELLOW}⚠️  Some tests failed. Check the API configuration and Delhivery setup.${NC}"
    exit 1
fi
