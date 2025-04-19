import math
import numpy as np

def ParticleMatter(v, power_kw, engineType, parameters):
    """
    Calculate total PM2.5 emissions over arrays of speed and power.
    dec, mass, veh vattery capcacity
    Parameters:
    - engineType (str)
    - spd_array (array-like): speeds in km/h
    - dec (float): deceleration in m/s^2 (negative for braking)
    - mass (float): vehicle mass in kg
    - power_array (array-like): power values in watts

    Returns:
    - total_pm2_5 (float): Total PM2.5 emission in mg/s summed over all entries
    """
    spd_array = np.array(v)
    power_array = np.array(power_kw)
    dec_array = np.array(parameters['accel'])  # assuming deceleration is an array now
    mass = parameters['veh_mass']
    veh_battery_capacity = parameters['BattCapacity_Wh']
    
    C_param = 1.0
    power_min = -1 * veh_battery_capacity / C_param  # watt-hours
    total_pm2_5 = 0.0
    pm_model_list = []
    allowed_engine_types = ["BEV", "ICEV"]
    if engineType not in allowed_engine_types:
        return {
        'pm_model': pm_model_list,
        'micrometers': 0
    }

    for spd, power, dec in zip(spd_array, power_array, dec_array):  # Iterating over all arrays
        pm25_brake = 0.0
        pm25_tire = 0.0

        adjusted_dec = dec
        if dec < 0.0:
            adjusted_dec = max(-6.0, dec)
            if engineType == "ICEV":  # ICEV
                pm25_brake = 0.052 * (0.548782 + 0.000305 * mass) * abs(adjusted_dec) ** 3.195
            elif engineType == "BEV":  # BEV
                if power < power_min:
                    adjusted_dec = (power - power_min) / power * adjusted_dec if power != 0 else 0
                    pm25_brake = 0.052 * (0.548782 + 0.000305 * mass) * abs(adjusted_dec) ** 3.195
                

        pm25_tire = 2.97213e-6 * spd * mass * math.exp(-0.009375 * spd)
        pm2_5 = pm25_brake + pm25_tire
        total_pm2_5 += pm2_5
        pm_model_list.append(pm2_5)

    return {
        'pm_model': pm_model_list,  # PM2.5 per input speed/power pair
        'micrometers': total_pm2_5
    }