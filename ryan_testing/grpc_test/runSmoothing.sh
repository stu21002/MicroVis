#!/bin/bash

pids=()

server_executable="./build/SmoothingService"

for port in {9990..9994}; do
    $server_executable $port &
    pids+=($!)
    echo "Started server on port $port with PID $!"
done

echo -e "\n"

read -p $'Enter to terminate all servers:\n' userInput

for pid in "${pids[@]}"; do
    kill $pid
    echo "Terminated server with PID $pid"
done

echo "All servers have been terminated"
