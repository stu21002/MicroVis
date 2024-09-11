#include "ReaderService.h"

#include <fitsio.h>
#include <fmt/format.h>
#include <math.h>

#include "../util/fits_util.h"

using namespace proto;
    ReaderService::ReaderService(int port) : port(port) {}

grpc::Status ReaderService::CheckStatus(grpc::ServerContext* context, const ::Empty* request,
                                        ::StatusResponse* response) {
  //ServicePrint("Status");
  response->set_status(true);
  response->set_statusmessage("OK");
  return grpc::Status::OK;
}
grpc::Status ReaderService::OpenFile(grpc::ServerContext* context, const ::OpenFileRequest* request,
                                     ::StatusResponse* response) {
  //ServicePrint("Opening File");
  fitsfile* fits_ptr = nullptr;
  int fits_status_code = 0;
  int fits_close_code = 0;

  if (request->uuid().empty() || request->file().empty()) {
    //ServicePrint("Opening File Uuid error");
    return {grpc::StatusCode::INVALID_ARGUMENT, "UUID and filename must be specified"};
  }

  if (request->hdu().empty() || request->hdu() == "0") {
    auto filename = request->directory()+request->file();
    fits_open_file(&fits_ptr, filename.c_str(), READONLY, &fits_status_code);
  } else {
    return {grpc::StatusCode::UNIMPLEMENTED, "HDU extension support not implemented yet"};
  }
  if (fits_status_code != 0) {
    return StatusFromFitsError(grpc::StatusCode::NOT_FOUND, fits_status_code, "Could not open file");
  }

  fits_files[request->uuid()] = fits_ptr;
  response->set_status(true);
  return grpc::Status::OK;
}

grpc::Status ReaderService::CloseFile(grpc::ServerContext* context, const ::FileCloseRequest* request,
                                      ::StatusResponse* response) {
  //ServicePrint("Closing File");
  if (request->uuid().empty()) {
    return {grpc::StatusCode::INVALID_ARGUMENT, "UUID must be specified"};
  }

  if (fits_files.find(request->uuid()) == fits_files.end()) {
    return {grpc::StatusCode::NOT_FOUND, fmt::format("File with UUID {} not found", request->uuid())};
  }

  int fits_status_code = 0;
  fits_close_file(fits_files[request->uuid()], &fits_status_code);

  if (fits_status_code != 0) {
    return StatusFromFitsError(grpc::StatusCode::INTERNAL, fits_status_code, "Could not close file");
  }
  fits_files.erase(request->uuid());
  response->set_status(true);
  return grpc::Status::OK;
}

grpc::Status ReaderService::GetFileInfo(grpc::ServerContext* context, const ::FileInfoRequest* request,
                                        ::FileInfoResponse* response) {
  //ServicePrint("File info");

  if (request->uuid().empty()) {
    return {grpc::StatusCode::INVALID_ARGUMENT, "UUID must be specified"};
  }

  auto it = fits_files.find(request->uuid());
  if (it == fits_files.end()) {
    return {grpc::StatusCode::NOT_FOUND, fmt::format("File with UUID {} not found", request->uuid())};
  }
  fitsfile* fits_ptr = it->second;

  int fits_status_code = 0;

  int hdu_num = 0;
  fits_get_hdu_num(fits_ptr, &hdu_num);
  if (hdu_num <= 0) {
    return StatusFromFitsError(grpc::StatusCode::INVALID_ARGUMENT, fits_status_code, "Could not get HDU number");
  }

  // response->set_hdunum(hdu_num);

  int hdu_type = 0;
  fits_get_hdu_type(fits_ptr, &hdu_type, &fits_status_code);
  if (fits_status_code != 0) {
    return StatusFromFitsError(grpc::StatusCode::INVALID_ARGUMENT, fits_status_code, "Could not get HDU type");
  }
  // response->set_hdutype(hdu_type);

  // Only image HDUs can have dimensions and data types
  if (hdu_type == IMAGE_HDU) {
    int num_dims = 0;
    int max_dims = 64;
    std::vector<long> dims(max_dims);
    int bit_pix = 0;
    fits_get_img_param(fits_ptr, max_dims, &bit_pix, &num_dims, dims.data(), &fits_status_code);
    if (fits_status_code != 0) {
      return StatusFromFitsError(grpc::StatusCode::INVALID_ARGUMENT, fits_status_code, "Could not get image parameters");
    }

    dims.resize(num_dims);
    response->set_success(true);
    FileInfo* file_info = response->mutable_file_info();
    FileInfoExtended* file_info_extended = response->mutable_file_info_extended();
    file_info_extended->set_dimensions(num_dims);

    // for (size_t i = 0; i < num_dims; i++)
    // {
    //   std::cout<<dims[i]<<std::endl;
    // }
  

    if (num_dims > 0){
      file_info_extended->set_width(dims[0]);
      if (num_dims > 1){
        file_info_extended->set_height(dims[1]);
        if (num_dims > 2){
          file_info_extended->set_depth(dims[2]);
          if (num_dims > 3){
            file_info_extended->set_stokes(dims[3]);
  
          }
        }
      }
    }


  }

  return grpc::Status::OK;
}

