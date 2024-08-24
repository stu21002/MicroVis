# import re

# def read_and_average_log(file_path):
#     with open(file_path, 'r') as file:
#         lines = file.readlines()

#     # Pattern to match lines with values
#     value_pattern = re.compile(r'\[\d+\] (\d+),(\d+),(\d+)')

#     values_list = []

#     for line in lines:
#         match = value_pattern.match(line)
#         if match:
#             # Convert the matched groups to integers and append to values_list
#             values = list(map(int, match.groups()))
#             values_list.append(values)

#     if not values_list:
#         print("No values found in the log file.")
#         return

#     # Calculate the average for each column
#     averages = [sum(x)/len(x) for x in zip(*values_list)]

#     print(f"Averages: {averages}")

# # Replace 'your_log_file.log' with the path to your actual log file
# log_file_path = 'fits_Reader_Microservice/service_output.log'
# read_and_average_log(log_file_path)
import re
from collections import defaultdict

def parse_log(log_file_path):
    experiments = {0:0}#defaultdict(lambda: defaultdict(list))
    numProc = 0
    numExProc = 0
    currEx = 0
    with open(log_file_path, 'r') as log_file:
        for line in log_file:
            match = re.match(r'\[(\d+)\] (.+)', line)
            if match:
                port, message = match.groups()
                print(message)
                # print (port + " " + message)
                if "Running" in  message.split(" ")[-1]:
                    # Increase experiment count for a new run, assuming order matters
                    numProc+=1
                else:

                    if (numExProc<numProc):
                        value = int(message.split(",")[0])
                        experiments[currEx] += (value)
                        # print(value)
                        numExProc +=1
                    else:
                        # print("BREAKER")
                        currEx +=1
                        numExProc = 1
                        experiments[currEx] = int(message.split(",")[0])


    print(experiments)
    for key in experiments:
        print(str(key) + " : " + str(experiments[key]/numProc))
    
    return experiments

def empty_log_file(file_path):
    try:
        with open(file_path, 'w') as file:
            pass  # Opening in 'w' mode will empty the file
        print(f"Log file '{file_path}' has been emptied.")
    except Exception as e:
        print(f"An error occurred while trying to empty the log file: {e}")

# Example usage

def main():
    # log_file_path = "h5_Reader_Microservice/service_output.log"  # Replace with your log file path
    log_file_path = "fits_Reader_Microservice/service_output.log"  # Replace with your log file path
    # log_file_path = "SpectralProfileService/service_output.log"  # Replace with your log file path
    experiments = parse_log(log_file_path)
    # empty_log_file(log_file_path)

if __name__ == "__main__":
    main()

