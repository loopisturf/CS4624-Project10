# Automated Vehicles Fuel/Energy Estimation Web Application

## Project Overview
This web application allows users to estimate fuel and energy consumption for different types of vehicles based on input speed and/or acceleration profiles. It supports Internal Combustion Engine Vehicles (ICEV), Battery Electric Vehicles (BEV), Hybrid Electric Vehicles (HEV), and Hydrogen Fuel Cell Vehicles (HFCV).

## Project Details
- **Client**: Mohamed Farag (mmagdy@vt.edu)
- **Project Type**: Website, Digital Library, Database
- **Frontend**: React
- **Backend**: Flask + SQLite

## Team Members
1. Courtney Quinn (courtneyq@vt.edu) - Backend Lead, Group Leader
2. Layla Scott (laylas@vt.edu) - Frontend Lead, Meeting Minutes
3. Rohin Batra (rohin@vt.edu) - Backend Support
4. Eric Tapia (teric@vt.edu) - Backend Support
5. Christina Chao (humanerr0r@vt.edu) - Frontend Support

## Project Description
Researchers at VTTI have developed fuel/energy consumption models for various vehicle types. This web application aims to make these models accessible to users, allowing them to input vehicle speed and/or acceleration profiles and receive estimated fuel/energy consumption data with visualizations.

## Features
- User input for vehicle speed and acceleration profiles
- Support for multiple vehicle types (ICEV, BEV, HEV, HFCV)
- Fuel/energy consumption estimation
- Data visualization of results
- User session management and data storage

## Installation

### Prerequisites
- Python 3.7+ (preferably Python 3.8 or 3.9)
- Node.js (version 14+) and npm
- SQLite

### Backend Setup
1. Create and activate a virtual environment:
   ```
   cd automated_vehicles_fuel_energy_estimation/venv
   python3 -m venv venv # depending on system use python -m venv venv (without the 3)
   source venv/bin/activate  # On Windows, use: venv\Scripts\activate
   ```

2. Install required packages:
   ```
   cd ../
   pip install -r requirements.txt ***do not do this step until fixed!!

   pip install all the individual lines except the python 3.12 (first line)

   ```

3. Run the Flask application:
   ```
   python app.py
   ```

The backend should now be running on `http://localhost:5000`.

To deactivate the virtual environment when you're done, run:
```
deactivate
```


### Frontend Setup
1. cd into front end
```
 cd ./automated_vehicles_fuel_energy_estimation/front-end
```
2. If this is the first time set up:
   ```
   npm install react-scripts@latest
   ```

3. Then run rest of npm installs and start
```
    npm i
    npm start
```


## Usage
1. Open a web browser and go to `http://localhost:3000`
2. Select a vehicle type
3. Input or upload a speed/acceleration profile
4. Submit the data to see the estimated fuel/energy consumption results and visualizations

## API Endpoints
## API Endpoints
- **POST** `/api/signup`: Register a new user
- **POST** `/api/signin`: User login
- **GET** `/api/vehicle-types`: Get list of vehicle types
- **POST** `/api/admin/vehicle-types`: Add a new vehicle type (admin only)
- **POST** `/api/admin/upload-vehicle-params`: Upload vehicle parameters (admin only)
- **GET** `/api/vehicle-params`: Get vehicle parameters
- **POST** `/api/user-sessions`: Create a new user session
- **GET** `/api/user-sessions/<username>`: Get user sessions for a specific user
- **POST** `/api/estimate`: Estimate energy consumption

## Project Timeline
- September 23, 2023: Initial backend and frontend goals completed
- September 26, 2023: Presentation 1
- October 31, 2023: Presentation 2 and Interim Report
- December 20, 2023: Final Presentation and Report

For a detailed timeline, please refer to the project documentation.

## Contributing
Please follow these steps:
1. Create a new branch for your feature

    `git checkout -b your-feature-branch-name`
2. Commit your changes

    `git add --all`

    `git commit -m "your message in quotes"`

3. Push to the branch

    `git push origin your-feature-branch-name`

4. Create a Pull Request
    > come back to GitLab in your browser to do this

## Troubleshooting
- If you encounter port conflicts when starting the frontend, you can use a different port:
  ```
  PORT=3001 npm start
  ```
- Ensure you have the correct Python version installed. If using a different version, you may need to update your virtual environment.
- For any setup issues, refer to the detailed setup instructions in the project documentation.
- If you encounter database-related issues, make sure your `setup.sql` file is up to date and re-run `python init_db.py`.

## License

## Acknowledgments
- VT researchers for developing the fuel/energy consumption models
