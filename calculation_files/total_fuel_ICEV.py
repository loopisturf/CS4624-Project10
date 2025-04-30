import numpy as np
import math
import sys

def calculate_total_fuel_ICEV(v, Alpha_0, Alpha_1, Alpha_2, Power_kW):
    MODEL1 = np.where(Power_kW < 0, Alpha_0, 
                      Alpha_0 + Alpha_1 * Power_kW + Alpha_2 * Power_kW**2)
    total_fuel = np.sum(MODEL1)
    distance_m = np.sum(v)
    total_fuel_LperKm = total_fuel / (distance_m / 1000)
    total_fuel_kmperL = 1 / total_fuel_LperKm
    total_fuel_mpg = total_fuel_kmperL * 2.35215
    total_energy_kWh = total_fuel * 9.3127778

    return {
        'model': MODEL1.tolist(),
        'total_fuel_liters': total_fuel,
        'total_fuel_mpg': total_fuel_mpg,
        'total_energy_kWh': total_energy_kWh
    }