import numpy as np
import math
import sys

def calculate_total_fuel_HFCV(v, Power_kW, Max_Power):
    v_array = np.array(v)
    v_kmh = v_array * 3.6  # Convert to km/h
    v_kmh_b = 10  # km/h (aligned with professor's code)
    P_b = 1  # kW (aligned with professor's code)

    # Calculate proportion to max power
    Prop_max_power = np.maximum(0.001, Power_kW / Max_Power)

    # Calculate fuel cell driveline efficiency
    effi_hfcv = (
        153.56 * (Prop_max_power**3) 
        - 67.805 * (Prop_max_power**2) 
        + 10.155 * Prop_max_power 
        + 0.1635
    )
    
    # Clip efficiency between 0.2 and 0.8
    effi_hfcv = np.clip(effi_hfcv, 0.2, 0.8)

    # Vectorized calculation of HFCV_MODEL
    HFCV_MODEL = np.where(
        (v_kmh > v_kmh_b) & (Power_kW > P_b), 
        np.maximum(0, Power_kW / effi_hfcv), 
        0
    )

    # Calculate total fuel and metrics
    total_fuel_kWh = np.sum(HFCV_MODEL) / 3600  # Convert to kWh
    distance_m = np.sum(v)  # Total distance in meters
    distance_miles = distance_m * 0.00062137 # total distance in miles
    total_fuel_kWhperkm = total_fuel_kWh / (distance_m / 1000)  # kWh/km
    total_fuel_kmperkWh = 1 / total_fuel_kWhperkm  # km/kWh
    total_fuel_mileperkWh = total_fuel_kmperkWh / 1.60934  # mile/kWh
    total_fuel_liters = total_fuel_kWh / 9.3127778 # L
    total_fuel_gallons = total_fuel_liters * 0.26417205 # total fuel in gallons
    miles_per_gallon = distance_miles / total_fuel_gallons

    # Return results
    # the names in the return value are not correct it is just the units they will eventually be used to calculate
    return {
        'model': HFCV_MODEL.tolist(),
        'kW': total_fuel_kWh,
        'L/s' : total_fuel_liters,
        'mi/kWh': total_fuel_mileperkWh,
        'MPG': miles_per_gallon
    }

