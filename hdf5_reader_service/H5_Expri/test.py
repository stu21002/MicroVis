
def loops(d,h,w):
    offset = d*h
    for z in range (d):
        # offsetY = 0 
        
        for y in range (h):
            index = z + y*h
            for x in range (w):
                print(f"The sum of the numbers is: {index+1}")
                index += offset
            # offsetY += h
        
loops(3,3,3)