#!/bin/bash

# Check if the user entered 'k'


# Array to hold PIDs of background tasks
pids=()

# Start services in the background and store their PIDs
for i in {8080..8100}
do
    ./build/Service/H5Service ${i} &
    pids+=($!)
done


read -p "Enter to terminate all services: " userInput

for pid in "${pids[@]}"
do
     kill $pid
done
echo "All services have been terminated."
