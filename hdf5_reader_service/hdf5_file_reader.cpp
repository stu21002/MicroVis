#include <string>
#include <iostream>
#include <unistd.h>
#include <H5Cpp.h>

int main() {
    try {
        // Open an existing HDF5 file

    char cwd[1024];
    if (getcwd(cwd, sizeof(cwd)) != nullptr) {
        std::cout << "Current directory: " << cwd << std::endl;
    } else {
        std::cerr << "Error: Unable to get current directory." << std::endl;
        return 1;
    }

        H5::H5File _imgfile = H5::H5File("./files/example.hdf5", H5F_ACC_RDONLY);

        // Open the root group
        H5::Group _group = _imgfile.openGroup("0");
        H5::DataSet _dataset = _group.openDataSet("DATA");

        std::cout << "We have progress" << std::endl;

    } catch (H5::Exception& error) {
        error.printErrorStack();
        return -1;
    }

    return 0;
}
