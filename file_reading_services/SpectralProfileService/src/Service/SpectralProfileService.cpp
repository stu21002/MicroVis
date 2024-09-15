#include "SpectralProfileService.h"


//Getting Stream from file reading services and performing calculations
proto::SpectralServiceResponse FileSerivceClient::getImageData(const std::string& end_server_address, const std::string& uuid, const RegionInfo& region_info, int depth, bool hasPerm) {
    
    //Creating connection
    auto channel = grpc::CreateChannel(end_server_address, grpc::InsecureChannelCredentials());
    std::unique_ptr<proto::FileService::Stub> stub = proto::FileService::NewStub(channel);
    ClientContext context;


    //Creating request parameters
    int counter = 0;
    auto tempWidth = 1.0;
    auto tempHeight = 1.0;
    if (region_info.regiontype()==proto::RECTANGLE){
        tempWidth = region_info.controlpoints()[1].x() / 2.0;
        tempHeight = region_info.controlpoints()[1].y() / 2.0;
    }else{
        tempWidth = region_info.controlpoints()[1].x() ;
        tempHeight = region_info.controlpoints()[1].y();
    }



    const int startingX = ceil(region_info.controlpoints()[0].x() - tempWidth);
    const int startingY = ceil(region_info.controlpoints()[0].y() - tempHeight);
    const int endingX = floor(region_info.controlpoints()[0].x() + tempWidth);
    const int endingY = floor(region_info.controlpoints()[0].y() + tempHeight);
    const int width = endingX - startingX + 1;
    const int height = endingY - startingY + 1;

    ImageDataRequest request;
    request.set_uuid(uuid);
    request.add_start(startingX);
    request.add_start(startingY);
    request.add_start(0);
    request.add_start(0);
    request.add_count(width);
    request.add_count(height);
    request.add_count(depth);
    request.add_count(1);
    request.set_perm_data(hasPerm);

    //Requesting data from file reading services
    std::unique_ptr<ClientReader<ImageDataResponse>> reader(stub->GetImageDataStream(&context, request));

    //initialising counters
    int currentDepth = 0;
    int currentHeight = 0;
    int currentWidth = 0;

    //initialising stats
    std::vector<float> sum(depth, 0);
    std::vector<int> count(depth, 0);

    //getting mask for region
    std::vector<bool> mask = getMask(region_info);
   
    // auto durationTot = std::chrono::milliseconds(0);

    ImageDataResponse response;
    int maskIndex = 0;
    //Checking what data of data is being received 
    if (hasPerm) {
        //Permuated Data
        //Handling stream
        while (reader->Read(&response)) {

            int index = 0;

            //getting values
            int num_pixels = response.raw_values_fp32().size() / sizeof(float);
            std::vector<float> values(num_pixels);
            memcpy(values.data(), response.raw_values_fp32().data(), values.size() * sizeof(float));

            //looping through received values
            while (index < num_pixels) {
                //Counter conidtions
                if (currentDepth >= depth) {
                    currentDepth = 0;
                    currentHeight++;
                    maskIndex++;
                    if (currentHeight == height) {
                        currentWidth++;
                        currentHeight = 0;
                    }
                }

                //Pixel in mask
                if (!mask[maskIndex]) {
                    if (depth + index > num_pixels) {
                        currentDepth = depth - (num_pixels - index);
                        index = num_pixels;
                    } else {
                        index += depth - currentDepth;
                        currentDepth = depth;
                     
                    }
                    continue;
                }

                //statistic calculation
                const float value = values[index++];
                if (std::isfinite(value)) {
                    sum[currentDepth] += value;
                    count[currentDepth]++;
                    currentDepth++;
                }
            }
  
        }

        //Partial Statistic calculations 
        SpectralServiceResponse spectral_response;
        spectral_response.mutable_raw_values_fp32()->resize(depth * sizeof(float));
        float* spectral_profile = reinterpret_cast<float*>(spectral_response.mutable_raw_values_fp32()->data());

        for (size_t i = 0; i < depth; i++) {
            spectral_profile[i] = sum[i] / count[i];
        }

        Status status = reader->Finish();

        if (!status.ok()) {
            std::cerr << "gRPC stream failed: " << status.error_message() << std::endl;
        }
        return spectral_response;
    
    } else {
        //Normal/FITS data
        SpectralServiceResponse spectral_response;
        spectral_response.mutable_raw_values_fp32()->resize(depth * sizeof(float));
        float* spectral_profile = reinterpret_cast<float*>(spectral_response.mutable_raw_values_fp32()->data());

        while (reader->Read(&response)) {
            int num_pixels = response.raw_values_fp32().size() / sizeof(float);
            std::vector<float> values(num_pixels);
            memcpy(values.data(), response.raw_values_fp32().data(), values.size() * sizeof(float));

            int index = 0;

            while (index < num_pixels) {

                //Counter Conditions
                if (currentWidth >= width) {
                    currentWidth = 0;
                    currentHeight++;
                    if (currentHeight >= height) {
                        spectral_profile[currentDepth] = sum[currentDepth] / count[currentDepth];
                        currentDepth++;
                        currentHeight = 0;
                        maskIndex = 0;
                    }
                }
                //Pixel in mask
                if (!mask[maskIndex++]) {
                    currentWidth++;
                    index++;
                    continue;
                }

                //Statistic calculation 
                const float value = values[index++];
                if (std::isfinite(value)) {
                    sum[currentDepth] += value;
                    count[currentDepth]++;
                }
                currentWidth++;
            }
        }

        Status status = reader->Finish();

        if (!status.ok()) {
            std::cerr << "gRPC stream failed: " << status.error_message() << std::endl;
        }

        return spectral_response;
    }
}


