#!/bin/bash

pids=()

server_executable="./build/ContouringService"

for port in {9995..9999}; do
    $server_executable $port &
    pids+=($!)
    echo "Started server on port $port with PID $!"
done

read -p "Enter to terminate all servers: " userInput

for pid in "${pids[@]}"; do
    kill $pid
    echo "Terminated server with PID $pid"
done

echo "All servers have been terminated"
