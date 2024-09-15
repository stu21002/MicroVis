# Array gRPC Testing

This is used to test the gRPC results for unmodifed array inputs.

## Ingress Node Installation

Navigate to the Ingress Node and use npm to initialise the node_modules.

```bash
cd Ingress_Node
npm init -y
npm install
```

Then use the bash executable proto_ts.sh to initialise all the Protocol Buffers into TypeScript.

```bash
./proto_ts.sh
```

Then compile all the TypeScript code ussing the tsconfig.json file.

```bash
tsc
```

## Service Installation

Create a folder called "Release" and navigate to it and execute the CMakeList.

```bash
mkdir Release
cd Release
cmake -DCMAKE_BUILD_TYPE=Release ..
make
```

## Running Services 

Use the executables that start with "run" in order to start the services. Example below.

```bash
./runContouring
```

## Running Ingress Node

Navigate to the Ingress Node directory and use Node.js to run one of the requests. Example below (Number following is an argument determing the mode).

```bash
node dist/contour_smooth_controller_4.js 0
```