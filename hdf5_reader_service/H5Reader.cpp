
#include <string>
#include "H5Reader.h"
#include <H5Cpp.h>     
#include <iostream>
 
    H5Reader::H5Reader(const std::string& fileName){
    	_fileName = fileName;
    }

    bool H5Reader::Openfile(){
        try
        {
        	_file = H5::H5File(_fileName,H5F_ACC_RDONLY);
        	_group = _file.openGroup("0");
        	_dataset = _group.openDataSet("DATA");
        	return true;
        }
        catch(const H5::Exception& e)
        {
        	std::cerr << e.getCDetailMsg() << '\n';
        	return false;
        }
        
        
    }
    bool H5Reader::Closefile(){
        try
        {
        	_file.close();
        	return true;
        }
        catch(const H5::Exception& e)
        {
        	std::cerr << e.getCDetailMsg() << '\n';
        	return false;
        }
    }
    
void H5Reader::getFileInfo() {
    try {
	H5::FileIException::dontPrint();
	H5::Group group = _file.openGroup("0");
	std::cout << "File info:\n";
	group.iterateElems(".", NULL, [](hid_t loc_id, const char *name, void *opdata) -> herr_t {
	   std::cout << name << std::endl;
	   return 0;
	}, NULL);
    } catch (const H5::Exception& e) {
	std::cerr << e.getCDetailMsg() << '\n';
    }
}

void H5Reader::getImageData() {
    try {
	H5::DataSpace dataspace = _dataset.getSpace();
	int rank = dataspace.getSimpleExtentNdims();
	hsize_t dims[2];
	dataspace.getSimpleExtentDims(dims, NULL);

	std::cout << "DATA dimensions: ";
	for (int i = 0; i < rank; i++) {
	    std::cout << dims[i] << " ";
	}
	std::cout << std::endl;

	std::vector<int> data(dims[0] * dims[1]);
	_dataset.read(data.data(), H5::PredType::NATIVE_INT, dataspace);

	std::cout << "First 10 elements of DATA:\n";
	for (size_t i = 0; i < std::min(static_cast<size_t>(10), data.size()); i++) {
	    std::cout << data[i] << " ";
	}
	std::cout << std::endl;
    } catch (const H5::Exception& e) {
	std::cerr << e.getCDetailMsg() << '\n';
    }
}


	void H5Reader::getRegion() {}
	void H5Reader::getSpectralProfile() {}

int main() {
    std::string fileName = "./files/example.hdf5";
    H5Reader reader(fileName);

    if (reader.Openfile()) {
	std::cout << "File opened successfully.\n";

	reader.getFileInfo();
	reader.getImageData();

	reader.Closefile();
    } else {
	std::cerr << "Failed to open file.\n";
    }

    return 0;
}

     
 
