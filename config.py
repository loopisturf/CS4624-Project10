# General parameters
TETA = 0  # Slope is assumed to be zero
G = 9.8066  # Gravitational force (g) in [m/s^2]
P_AIR = 1.2256  # Density of air (p_air) at sea level at 15 C (59 F)in [kg/m^3]
P_EM_MAX = 85700  # Max power of electric motor in [W], VW eGolf 85.7 kW, Nissan Leaf 80000
W_MIN = 0  # Minimum angular velocity of the EM, in rad/s. 0 rad/s = 0 rpm 
W_MAX = 1087.96  # Maximum angular velocity of the EM, in rad/s. 1087.96 rad/s = 10390 rpm 
R_W = 0.332  # Wheels radius [m]
GEAR_RATIO_EM = 7.9377  # Gear ratio Electric Motor of the Nissan Leaf

# EM (motor) Parameters 
ETA_DRIVELINE = 0.92  # Trasmission efficiency. Rakha et al. (2011). 
ETA_EM = 0.96   # Orignial 0.91;  eta_em=-0.0007speed+0.95
ETA_BATTERY = 0.90  # Original 0.90; Battery system efficiency. 

VEHICLE_TYPES = [
    {"id": 1, "name": "Internal Combustion Engine Vehicles", "abbreviation": "ICEV"},
    {"id": 2, "name": "Battery Electric Vehicles", "abbreviation": "BEV"},
    {"id": 3, "name": "Hybrid Electric Vehicles", "abbreviation": "HEV"},
    {"id": 4, "name": "Hydrogen Fuel Cell Vehicles", "abbreviation": "HFCV"}
]