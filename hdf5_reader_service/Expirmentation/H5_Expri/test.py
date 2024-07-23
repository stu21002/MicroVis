depth = 3
height = 3
width = 3

offset = depth*height

for z in range(depth):
    for y in range(height):
        index = y*(depth)+z
        for x in range(width):
            print(x*offset+index)