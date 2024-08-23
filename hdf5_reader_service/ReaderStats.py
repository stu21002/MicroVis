import re

def read_and_average_log(file_path):
    with open(file_path, 'r') as file:
        lines = file.readlines()

    # Pattern to match lines with values
    value_pattern = re.compile(r'\[\d+\] (\d+),(\d+),(\d+)')

    values_list = []

    for line in lines:
        match = value_pattern.match(line)
        if match:
            # Convert the matched groups to integers and append to values_list
            values = list(map(int, match.groups()))
            values_list.append(values)

    if not values_list:
        print("No values found in the log file.")
        return

    # Calculate the average for each column
    averages = [sum(x)/len(x) for x in zip(*values_list)]

    print(f"Averages: {averages}")

# Replace 'your_log_file.log' with the path to your actual log file
log_file_path = 'fits_Reader_Microservice/service_output.log'
read_and_average_log(log_file_path)