//Creating a mask for a region
std::vector<bool> FileSerivceClient::getMask(const RegionInfo& region_info) {
    switch (region_info.regiontype()) {
        case proto::RegionType::CIRCLE: {

            //Conversion of CARTA's co-ordinate system to indexes
            const int startingX = ceil(region_info.controlpoints()[0].x() - region_info.controlpoints()[1].x());
            const int startingY = ceil(region_info.controlpoints()[0].y() - region_info.controlpoints()[1].y());
            const int endingX = floor(region_info.controlpoints()[0].x() + region_info.controlpoints()[1].x());
            const int endingY = floor(region_info.controlpoints()[0].y() + region_info.controlpoints()[1].y());
            const int width = endingX - startingX + 1;
            const int height = endingY - startingY + 1;
            std::vector<bool> mask(width*height,true);

            //Mask Calculation
            float radi = width/2 ;
            int diameter = width;
            int centerX = region_info.controlpoints().Get(1).x();
            int centerY = region_info.controlpoints().Get(1).y();
            int index = 0;
            double pow_radius = pow(radi, 2);

            for (int x = 0; x < diameter; x++) {
                double pow_x = pow(x - centerX, 2);
                for (int y = 0; y < diameter; y++) {
                    if (pow_x + pow(y - centerY, 2) > pow_radius) {
                        mask[index] = false;     
                    }
                    index++;
                }
            }
            return mask;
        }
        default: {

            //Conversion of CARTA's co-ordinate system to indexes
            const int startingX = ceil(region_info.controlpoints()[0].x() - region_info.controlpoints()[1].x()/2);
            const int startingY = ceil(region_info.controlpoints()[0].y() - region_info.controlpoints()[1].y()/2);
            const int endingX = floor(region_info.controlpoints()[0].x() + region_info.controlpoints()[1].x()/2);
            const int endingY = floor(region_info.controlpoints()[0].y() + region_info.controlpoints()[1].y()/2);
            const int width = endingX - startingX + 1;
            const int height = endingY - startingY + 1;
            std::vector<bool> mask(width * height, true);
            return mask;
        }
    }
}


//Constructor
SpectralServiceImpl::SpectralServiceImpl(int port) : port(port) {}

//Handles Service Requests and Creates File Reading Connection
Status SpectralServiceImpl::GetSpectralProfile(grpc::ServerContext *context, const proto::SpectralServiceRequest *request, proto::SpectralServiceResponse *reply)
{
    ServicePrint("Spectral Service Reqeust");
    FileSerivceClient client;
    auto begin = std::chrono::high_resolution_clock::now();
    *reply = client.getImageData("0.0.0.0:8079", request->uuid(), request->region_info(), request->depth(), request->has_perm_data());
    auto end = std::chrono::high_resolution_clock::now();
    auto duration = std::chrono::duration_cast<std::chrono::milliseconds>(end - begin);
    ServicePrint("Spectral Service Completetion (ms) : "+  duration.count());

    return Status::OK;
}


void SpectralServiceImpl::ServicePrint(std::string msg){
    std::cout << "[" << port << "] " << msg << std::endl;
}
