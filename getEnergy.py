import numpy as np
import math
import sys
from config import *
from calculation_files import *


# def calculate_total_fuel_ICEV(v, Alpha_0, Alpha_1, Alpha_2, Power_kW):
#     MODEL1 = np.where(Power_kW < 0, Alpha_0, 
#                       Alpha_0 + Alpha_1 * Power_kW + Alpha_2 * Power_kW**2)
#     total_fuel = np.sum(MODEL1)
#     distance_m = np.sum(v)
#     total_fuel_LperKm = total_fuel / (distance_m / 1000)
#     total_fuel_kmperL = 1 / total_fuel_LperKm
#     total_fuel_mpg = total_fuel_kmperL * 2.35215
#     total_energy_kWh = total_fuel * 9.3127778

#     return {
#         'model': MODEL1.tolist(),
#         'total_fuel_liters': total_fuel,
#         'total_fuel_mpg': total_fuel_mpg,
#         'total_energy_kWh': total_energy_kWh
#     }


# def calculate_total_fuel_HEV(v, Power_kW, Alpha_0, Alpha_1, Alpha_2, Alpha_3):
#     v_array = np.array(v)
#     v_kmh = v_array * 3.6  # Convert to km/h
#     P_a = 10  # kW
#     v_kmh_a = 32  # km/h

#     # Calculate HEV_MODEL using vectorized conditions
#     HEV_MODEL = np.where(
#         Power_kW < 0, Alpha_0,
#         np.where(
#             (v_kmh < v_kmh_a) & (Power_kW < P_a), Alpha_0,
#             np.maximum(
#                 Alpha_0 + Alpha_1 * Power_kW + Alpha_2 * Power_kW**2 + Alpha_3 * v_kmh,
#                 Alpha_0
#             )
#         )
#     )

#     # Calculate total fuel, distance, and other metrics
#     total_fuel = np.sum(HEV_MODEL) / 1000  # Convert to liters
#     distance_m = np.sum(v)  # Total distance in meters
#     total_fuel_LperKm = total_fuel / (distance_m / 1000)  # liters/km
#     total_fuel_kmperL = 1 / total_fuel_LperKm
#     total_fuel_mpg = total_fuel_kmperL * 2.35215  # Convert to mpg
#     total_energy_kWh = total_fuel * 9.3127778  # Convert to kWh

#     # Return the results
#     return {
#         'model': (HEV_MODEL / 1000).tolist(),
#         'total_fuel_liters': total_fuel,
#         'total_fuel_mpg': total_fuel_mpg,
#         'total_energy_kWh': total_energy_kWh
#     }

# def calculate_total_fuel_HFCV(v, Power_kW, Max_Power):
#     v_array = np.array(v)
#     v_kmh = v_array * 3.6  # Convert to km/h
#     v_kmh_b = 10  # km/h (aligned with professor's code)
#     P_b = 1  # kW (aligned with professor's code)

#     # Calculate proportion to max power
#     Prop_max_power = np.maximum(0.001, Power_kW / Max_Power)

#     # Calculate fuel cell driveline efficiency
#     effi_hfcv = (
#         153.56 * (Prop_max_power**3) 
#         - 67.805 * (Prop_max_power**2) 
#         + 10.155 * Prop_max_power 
#         + 0.1635
#     )
    
#     # Clip efficiency between 0.2 and 0.8
#     effi_hfcv = np.clip(effi_hfcv, 0.2, 0.8)

#     # Vectorized calculation of HFCV_MODEL
#     HFCV_MODEL = np.where(
#         (v_kmh > v_kmh_b) & (Power_kW > P_b), 
#         np.maximum(0, Power_kW / effi_hfcv), 
#         0
#     )

#     # Calculate total fuel and metrics
#     total_fuel_kWh = np.sum(HFCV_MODEL) / 3600  # Convert to kWh
#     distance_m = np.sum(v)  # Total distance in meters
#     total_fuel_kWhperkm = total_fuel_kWh / (distance_m / 1000)  # kWh/km
#     total_fuel_kmperkWh = 1 / total_fuel_kWhperkm  # km/kWh
#     total_fuel_mileperkWh = total_fuel_kmperkWh / 1.60934  # mile/kWh

#     # Return results
#     return {
#         'model': HFCV_MODEL.tolist(),
#         'total_energy_kWh': total_fuel_kWh,
#         'total_energy_mile_per_kWh': total_fuel_mileperkWh
#     }


# def calculate_total_fuel_BEV(w_em_rads, SOC0, SOCmin, BattCapacity_Wh, P_aux, comp_eta, v, accel, P_wheels):
#     # Clip `w_em_rads` values for efficiency
#     w_em_rads = np.clip(w_em_rads, W_MIN, W_MAX)

#     # Calculate P_net_temp with vectorization
#     P_net_temp = np.where(P_wheels < 0, P_wheels * comp_eta, P_wheels / comp_eta)

