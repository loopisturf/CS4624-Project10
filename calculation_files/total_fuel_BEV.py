import numpy as np
import math
import sys
from config import *

def calculate_total_fuel_BEV(w_em_rads, SOC0, SOCmin, BattCapacity_Wh, P_aux, comp_eta, v, accel, P_wheels):
    # Clip `w_em_rads` values for efficiency
    w_em_rads = np.clip(w_em_rads, W_MIN, W_MAX)

    # Calculate P_net_temp with vectorization
    P_net_temp = np.where(P_wheels < 0, P_wheels * comp_eta, P_wheels / comp_eta)

    # Calculate eta_rb using vectorized logic
    eta_rb = np.where(accel < 0, 1 / np.exp(1 / np.abs(accel) * 0.0411), 0)

    # Calculate P_net with conditions
    P_net = np.where(
        P_net_temp < 0, P_net_temp * eta_rb + P_aux, P_net_temp + P_aux
    )
    P_net = np.clip(P_net, -P_EM_MAX, P_EM_MAX)  # Clip P_net values

    # Initialize BATT_SOC and calculate it iteratively
    BATT_SOC = np.zeros_like(v)
    BATT_SOC[0] = SOC0
    for i in range(1, len(v)):
        BATT_SOC[i] = BATT_SOC[i - 1] - P_net[i] / 3600 / BattCapacity_Wh

    # Check for trip failure and calculate energy consumption
    if BATT_SOC[-1] > SOCmin:
        EE_consumed_kWh = np.sum(P_net) / 3600000
        distance_m = np.sum(v)
        SOCfinal = BATT_SOC[-1]
    else:
        tripfailuretime = np.where(BATT_SOC < SOCmin)[0][0] - 1
        EE_consumed_kWh = np.sum(P_net[:tripfailuretime]) / 3600000
        distance_m = np.sum(v[:tripfailuretime])
        SOCfinal = SOCmin

    # Calculate final metrics
    SOCfinal_percent = SOCfinal * 100
    distance_miles = distance_m * 0.000621371
    Energy_consumed_km = EE_consumed_kWh / (distance_m / 1000)
    Energy_consumed_miles = EE_consumed_kWh / distance_miles
    Energy_consumed_miperkwh = distance_miles / EE_consumed_kWh

    # Calculate recovered energy
    P_net_neg = np.where(P_net < 0, P_net, 0)
    EE_recovered_kWh = np.sum(P_net_neg) / 3600000

    # Return results
    return {
        'model': (P_net / 1000).tolist(),
        'EE_consumed_kWh': EE_consumed_kWh,
        'EE_recovered_kWh': EE_recovered_kWh,
        'SOC_final_percent': SOCfinal_percent,
        'Energy_consumed_mile_per_kWh': Energy_consumed_miperkwh
    }