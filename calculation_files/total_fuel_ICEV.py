import numpy as np
import math
import sys

def calculate_total_fuel_ICEV(v, Alpha_0, Alpha_1, Alpha_2, Power_kW):
    MODEL1 = np.where(Power_kW < 0, Alpha_0, 
                      Alpha_0 + Alpha_1 * Power_kW + Alpha_2 * Power_kW**2)
    total_fuel = np.sum(MODEL1)
    distance_m = np.sum(v)
    distance_miles = distance_m * 0.00062137 # total distance in miles
    total_fuel_LperKm = total_fuel / (distance_m / 1000)
    total_fuel_kmperL = 1 / total_fuel_LperKm
    total_fuel_mpg = total_fuel_kmperL * 2.35215
    total_energy_kWh = total_fuel * 9.3127778
    miles_per_kWh = distance_miles / total_energy_kWh
    # the names in the return value are not correct it is just the units they will eventually be used to calculate
    return {
        'model': MODEL1.tolist(),
        'kW': total_energy_kWh,
        'L/s': total_fuel,
        'mi/kWh': miles_per_kWh,
        'MPG': total_fuel_mpg
    }