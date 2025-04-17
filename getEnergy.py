import numpy as np
import math
import sys
from config import *
from calculation_files.BEV import *
from calculation_files.HEV import *
from calculation_files.HFCV import *
from calculation_files.ICEV import *
from calculation_files.all import *
import os
import importlib

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

   
    # Select the subdirectory based on the selection input
    subdirectory = None
    args = None
    if selection == 1:  # ICEV
        subdirectory = "ICEV"
        parameters = {
            'Alpha_0': Alpha_0,
            'Alpha_1': Alpha_1,
            'Alpha_2': Alpha_2
        }
        args = [v, Power_kW, parameters]

    elif selection == 2:  # BEV
        subdirectory = "BEV"
        parameters = {
            'w_em_rads': w_em_rads,
            'SOC0': SOC0,
            'SOCmin': SOCmin,
            'BattCapacity_Wh': BattCapacity_Wh,
            'P_aux': P_aux,
            'comp_eta': comp_eta,
            'accel': accel,
            'P_wheels': P_wheels
        }
        args = [v, Power_kW, parameters]

    elif selection == 3:  # HEV
        subdirectory = "HEV"
        parameters = {
            'Alpha_0': Alpha_0,
            'Alpha_1': Alpha_1,
            'Alpha_2': Alpha_2,
            'Alpha_3': Alpha_3
        }
        args = [v, Power_kW, parameters]

    elif selection == 4:  # HFCV
        subdirectory = "HFCV"
        parameters = {
            'Max_Power': Max_Power
        }
        args = [v, Power_kW, parameters]

    else:
        raise ValueError('Invalid input. Please enter a number between 1 and 4.')

    # Path to the corresponding subdirectory
    path = os.path.join('calculation_files', subdirectory)

    # Initialize the output variable
    out = None
    all_out = None

    # Loop through all Python files in the selected subdirectory
    for filename in os.listdir(path):
        if filename.endswith(".py") and filename != "__init__.py":
            # Extract the name of the module (without the ".py" extension)
            module_name = filename[:-3]

            # Dynamically import the module
            module = importlib.import_module(f'calculation_files.{subdirectory}.{module_name}')
            
            # Call the corresponding function from the module
            func = getattr(module, module_name)  # Assumes function name matches filename

            # Call the function with the appropriate arguments based on the selection
            out = func(*args)

    # If no function was called (out is still None), raise an error
    if out is None:
        raise ValueError(f"No valid Python file found in the {subdirectory} directory.")

    # Now, run all the functions from the 'all' directory
    all_path = os.path.join('calculation_files', 'all')

    for filename in os.listdir(all_path):
        if filename.endswith(".py") and filename != "__init__.py":
            # Extract the name of the module (without the ".py" extension)
            module_name = filename[:-3]

            # Dynamically import the module from the "all" directory
            module = importlib.import_module(f'calculation_files.all.{module_name}')
            
            # Call the corresponding function from the module
            func = getattr(module, module_name)  # Assumes function name matches filename

            # Call the function with the appropriate arguments (same as above)
            all_out = func(*args)

    result = None
    if out is not None and all_out is not None:
        # Safe to use out as a dictionary
        result = {**out, **all_out}
    elif out is None:
        # Handle the case where out is None
        result = all_out
    else:
        result = out
    print("result")
    print(result)
    return result