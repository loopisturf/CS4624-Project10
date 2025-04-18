import numpy as np
import math
import sys

def calculate_total_fuel_HFCV(v, Power_kW, engine_type, parameters):
    # print("ENGINE TYPE")
    # print(engine_type)
    # if engine_type != "HFCV":
    #     return {
    #         'model': 0,
    #         'kW': 0,
    #         'L/s': 0,
    #         'mi/kWh': 0,
    #         'MPG': 0
    #     }

    v_array = np.array(v)
    Power_kW = np.array(Power_kW)
    
    v_kmh = v_array * 3.6  # Convert to km/h
    v_kmh_b = 10  # km/h (based on professor's code)
    P_b = 1  # kW (based on professor's code)

    # Extract the parameter 'Max_Power' (assuming it's passed as a scalar or array)
    max_power = parameters.get('Max_Power', 1)
    
    # If max_power is passed as a scalar, broadcast it to the shape of Power_kW
    if np.isscalar(max_power):
        max_power_array = np.full_like(Power_kW, max_power, dtype=np.float64)
    else:
        max_power_array = np.array(max_power)
        # Ensure max_power_array matches the shape of Power_kW (broadcast if needed)
        if max_power_array.shape != Power_kW.shape:
            raise ValueError(f"Max_Power array shape {max_power_array.shape} must match Power_kW shape {Power_kW.shape}.")
    
    # Calculate proportion to max power
    Prop_max_power = np.maximum(0.001, Power_kW / max_power_array)

    # Calculate fuel cell driveline efficiency
    effi_hfcv = (
        153.56 * (Prop_max_power ** 3)
        - 67.805 * (Prop_max_power ** 2)
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
    distance_m = np.sum(v_array)
    distance_miles = distance_m * 0.000621371

    total_fuel_kWhperkm = total_fuel_kWh / (distance_m / 1000) if distance_m > 0 else 0
    total_fuel_kmperkWh = 1 / total_fuel_kWhperkm if total_fuel_kWhperkm > 0 else 0
    total_fuel_mileperkWh = total_fuel_kmperkWh / 1.60934 if total_fuel_kmperkWh > 0 else 0

    total_fuel_L = total_fuel_kWh / 9.3127778
    total_fuel_gallon = total_fuel_L * 0.26417205
    miles_per_gallon = distance_miles / total_fuel_gallon if total_fuel_gallon > 0 else 0

    return {
        'model': HFCV_MODEL.tolist(),
        'kW': total_fuel_kWh,
        'L/s': total_fuel_L,
        'mi/kWh': total_fuel_mileperkWh,
        'MPG': miles_per_gallon
    }