import numpy as np

"""
Instructions:
Function name must be the exact same as the file name. 
Parameters to work with:
    powertrain (float): Type of Powertrain
    veh_mass (float): Mass of the vehicle in kg
    Veh_length (float): Length of the vehicle in meters
    Prop_trac_axle (float): Proportion mass on tractive axle (Whether the propulsion is front, rear, or all-wheel drive)
    coef_friction (float): Coefficient of friction between tires and road
    Eng_Power (float): Power of the engine in kW
    Max_Power (float): Maximum power of the engine in kW
    Effi_trans (float): Transmission efficiency
    Cd (float): Coefficient of drag
    Af (float): Frontal area in m^2
    Cr (float): Rolling coefficient
    c1, c2 (float): Emperical coefficients for rolling resistance
    Pedal_input (float): Driver throttle input (0 to 1)
    Gr1, Gr2 (float): Gear ratios
    Effi_batt_ev (float): Battery efficiency
    Min_SOC, Max_SOC (float): Minimum and maximum allowable state of charge
    SOC0 (float): Initial state of charge
    Effi_ev_motor (float): Efficiency of the motor
    Effi_regen (float): Regenerative braking efficiency
    SOC_limit_PHEV_s (float): SOC level where PHEV stops using EV mode
    Batt_capacity (float): Capacity of the battery in kWh
    Aux_consumption (float): Auxiliary consumption in kW
    Alpha_0, Alpha_1, Alpha_2, Alpha_3 (float): Coefficients in a fuel consumption or emissions polynomial model
    accel (array of floats): Acceleration (m/s^2)
    BattCapacity_Wh (float): Battery Capacity in Wh
    P_aux (float): Power drawn by auxiliary systems in kW
    F_In (array of floats):	Input force from the engine/motor
    F_Roll (array of floats): Rolling resistance force
    F_Aero (array of floats): Aerodynamic drag force
    F_Slope (float): Force due to road gradient.
    F_wheels (array of floats): Total force transmitted to the wheels
    P_wheels (array of floats): Power at the wheels in kW
    w_wheels_rads (array of floats): Wheel angular speed in radians/sec.
    w_em_rads (array of floats): Electric motor angular speed in radians/sec.
    comp_eta (float): Combined efficiency of multiple components
"""
def fuction_name(
    v,            # Array of vehicle speeds (m/s)
    power_kW,     # Array of power values (kW)
    engine_type,  # This will the current engine the function is being called on
    parameters    # Dictionary of required parameters
):
    """
    Template function for calculating total fuel/energy consumption.
    Modify this function to suit different vehicle types or models.
    
    Parameters:
    v (array): Speed data in meters per second.
    power_kW (array): Power consumption data in kilowatts.
    parameters (dict): A dictionary containing necessary coefficients and vehicle parameters.

    Returns:
    dict: A dictionary containing calculated metric(s)
    """
    
    
    # Extract parameters (modify or add new parameters as needed)
    param1 = parameters.get('param_name1', 0)  
    param2 = parameters.get('param_name2', 0)  
    param3 = parameters.get('param_name3', 0)  
    
    # model that is used to calculate the metric value for the given speed
    # modify for your metric
    model_name = np.where(power_kW < 0, param1, 
                      param1 + param2 * power_kW + param3 * power_kW**2)

    allowed_engine_types = ['Engine1', 'Engine2']
    if engine_type not in allowed_engine_types:
        return {
        'model_name': model,
        'units': 0
    }
    
    # Compute value(s) needed to calculate the total value of your metric over the speed profile
    total_metric = param1 + param2
    
    # Add any conversion values necessary
    
    return {
        'model_name_that_matchs_input': model.tolist(),
        'units_that_match_input': total_metric
    }