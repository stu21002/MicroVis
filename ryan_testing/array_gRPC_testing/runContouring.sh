#!/bin/bash

pids=()

server_executable="./Release/ContouringService"

for port in {9984..9999}; do
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
