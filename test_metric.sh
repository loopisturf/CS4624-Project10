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

# Metric Type Tests
print_header "POST: Add new metric"
curl -s -X POST http://localhost:5000/api/metrics \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -u admin:1234 \
    -d "metricName=Temperature&metricUnits=Celsius&metricModel=tempKey" | jq

print_header "GET: List all metrics"
curl -s http://localhost:5000/api/metrics | jq

print_header "GET: Get metric with id 50"
curl -s "http://localhost:5000/api/get_metric?id=50" | jq

print_header "GET: Get metric with missing id"
curl -s "http://localhost:5000/api/get_metric" | jq

# Metric Param Tests
print_header "POST: Add new metric again for param tests"
curl -s -X POST http://localhost:5000/api/metrics \
    -H "Content-Type: application/x-www-form-urlencoded"  \
    -u admin:1234 \
    -d "metricName=Humidity&metricUnits=Percentage&metricModel=humidityKey" | jq

print_header "GET: List all metrics after adding new one"
curl -s http://localhost:5000/api/metrics | jq


# Clean up
print_header "Stopping Flask Server"
print_header "After running these tests, run python init_db.py to restore the database to its previous state"
kill $FLASK_PID