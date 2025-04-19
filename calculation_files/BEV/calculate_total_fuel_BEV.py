import numpy as np
import math
import sys
from config import *

def calculate_total_fuel_BEV(v, power_kW, engine_type, parameters):
    """
    Calculates total energy consumption for a Battery Electric Vehicle (BEV).

    Parameters:
    v (array): Speed data in meters per second.
    power_kW (array): Power data (unused in this implementation).
    parameters (dict): A dictionary containing required inputs:
        - 'w_em_rads': Angular velocity array (rad/s)
        - 'SOC0': Initial State of Charge (0-1)
        - 'SOCmin': Minimum allowable SOC before failure (0-1)
        - 'BattCapacity_Wh': Battery capacity in Watt-hours
        - 'P_aux': Auxiliary power draw (W)
        - 'comp_eta': Powertrain efficiency (unitless)
        - 'accel': Acceleration array (m/s²)
        - 'P_wheels': Power at the wheels array (W)

    Returns:
    dict: Energy/fuel consumption and efficiency metrics
    """
    # if engine_type != "BEV":
    #     return {
    #         'model': 0,
    #         'kW': 0,
    #         'L/s': 0,
    #         'mi/kWh': 0,
    #         'MPG': 0
    #     }

    w_em_rads = parameters['w_em_rads']
    SOC0 = parameters['SOC0']
    SOCmin = parameters['SOCmin']
    BattCapacity_Wh = parameters['BattCapacity_Wh']
    P_aux = parameters['P_aux']
    comp_eta = parameters['comp_eta']
    accel = parameters['accel']
    P_wheels = parameters['P_wheels']

    w_em_rads = np.clip(w_em_rads, W_MIN, W_MAX)

    P_net_temp = np.where(P_wheels < 0, P_wheels * comp_eta, P_wheels / comp_eta)
    eta_rb = np.where(accel < 0, 1 / np.exp(1 / np.abs(accel) * 0.0411), 0)
    P_net = np.where(P_net_temp < 0, P_net_temp * eta_rb + P_aux, P_net_temp + P_aux)
    P_net = np.clip(P_net, -P_EM_MAX, P_EM_MAX)

    BATT_SOC = np.zeros_like(v)
    BATT_SOC[0] = SOC0
    for i in range(1, len(v)):
        BATT_SOC[i] = BATT_SOC[i - 1] - P_net[i] / 3600 / BattCapacity_Wh

    if BATT_SOC[-1] > SOCmin:
        EE_consumed_kWh = np.sum(P_net) / 3600000
        distance_m = np.sum(v)
        SOCfinal = BATT_SOC[-1]
    else:
        tripfailuretime = np.where(BATT_SOC < SOCmin)[0][0] - 1
        EE_consumed_kWh = np.sum(P_net[:tripfailuretime]) / 3600000
        distance_m = np.sum(v[:tripfailuretime])
        SOCfinal = SOCmin

    SOCfinal_percent = SOCfinal * 100
    distance_miles = distance_m * 0.000621371
    Energy_consumed_km = EE_consumed_kWh / (distance_m / 1000)
    Energy_consumed_miles = EE_consumed_kWh / distance_miles
    Energy_consumed_miperkwh = distance_miles / EE_consumed_kWh

    P_net_neg = np.where(P_net < 0, P_net, 0)
    EE_recovered_kWh = np.sum(P_net_neg) / 3600000
    EE_consumed_L = EE_consumed_kWh / 9.3127778
    EE_consumed_G = EE_consumed_L * 0.26417205
    miles_per_gallon = distance_miles / EE_consumed_G

    return {
        'og_model': (P_net / 1000).tolist(),
        'EE_recovered_kWh': EE_recovered_kWh,
        'SOC_final_percent': SOCfinal_percent,
        'kW': EE_consumed_kWh,
        'L/s': EE_consumed_L,
        'mi/kWh': Energy_consumed_miperkwh,
        'MPG': miles_per_gallon
    }