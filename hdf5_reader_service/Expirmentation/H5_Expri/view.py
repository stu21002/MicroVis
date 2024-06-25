import h5py

# Function to recursively extract the structure of the HDF5 file
def read_hdf5_structure(file_path):
    def recursive_extract(h5_node):
        structure = {}
        for key, item in h5_node.items():
            if isinstance(item, h5py.Group):
                structure[key] = recursive_extract(item)
            elif isinstance(item, h5py.Dataset):
                structure[key] = None  # We are only interested in the dataset names, not their values
        return structure

    with h5py.File(file_path, 'r') as file:
        structure = recursive_extract(file)
    
    return structure

# Specify the path to your HDF5 file
file_path = '/media/stuart/Elements/Big.hdf5'

# Read the HDF5 file and get the structure
hdf5_structure = read_hdf5_structure(file_path)

# Function to pretty-print the nested dictionary
def print_nested_dict(d, indent=0):
    for key, value in d.items():
        print(' ' * indent + str(key))
        if isinstance(value, dict):
            print_nested_dict(value, indent + 4)

# Print the structure of the HDF5 file
print_nested_dict(hdf5_structure)
