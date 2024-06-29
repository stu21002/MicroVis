import h5py
import numpy as np

# Define the dimensions for the new larger dataset
new_dims = (100, 200, 300)  # Example dimensions, change as needed

# Generate random data with the new dimensions
random_data = np.random.rand(*new_dims)

# Transpose the data such that Z is continuous (assuming Z is the third dimension)
transposed_data = np.transpose(random_data, (2, 1, 0))

# Specify the path for the new HDF5 file
new_file_path = 'new_h5_larger.hdf5'

with h5py.File(new_file_path, 'w') as f:
    # Create a new dataset with the random data
    
    data = f.create_dataset('DATA', data=random_data)
    
    # Create a new dataset for the transposed data
    transposed_dataset = f.create_dataset('TRANSPOSED_DATA', data=transposed_data)

print(f"New larger HDF5 file created at {new_file_path}.")
