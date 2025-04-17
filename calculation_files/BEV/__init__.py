import os
import importlib

# Path to the current subdirectory (BEV)
subdirectory_path = os.path.dirname(__file__)

# Iterate through all files in the BEV subdirectory
for filename in os.listdir(subdirectory_path):
    if filename.endswith('.py') and filename != '__init__.py':
        # Dynamically import the module
        module_name = filename[:-3]  # Remove the '.py' extension
        importlib.import_module(f"{__name__}.{module_name}")