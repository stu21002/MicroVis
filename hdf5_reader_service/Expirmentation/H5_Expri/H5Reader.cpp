
#include <string>
#include <cmath>
#include <chrono>
#include <iostream>
#include <vector>
// #include "H5Reader.h"
// #include <H5Cpp.h>     
// #include <iostream>
 
//     H5Reader::H5Reader(const std::string& fileName){
//     	_fileName = fileName;
//     }

//     bool H5Reader::Openfile(){
//         try
//         {
			
//         	_file = H5::H5File(_fileName,H5F_ACC_RDONLY);
//         	_group = _file.openGroup("0");
//         	_dataset = _group.openDataSet("DATA");
// 			H5::DataSpace dataspace = _dataset.getSpace();
// 			_N = dataspace.getSimpleExtentNdims();
//         	return true;
//         }
//         catch(const H5::Exception& e)
//         {
//         	std::cerr << e.getCDetailMsg() << '\n';
//         	return false;
//         }
        
        
//     }
//     bool H5Reader::Closefile(){
//         try
//         {
//         	_file.close();
//         	return true;
//         }
//         catch(const H5::Exception& e)
//         {
//         	std::cerr << e.getCDetailMsg() << '\n';
//         	return false;
//         }
//     }
    
// void H5Reader::getFileInfo() {
//     try {
// 	H5::FileIException::dontPrint();
// 	H5::Group group = _file.openGroup("0");
// 	std::cout << "File info:\n";
// 	group.iterateElems(".", NULL, [](hid_t loc_id, const char *name, void *opdata) -> herr_t {
// 	   std::cout << name << std::endl;
// 	   return 0;
// 	}, NULL);
//     } catch (const H5::Exception& e) {
// 	std::cerr << e.getCDetailMsg() << '\n';
//     }
// }

// void H5Reader::getImageData() {
//     try {
// 	H5::DataSpace dataspace = _dataset.getSpace();
// 	int rank = dataspace.getSimpleExtentNdims();
// 	hsize_t dims[2];
// 	dataspace.getSimpleExtentDims(dims, NULL);

// 	std::cout << "DATA dimensions: ";
// 	for (int i = 0; i < rank; i++) {
// 	    std::cout << dims[i] << " ";
// 	}
// 	std::cout << std::endl;

// 	std::vector<float> data(dims[0] * dims[1]);
// 	_dataset.read(data.data(), H5::PredType::NATIVE_FLOAT, dataspace);

// 	std::cout << "First 10 elements of DATA:\n";
// 	// for (size_t i = 0; i < std::min(static_cast<size_t>(10), data.size()); i++) {
// 	//     std::cout << data[i] << " ";
// 	// }
// 	for (size_t i = 0; i < data.size(); i++) {
// 	    std::cout << data[i] << " ";
// 	}
// 	std::cout << std::endl;
//     } catch (const H5::Exception& e) {
// 	std::cerr << e.getCDetailMsg() << '\n';
//     }
// }


// //code from carta Utilities...
//  void  H5Reader::getRegion(std::vector<hsize_t> start, std::vector<hsize_t> end) {
// 	std::vector<float> result;
//     std::vector<hsize_t> h5_start;
//     std::vector<hsize_t> h5_count;
//     hsize_t result_size = 1;

// 	std::cout << _N << "\n";
//     for (int d = 0; d < _N; d++) {
//         // Calculate the expected result size
//         h5_start.insert(h5_start.begin(), d < start.size() ? start[d] : 0);
//         h5_count.insert(h5_count.begin(), d < start.size() ? end[d] - start[d] : 1);
//         result_size *= end[d] - start[d];
// 		// std::cout << result_size << "\n";
// 		// std::cout << end[d] << "\n";
// 		// std::cout << start[d] << "\n";
//     }
	
//     result.resize(result_size);
//     H5::DataSpace mem_space(1, &result_size);

//     auto file_space = _dataset.getSpace();
//     file_space.selectHyperslab(H5S_SELECT_SET, h5_count.data(), h5_start.data());//question
//     _dataset.read(result.data(), H5::PredType::NATIVE_FLOAT, mem_space, file_space);
	
	
//     for (size_t i = 0; i < result.size(); i++) {
// 	    std::cout << result[i] << "\n";
// 	}
// }


// 	void H5Reader::getSpectralProfile() {}

int main() {
    // std::string fileName = "./files/example.hdf5";
    // H5Reader reader(fileName);

    // if (reader.Openfile()) {
	// std::cout << "File opened successfully.\n";

	// reader.getFileInfo();
	// reader.getImageData();

	// std::vector<hsize_t> start = {0, 0, 0}; // Starting indices for x and y dimensions
	// std::vector<hsize_t> end = {2, 2, 2};   // Ending indices for x and y dimensions
	// reader.getRegion(start, end);

	// reader.Closefile();
    // } else {
	// std::cerr << "Failed to open file.\n";
    // }
	const size_t num_pixels = 1917;
    const size_t height = 401;
    const size_t width = 401;
    std::vector<float> data(num_pixels * height * width, 2.3334012441); // Example data initialization

    float sum = 0.0;
    size_t count = 0;

    auto st = std::chrono::high_resolution_clock::now();

    // Enable parallel processing with OpenMP
    #pragma omp parallel for reduction(+:sum, count)
    for (size_t zpos = 0; zpos < num_pixels; zpos++) {
        for (size_t ypos = 0; ypos < height; ypos++) {
            int yoffset = ypos * num_pixels + zpos;

            for (size_t xpos = 0; xpos < width; xpos++) {
                int index = ypos * width * num_pixels + zpos * width + xpos;
                float val = data[index];
                
                if (std::isfinite(val)) {
                    sum += val;
                    count++;
                }
            }
        }
    }
	auto mid = std::chrono::high_resolution_clock::now();
    auto duration1 = std::chrono::duration_cast<std::chrono::milliseconds>(mid - st);
    std::cout << "Cal " <<duration1.count() << std::endl;


    std::cout << "Sum: " << sum << ", Count: " << count << std::endl;
    return 0;
}

     
 
