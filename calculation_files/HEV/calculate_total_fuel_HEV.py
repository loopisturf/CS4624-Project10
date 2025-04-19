import numpy as np
import math
import sys

def calculate_total_fuel_HEV(v, Power_kW, engineType, parameters):
    """
    Calculates total fuel and energy consumption for a Hybrid Electric Vehicle (HEV).

    Parameters:
    v (array): Speed data in meters per second.
    Power_kW (array): Power data in kilowatts.
    parameters (dict): A dictionary containing required coefficients:
        - 'Alpha_0': Base fuel coefficient
        - 'Alpha_1': Linear power coefficient
        - 'Alpha_2': Quadratic power coefficient
        - 'Alpha_3': Speed coefficient

    Returns:
    dict: Fuel/energy consumption and efficiency metrics.
    """
    # if engine_type != "HEV":
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
    Alpha_3 = parameters['Alpha_3']

    v_array = np.array(v)
    v_kmh = v_array * 3.6  # Convert to km/h
    P_a = 10  # kW
    v_kmh_a = 32  # km/h

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

    total_fuel = np.sum(HEV_MODEL) / 1000  # Convert to liters
    distance_m = np.sum(v)
    distance_miles = distance_m * 0.00062137
    total_fuel_LperKm = total_fuel / (distance_m / 1000)
    total_fuel_kmperL = 1 / total_fuel_LperKm
    total_fuel_mpg = total_fuel_kmperL * 2.35215
    total_energy_kWh = total_fuel * 9.3127778
    miles_per_kWh = distance_miles / total_energy_kWh

    return {
        'og_model': (HEV_MODEL / 1000).tolist(),
        'kW': total_energy_kWh,
        'L/s': total_fuel,
        'mi/kWh': miles_per_kWh,
        'MPG': total_fuel_mpg
    }