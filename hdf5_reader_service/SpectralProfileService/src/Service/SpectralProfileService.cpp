#include "SpectralProfileService.h"

proto::SpectralServiceResponse FileSerivceClient::getImageData(const std::string& end_server_address, const std::string& uuid, const RegionInfo& region_info, int depth, bool hasPerm) {
    auto channel = grpc::CreateChannel(end_server_address, grpc::InsecureChannelCredentials());
    std::unique_ptr<proto::FileService::Stub> stub = proto::FileService::NewStub(channel);

    ClientContext context;

    int counter = 0;
    auto tempWidth = region_info.controlpoints()[1].x() / 2.0;
    auto tempHeight = region_info.controlpoints()[1].y() / 2.0;

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

    ImageDataResponse response;
    std::unique_ptr<ClientReader<ImageDataResponse>> reader(stub->GetImageDataStream(&context, request));

    int currentDepth = 0;
    int currentHeight = 0;
    int currentWidth = 0;

    std::vector<float> sum(depth, 0);
    std::vector<int> count(depth, 0);

    std::vector<bool> mask = getMask(region_info);
    auto durationTot = std::chrono::milliseconds(0);//std::chrono::duration_cast<std::chrono::milliseconds>();

    int maskIndex = 0;
    if (hasPerm) {
        auto begin = std::chrono::high_resolution_clock::now();
        std::cout << "Perm data Calculation" << std::endl;

        while (reader->Read(&response)) {
        auto begin = std::chrono::high_resolution_clock::now();

            int index = 0;
            int num_pixels = response.raw_values_fp32().size() / sizeof(float);
            std::vector<float> values(num_pixels);
            memcpy(values.data(), response.raw_values_fp32().data(), values.size() * sizeof(float));

            while (index < num_pixels) {
                if (currentDepth >= depth) {
                    currentDepth = 0;
                    currentHeight++;
                    if (currentHeight == height) {
                        currentWidth++;
                        currentHeight = 0;
                    }
                }
                if (!mask[maskIndex]) {
                    if (depth + index > num_pixels) {
                        currentDepth = depth - (num_pixels - index);
                        index = num_pixels;
                    } else {
                        index += depth - currentDepth;
                        currentDepth = depth;
                        maskIndex++;
                    }
                    continue;
                }
                const float value = values[index++];
                if (std::isfinite(value)) {
                    sum[currentDepth] += value;
                    count[currentDepth]++;
                    currentDepth++;
                }
            }
        auto end = std::chrono::high_resolution_clock::now();
        auto duration = std::chrono::duration_cast<std::chrono::milliseconds>(end - begin);
        durationTot.operator+=(duration);
        }

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

        // auto end = std::chrono::high_resolution_clock::now();
        // auto duration = std::chrono::duration_cast<std::chrono::milliseconds>(end - begin);
        std::cout<<durationTot.count()<<std::endl;
        // std::cout<<(duration.operator+=(duration)).count()<<std::endl;
        std::cout << "HDF5 Data Calculation Done" << std::endl;
        return spectral_response;
    } else {
        std::cout << "Fits Data Calculation" << std::endl;

        SpectralServiceResponse spectral_response;
        spectral_response.mutable_raw_values_fp32()->resize(depth * sizeof(float));
        float* spectral_profile = reinterpret_cast<float*>(spectral_response.mutable_raw_values_fp32()->data());

        while (reader->Read(&response)) {
            int num_pixels = response.raw_values_fp32().size() / sizeof(float);
            std::vector<float> values(num_pixels);
            memcpy(values.data(), response.raw_values_fp32().data(), values.size() * sizeof(float));

            int index = 0;

            while (index < num_pixels) {
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
                if (!mask[maskIndex++]) {
                    currentWidth++;
                    index++;
                    continue;
                }

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
        std::cout << "Fits Data Calculation Done" << std::endl;

        return spectral_response;
    }
}

std::vector<bool> FileSerivceClient::getMask(const RegionInfo& region_info) {
    switch (region_info.regiontype()) {
        case proto::RegionType::CIRCLE: {
            std::vector<bool> mask(region_info.controlpoints().Get(1).x() * region_info.controlpoints().Get(1).y(), true);

            int radi = region_info.controlpoints().Get(1).x();
            int diameter = radi * 2;
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
            const int startingX = ceil(region_info.controlpoints()[0].x() - region_info.controlpoints()[1].x());
            const int startingY = ceil(region_info.controlpoints()[0].y() - region_info.controlpoints()[1].y());
            const int endingX = floor(region_info.controlpoints()[0].x() + region_info.controlpoints()[1].x());
            const int endingY = floor(region_info.controlpoints()[0].y() + region_info.controlpoints()[1].y());
            const int width = endingX - startingX + 1;
            const int height = endingY - startingY + 1;
            std::vector<bool> mask(width * height, true);
            return mask;
        }
    }
}

SpectralServiceImpl::SpectralServiceImpl(int port) : port(port) {}

Status SpectralServiceImpl::GetSpectralProfile(grpc::ServerContext *context, const proto::SpectralServiceRequest *request, proto::SpectralServiceResponse *reply)
{
    FileSerivceClient client;
    // auto begin = std::chrono::high_resolution_clock::now();
    *reply = client.getImageData("0.0.0.0:8079", request->uuid(), request->region_info(), request->depth(), request->has_perm_data());
    // auto end = std::chrono::high_resolution_clock::now();
    // auto duration = std::chrono::duration_cast<std::chrono::milliseconds>(end - begin);
    // ServicePrint(std::to_string(duration.count()));

    return Status::OK;
}
void SpectralServiceImpl::ServicePrint(std::string msg){
    std::cout << "[" << port << "] " << msg << std::endl;
}
