import os
import importlib

# Path to the current directory
directory_path = os.path.dirname(__file__)

# Iterate through all files in the directory
for filename in os.listdir(directory_path):
    if filename.endswith('.py') and filename != '__init__.py':
        # Dynamically import the module
        module_name = filename[:-3]
        module = importlib.import_module(f'{__name__}.{module_name}')
        
        # Import all functions from the module into the global namespace
        for attr in dir(module):
            if callable(getattr(module, attr)):
                globals()[attr] = getattr(module, attr)