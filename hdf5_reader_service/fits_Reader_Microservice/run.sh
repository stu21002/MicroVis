#!/bin/bash



# Array to hold PIDs of background tasks
pids=()

# Start services in the background and store their PIDs
for i in {8080..8090}
do
    ./build/worker/fits_read ${i} &

    pids+=($!)
done

read -p "Enter to terminate all services: " userInput

for pid in "${pids[@]}"
do
     kill $pid
done
echo "All services have been terminated."