#!/bin/bash


num_times=$1

pids=()
output_file="service_output.log"
> "$output_file"

for (( i=0; i<num_times; i++ ))
do
    # port=$((8080 + i))
    # ./build/Service/H5Service ${port} >> "$output_file" 2>&1 &
    # pids+=($!)
    port=$((8080 + i))
    ./build/Service/H5Service ${port}  &
    pids+=($!)
done

read -p "Press Enter to terminate all services: " userInput

for pid in "${pids[@]}"
do
     kill $pid
done
echo "All services have been terminated."
