import h5py
import numpy as np

# Function to recursively extract the structure and data from the HDF5 file
def read_hdf5_detailed(file_path):
    def recursive_extract(h5_node):
        data = {}
        for key, item in h5_node.items():
            if isinstance(item, h5py.Group):
                data[key] = recursive_extract(item)
            elif isinstance(item, h5py.Dataset):
                data[key] = item[()]
                # if key == "DATA":
                #     for val in item:
                #         print(val)
        return data

    with h5py.File(file_path, 'r') as file:
        structure = recursive_extract(file)
    
    return structure

# Specify the path to your HDF5 file
file_path = './files/h5.hdf5'

# Read the HDF5 file and get the detailed data
hdf5_detailed_data = read_hdf5_detailed(file_path)

# # Function to pretty-print the nested dictionary
def print_nested_dict(d, indent=0):
    for key, value in d.items():
        print(' ' * indent + str(key))
        if isinstance(value, dict):
            print_nested_dict(value, indent + 4)
        else:
            print(' ' * (indent + 4) + str(value))

# Print the structure and content of the HDF5 file
print_nested_dict(hdf5_detailed_data)

