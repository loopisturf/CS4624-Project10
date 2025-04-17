import numpy as np

def summing(
    v,            # Array of vehicle speeds (m/s)
    power_kW,     # Array of power values (kW)
    parameters    # Dictionary of required parameters
):
    """
    Generic function to calculate total fuel/energy consumption.
    Adds up all numeric parameter values and returns that value across the model.

    Parameters:
    v (array): Speed data in meters per second.
    power_kW (array): Power data in kilowatts.
    parameters (dict): A dictionary containing any numeric parameters.

    Returns:
    dict: A dictionary containing the model and summed parameter value.
    """
    
    # Sum all numeric parameter values
    param_total = sum(val for val in parameters.values() if isinstance(val, (int, float)))

    # Create a model using the total parameter sum
    model = [param_total] * len(v)

    # Total fuel (or generic value) is the sum of the model
    total_value = np.sum(model)

    return {
        'model1': model,
        'in': total_value
    }