# Runs service

num_times=1

pids=()
output_file="service_output.log"
> "$output_file"

for (( i=0; i<num_times; i++ ))
do
    port=$((8078 + i))
    # ./build/src/Spectral ${port} >> "$output_file" 2>&1 &
    # pids+=($!)
    ./build/src/Spectral ${port}  &
    pids+=($!)
done

read -p "Press Enter to terminate all services: " userInput

for pid in "${pids[@]}"
do
     kill $pid
done
echo "All services have been terminated."