#     # Calculate eta_rb using vectorized logic
#     eta_rb = np.where(accel < 0, 1 / np.exp(1 / np.abs(accel) * 0.0411), 0)

#     # Calculate P_net with conditions
#     P_net = np.where(
#         P_net_temp < 0, P_net_temp * eta_rb + P_aux, P_net_temp + P_aux
#     )
#     P_net = np.clip(P_net, -P_EM_MAX, P_EM_MAX)  # Clip P_net values

#     # Initialize BATT_SOC and calculate it iteratively
#     BATT_SOC = np.zeros_like(v)
#     BATT_SOC[0] = SOC0
#     for i in range(1, len(v)):
#         BATT_SOC[i] = BATT_SOC[i - 1] - P_net[i] / 3600 / BattCapacity_Wh

#     # Check for trip failure and calculate energy consumption
#     if BATT_SOC[-1] > SOCmin:
#         EE_consumed_kWh = np.sum(P_net) / 3600000
#         distance_m = np.sum(v)
#         SOCfinal = BATT_SOC[-1]
#     else:
#         tripfailuretime = np.where(BATT_SOC < SOCmin)[0][0] - 1
#         EE_consumed_kWh = np.sum(P_net[:tripfailuretime]) / 3600000
#         distance_m = np.sum(v[:tripfailuretime])
#         SOCfinal = SOCmin

#     # Calculate final metrics
#     SOCfinal_percent = SOCfinal * 100
#     distance_miles = distance_m * 0.000621371
#     Energy_consumed_km = EE_consumed_kWh / (distance_m / 1000)
#     Energy_consumed_miles = EE_consumed_kWh / distance_miles
#     Energy_consumed_miperkwh = distance_miles / EE_consumed_kWh

#     # Calculate recovered energy
#     P_net_neg = np.where(P_net < 0, P_net, 0)
#     EE_recovered_kWh = np.sum(P_net_neg) / 3600000

#     # Return results
#     return {
#         'model': (P_net / 1000).tolist(),
#         'EE_consumed_kWh': EE_consumed_kWh,
#         'EE_recovered_kWh': EE_recovered_kWh,
#         'SOC_final_percent': SOCfinal_percent,
#         'Energy_consumed_mile_per_kWh': Energy_consumed_miperkwh
#     }


def getEnergy(selection, speed_data, param_list):
    # Convert speed from km/h to m/s
    v = np.array(speed_data) / 3.6  

    # Calculate acceleration
    accel = np.zeros_like(v)
    accel[1:] = v[1:] - v[:-1]  

    # Unpack parameters
    (var01, powertrain, veh_mass, Veh_length, Prop_trac_axle, coef_friction,
     Eng_Power, Max_Power, Effi_trans, Cd, Af, Cr, c1, c2, Pedal_input,
     Gr1, Gr2, Effi_batt_ev, Min_SOC, Max_SOC, start_SOC, Effi_ev_motor,
     Effi_regen, SOC_limit_PHEV_s, Batt_capacity, Aux_consumption,
     Alpha_0, Alpha_1, Alpha_2, Alpha_3) = map(float, param_list)

    # Vehicle and battery parameters
    m = veh_mass
    SOC0 = start_SOC  
    SOCmin = Min_SOC  
    BattCapacity_Wh = Batt_capacity * 1000  
    P_aux = Aux_consumption * 1000  

    # Calculate forces
    F_In = m * accel
    F_Roll = m * G * (Cr / 1000) * (c1 * v * 3.6 + c2)
    F_Aero = 0.5 * P_AIR * Af * Cd * v ** 2
    F_Slope = m * G * TETA
    F_wheels = F_In + F_Roll + F_Aero + F_Slope

    # Power calculations
    P_wheels = F_wheels * v
    w_wheels_rads = v / R_W
    w_em_rads = w_wheels_rads * GEAR_RATIO_EM
    Power_kW = P_wheels / 1000.0  

    # Component efficiency
    comp_eta = ETA_BATTERY * ETA_DRIVELINE * ETA_EM

    # Select calculation based on input
    # NEED TO UPDATE TO DYNAMICALLY CALL THIS FROM THE FILE
    if selection == 1:
        out = calculate_total_fuel_ICEV(v, Alpha_0, Alpha_1, Alpha_2, Power_kW)
    elif selection == 2:
        out = calculate_total_fuel_BEV(w_em_rads, SOC0, SOCmin, BattCapacity_Wh, 
                                       P_aux, comp_eta, v, accel, P_wheels)
    elif selection == 3:
        out = calculate_total_fuel_HEV(v, Power_kW, Alpha_0, Alpha_1, Alpha_2, Alpha_3)
    elif selection == 4:
        out = calculate_total_fuel_HFCV(v, Power_kW, Max_Power)
    else:
        raise ValueError('Invalid input. Please enter a number between 1 and 4.')

    return out