grpc::Status ReaderService::GetImageDataStream(::grpc::ServerContext* context, const ::ImageDataRequest* request,::grpc::ServerWriter< ::ImageDataResponse>* writer) {
  //ServicePrint("Image Data");
  auto begin = std::chrono::high_resolution_clock::now();
  long total_bytes = 1;


  const size_t MAX_CHUNK_SIZE = 2040 * 2040;

  if (request->uuid().empty()) {
    return {grpc::StatusCode::INVALID_ARGUMENT, "UUID must be specified"};
  }

  auto it = fits_files.find(request->uuid());
  if (it == fits_files.end()) {
    return {grpc::StatusCode::NOT_FOUND, fmt::format("File with UUID {} not found", request->uuid())};
  }
  fitsfile* fits_ptr = it->second;

  int fits_status_code = 0;
  int fits_close_code = 0;
  
  // std::vector<long> start_pix(request->start().begin(), request->start().end());
  // std::vector<long> last_pix(start_pix.size());
  // long num_pixels = 1;
  // for (size_t i = 0; i < start_pix.size(); i++)
  // {
  //   num_pixels *= request->count()[i];
  //   last_pix[i] = start_pix[i]+request->count()[i];
  // }

  int startZ = request->start(2);
  int endZ = request->count(2)+startZ;

  std::vector<long> start(request->start().size(),1);
  std::vector<long> last(request->start().size(),1);

  start[0] = request->start(0);
  start[1] = request->start(1);
  last[0] = request->count(0)+start[0]-1;
  last[1] = request->count(1)+start[1]-1;


  std::vector<long> increment = {1, 1, 1, 1};
  
  long num_pixels = request->count(0)*request->count(1);
  int num_bytes = num_pixels * sizeof(float);
  total_bytes *= num_bytes *request->count(2);
  std::vector<float> buffer(num_pixels);
  // fits_read_pix(fits_ptr, TFLOAT, start_pix.data(),num_pixels, nullptr, response->mutable_data()->data(), nullptr, &fits_status_code);
  
  

  for (size_t i = startZ; i < endZ; i++)
  {

    start[2]=i;
    last[2]=i;

    for (size_t i = 0; i < start.size(); i++)
    {
      std::cout<<start[i]<<" ";
    }
    std::cout<<std::endl;
    
    for (size_t i = 0; i < start.size(); i++)
    {
      std::cout<<last[i]<<" ";
    }
    std::cout<<std::endl;
    
    fits_read_subset(fits_ptr, TFLOAT, start.data(), last.data(), increment.data(), nullptr, buffer.data(),
                      nullptr, &fits_status_code);


    if (fits_status_code != 0) {
      return StatusFromFitsError(grpc::StatusCode::INTERNAL, fits_status_code, "Could not read image data");
    }


    size_t offset = 0;
    size_t chunk_size = MAX_CHUNK_SIZE / sizeof(float);

    while (offset < buffer.size()) {
        size_t current_chunk_size = std::min(chunk_size, buffer.size() - offset);
        // auto begin = std::chrono::high_resolution_clock::now();

        ImageDataResponse response;
        response.mutable_raw_values_fp32()->resize(current_chunk_size*sizeof(float));
    
        response.set_num_pixels(current_chunk_size);
        float* response_data = reinterpret_cast<float*>(response.mutable_raw_values_fp32()->data());

        std::copy(buffer.data() + offset, buffer.data() + offset + current_chunk_size, response_data);
        
        writer->Write(response);
        // auto end = std::chrono::high_resolution_clock::now();
        // auto duration1 = std::chrono::duration_cast<std::chrono::milliseconds>(end - begin);
        
        // // std::cout<<duration1.count()<<std::endl;

        offset += current_chunk_size;
    }

  }
  auto end = std::chrono::high_resolution_clock::now();
  auto duration = std::chrono::duration_cast<std::chrono::milliseconds>(end - begin);
  ServicePrint(std::to_string(duration.count())+","+std::to_string(total_bytes)+","+std::to_string(total_bytes/duration.count()));
  return grpc::Status::OK;
}

