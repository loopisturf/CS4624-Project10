import numpy as np
import math
import sys

def calculate_total_fuel_HEV(v, Power_kW, Alpha_0, Alpha_1, Alpha_2, Alpha_3):
    v_array = np.array(v)
    v_kmh = v_array * 3.6  # Convert to km/h
    P_a = 10  # kW
    v_kmh_a = 32  # km/h

    # Calculate HEV_MODEL using vectorized conditions
    HEV_MODEL = np.where(
        Power_kW < 0, Alpha_0,
        np.where(
            (v_kmh < v_kmh_a) & (Power_kW < P_a), Alpha_0,
            np.maximum(
                Alpha_0 + Alpha_1 * Power_kW + Alpha_2 * Power_kW**2 + Alpha_3 * v_kmh,
                Alpha_0
            )
        )
    )

    # Calculate total fuel, distance, and other metrics
    total_fuel = np.sum(HEV_MODEL) / 1000  # Convert to liters
    distance_m = np.sum(v)  # Total distance in meters
    distance_miles = distance_m * 0.00062137 # total distance in miles
    total_fuel_LperKm = total_fuel / (distance_m / 1000)  # liters/km
    total_fuel_kmperL = 1 / total_fuel_LperKm
    total_fuel_mpg = total_fuel_kmperL * 2.35215  # Convert to mpg
    total_energy_kWh = total_fuel * 9.3127778  # Convert to kWh
    miles_per_kWh = distance_miles / total_energy_kWh  # convert to mi/kWh

    # Return the results
    # the names in the return value are not correct it is just the units they will eventually be used to calculate
    return {
        'model': (HEV_MODEL / 1000).tolist(),
        'kW': total_energy_kWh,
        'L/s': total_fuel,
        'mi/kWh': miles_per_kWh,
        'MPG': total_fuel_mpg
    }