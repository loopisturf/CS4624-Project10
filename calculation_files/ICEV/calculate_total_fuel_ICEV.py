import numpy as np
import math
import sys

def calculate_total_fuel_ICEV(v, Power_kW, engineType, parameters):
    """
    Calculates total fuel and energy consumption for an Internal Combustion Engine Vehicle (ICEV).

    Parameters:
    v (array): Speed data in meters per second.
    Power_kW (array): Power data in kilowatts.
    parameters (dict): A dictionary containing required coefficients:
        - 'Alpha_0': Base fuel coefficient
        - 'Alpha_1': Linear power coefficient
        - 'Alpha_2': Quadratic power coefficient

    Returns:
    dict: Fuel/energy consumption and efficiency metrics.
    """
    # if engine_type != "ICEV":
    #     return {
    #         'model': 0,
    #         'kW': 0,
    #         'L/s': 0,
    #         'mi/kWh': 0,
    #         'MPG': 0
    #     }
    
    Alpha_0 = parameters['Alpha_0']
    Alpha_1 = parameters['Alpha_1']
    Alpha_2 = parameters['Alpha_2']

    MODEL1 = np.where(Power_kW < 0,
                      Alpha_0,
                      Alpha_0 + Alpha_1 * Power_kW + Alpha_2 * Power_kW**2)

    total_fuel = np.sum(MODEL1)
    distance_m = np.sum(v)
    distance_miles = distance_m * 0.00062137
    total_fuel_LperKm = total_fuel / (distance_m / 1000)
    total_fuel_kmperL = 1 / total_fuel_LperKm
    total_fuel_mpg = total_fuel_kmperL * 2.35215
    total_energy_kWh = total_fuel * 9.3127778
    miles_per_kWh = distance_miles / total_energy_kWh

    return {
        'og_model': MODEL1.tolist(),
        'kW': total_energy_kWh,
        'L/s': total_fuel,
        'mi/kWh': miles_per_kWh,
        'MPG': total_fuel_mpg
    }