::grpc::Status ReaderService::GetSpectralProfile(::grpc::ServerContext* context, const ::SpectralProfileReaderRequest* request, ::SpectralProfileResponse* response) {
  
  //ServicePrint("Spectral");
  auto begin = std::chrono::high_resolution_clock::now();

  if (request->uuid().empty()) {
    return {grpc::StatusCode::INVALID_ARGUMENT, "UUID must be specified"};
  }

  auto width = std::max(request->width(), 1);
  auto height = std::max(request->height(), 1);

  auto it = fits_files.find(request->uuid());
  if (it == fits_files.end()) {
    return {grpc::StatusCode::NOT_FOUND, fmt::format("File with UUID {} not found", request->uuid())};
  }
  fitsfile* fits_ptr = it->second;

  int fits_status_code = 0;

  int num_dims = 0;
  int max_dims = 2;
  std::vector<long> dims(max_dims);
  int bit_pix = 0;
  fits_get_img_param(fits_ptr, max_dims, &bit_pix, &num_dims, dims.data(), &fits_status_code);
  if (fits_status_code != 0) {
    return StatusFromFitsError(grpc::StatusCode::INVALID_ARGUMENT, fits_status_code, "Could not get image parameters");
  }

  const auto num_pixels = request->numpixels();
  // TODO: support other data types!
  const auto num_bytes = num_pixels * sizeof(float);
  response->mutable_raw_values_fp32()->resize(num_bytes);

  if (width == 0 && height == 0) {
    std::vector<long> start_pix = {request->x(), request->y(), request->z(), 1};
    std::vector<long> last_pix = {request->x() + width - 1, request->y() + height - 1, request->z() + request->numpixels() - 1, 1};
    std::vector<long> increment = {1, 1, 1, 1};
    fits_read_subset(fits_ptr, TFLOAT, start_pix.data(), last_pix.data(), increment.data(), nullptr, response->mutable_raw_values_fp32()->data(),
                     nullptr, &fits_status_code);
    if (fits_status_code != 0) {
      return StatusFromFitsError(grpc::StatusCode::INTERNAL, fits_status_code, "Could not read image data");
    }
  } else {


    const auto required_buffer_size = width*height;
    std::vector<float> required_buffer(required_buffer_size);

    float* data_ptr = reinterpret_cast<float*>(response->mutable_raw_values_fp32()->data());

    std::vector<bool> mask = getMask(request->region_info(),request->x(),request->y(),width,height);
    for (auto i = 0; i < request->numpixels(); i++) {
      int maskIndex = 0;
      const auto channel = request->z() + i;

      std::vector<long> start_pix = {request->x(), request->y(), channel, 1};
      std::vector<long> last_pix = {request->x() + width - 1, request->y() + height - 1, channel, 1};
      std::vector<long> increment = {1, 1, 1, 1};

      // fits_read_pix(fits_ptr, TFLOAT, start_pix.data(), required_buffer_size, nullptr, required_buffer.data(), nullptr, &fits_status_code);
  

     fits_read_subset(fits_ptr, TFLOAT, start_pix.data(), last_pix.data(), increment.data(), nullptr, required_buffer.data(), nullptr,
                      &fits_status_code);

     if (fits_status_code != 0) {
       return StatusFromFitsError(grpc::StatusCode::INTERNAL, fits_status_code, "Could not read image data");
     }

      int count = 0;
      float sum = 0;

      long offset = 0;
      for (int row = 0; row < height; row++) {
        for (int col = 0; col < width; col++) {
          if (mask[maskIndex++]){
            const auto value = required_buffer[offset++];
            if (std::isfinite(value)) {
              sum += value;
              count++;
            }
          }
          else{
            offset++;
          }
        }
      }


      const float channel_mean = count > 0 ? sum / count : NAN;
      data_ptr[i] = channel_mean;
    }
  }

  auto end = std::chrono::high_resolution_clock::now();
  auto duration = std::chrono::duration_cast<std::chrono::milliseconds>(end - begin);

  ServicePrint(std::to_string(duration.count()));
  return grpc::Status::OK;
}
  std::vector<bool> ReaderService::getMask(RegionInfo region_info,int startX,int startY,int numX, int numY){
        std::vector<bool> mask(numX*numY,true);

        switch (region_info.regiontype())
        {
        case RegionType::CIRCLE:{
            int radi = region_info.controlpoints().Get(1).x();
            int centerX = region_info.controlpoints().Get(0).x();
            int centerY = region_info.controlpoints().Get(0).y();
            int index = 0;
            double pow_radius = pow(radi,2);
            // float center = (diameter-1)/2.0;
            // float centerY = (diameter-1)/2.0;

            for (int x = startX-1; x < startX+numX-1; x++) {
                //part of circle calculation
                double pow_x = pow(x-centerX,2);
                for (int y = startY-1; y < startY+numY-1; y++) {
                    //if point is inside the circle
                    if (pow_x + pow(y-centerY,2) > pow_radius){
                        mask[index] = false;
                    }
                    index++;
                }
                std::cout<<std::endl;
            }
            break;
        }
        default:
            break;
        }
        return mask;
    }


    void ReaderService::ServicePrint(std::string msg){
        std::cout << "[" << port << "] " << msg << std::endl;
    }

