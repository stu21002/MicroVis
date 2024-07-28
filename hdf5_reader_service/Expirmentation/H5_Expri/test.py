depth = 3
height = 3
width = 3

orgStart = [0,0,0,0]
start = orgStart.copy()
orgEnd = [0,0,0,0]
orgCounts = [5,2,2,1]
rrCounts = [0,0,0,0]
for i in range(len(orgEnd)):
    orgEnd[i]=orgStart[i]+orgCounts[i]

total = 1
totalRead = 0
maxRead = 10
n =0
for count in orgCounts:
    total *= count
    rrCounts[n]=total
    n+=1

orgRead = [1,1,1,1]
read = [1,1,1,1]
inc = [0,0,0,0]
iterIndex = 0
countRead = 1
prev = 1
for i in range(len(orgCounts)):
    if (rrCounts[i]<maxRead):
        orgRead[i]=orgCounts[i]
        read[i]=orgCounts[i]
    else:
        if i!=0 :
            inc[i] = maxRead // rrCounts[i-1]
        else:
            inc[i] = maxRead
        iterIndex = i
        orgRead[i]=max(inc[i],1)
        read[i]=max(inc[i],1)
        break

    

while totalRead<total:
    print(start,read,inc)
    carry = 0


    for i in range(iterIndex,len(read)):
        start[i]+=inc[i]+carry
        carry = 0
        if start[i]>orgEnd[i]:
            start[i]=orgStart[i]
            read[i]=orgRead[i]
            carry+=1
        else:
            read[i] = min((orgEnd[i]-start[i]),read[i])
    ar = 1
    for val in read:
        ar *= val
    totalRead+=ar
    # print(totalRead," ",total)




