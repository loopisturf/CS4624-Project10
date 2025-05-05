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

# test sign up
print_header "Sign up"
curl -X POST http://localhost:5000/api/signup \-H "Content-Type: application/json" \-d '{"username":"testuser", "password":"testpass"}' |jq

# test login
print_header "Login with the newly created user"
 curl -X POST http://localhost:5000/api/login \-H "Content-Type: application/json" \-d '{"username":"testuser", "password":"testpass"}' | jq

# get users
print_header "GET: Admin View of All Users"
curl -s "http://localhost:5000/api/admin/users?username=admin&password=1234" | jq

# Clean up
print_header "Stopping Flask Server"
kill $FLASK_PID