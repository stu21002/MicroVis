import h5py

def read_first_value(file_path, group_name, dataset_name):
    try:
        print("Opening the HDF5 file...")
        with h5py.File(file_path, 'r') as file:
            print("Accessing the specified group...")
            group = file[group_name]
            print("Accessing the specified dataset...")
            dataset = group[dataset_name]

            print("Reading the first value from the dataset...")
            for y in range (1920):
                for x in range (1920):
                    first_value = dataset[0,0, y, x]
                    # if  first_value

                # print("First value from the dataset:")
                    print(x,":",y,"- ")
                    print(first_value)
                    print('\n')

    except Exception as e:
        print(f"An error occurred: {e}")

# Example usage
file_path = '/media/stuart/Elements/Big.hdf5'
group_name = '0'
dataset_name = 'DATA'

read_first_value(file_path, group_name, dataset_name)

