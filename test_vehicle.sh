#!/bin/bash

echo "==> Resetting database"
rm -f energy_estimation.db
python app.py &
FLASK_PID=$!
sleep 2

# Helper function to print headers
print_header() {
    echo -e "\n==> $1"
}

# Vehicle Type Tests
print_header "POST: Add new vehicle type"
curl -s -X POST http://localhost:5000/api/admin/vehicle-types \
    -H "Content-Type: application/json" \
    -u admin:1234 \
    -d '{"type_name": "sedan", "full_name": "Standard Sedan", "engine_id": 101}' | jq

print_header "GET: List all vehicle types"
curl -s http://localhost:5000/api/vehicle-types | jq

print_header "DELETE: Delete vehicle type with id 1"
curl -s -X DELETE http://localhost:5000/api/admin/vehicle-types/1 \
    -H "Content-Type: application/json" \
    -u admin:1234  | jq

print_header "GET: List all vehicle types"
curl -s http://localhost:5000/api/vehicle-types | jq

# Vehicle Param Tests
print_header "POST: Add vehicle type again for param tests"
curl -s -X POST http://localhost:5000/api/admin/vehicle-types \
    -H "Content-Type: application/json" \
    -u admin:1234 \
    -d '{"type_name": "truck", "full_name": "Heavy Truck", "engine_id": 202}' | jq

print_header "POST: Add vehicle param"
curl -s -X POST http://localhost:5000/api/admin/vehicle-params \
    -H "Content-Type: application/json" \
    -u admin:1234 \
    -d '{"vehicle_type_id": 2, "make": "Ford", "model": "F-150", "year": 2023, "param_string": "paramA=value1"}' | jq

print_header "POST: Add vehicle param"
curl -s -X POST http://localhost:5000/api/admin/vehicle-params \
    -H "Content-Type: application/json" \
    -u admin:1234 \
    -d '{"vehicle_type_id": 3, "make": "Ford", "model": "F-151", "year": 2024, "param_string": "paramB=value2"}' | jq

print_header "GET: List all vehicle params"
curl -s http://localhost:5000/api/vehicle-params | jq

print_header "PUT: Update vehicle param id 1"
curl -s -X PUT http://localhost:5000/api/admin/vehicle-params/1 \
    -H "Content-Type: application/json" \
    -u admin:1234 \
    -d '{"vehicle_type_id": 2, "make": "Ford", "model": "F-250", "year": 2024, "param_string": "paramA=updated"}' | jq


print_header "GET: List all vehicle params"
curl -s http://localhost:5000/api/vehicle-params | jq

print_header "DELETE: Delete vehicle param id 1"
curl -s -X DELETE http://localhost:5000/api/admin/vehicle-params/1 \
    -H "Content-Type: application/json" \
    -u admin:1234 | jq


print_header "GET: List all vehicle params"
curl -s http://localhost:5000/api/vehicle-params | jq

print_header "POST: Clear all vehicle params"
curl -s -X POST http://localhost:5000/api/admin/clear-vehicle-params \
    -H "Content-Type: application/json" \
    -u admin:1234  | jq


print_header "GET: List all vehicle params"
curl -s http://localhost:5000/api/vehicle-params | jq

# Clean up
print_header "Stopping Flask Server"
kill $FLASK_PID 