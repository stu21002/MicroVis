# File Reading Service

2 file type implementations, FITS and HDF5. 
FITS implementation was done by Angus Comrie, and adapated to work with the HDF5 implementation.
https://github.com/CARTAvis/fits_reader_microservice/tree/main 

This contains a prototype microservice architecture using gRPC for reading FITS and HDF5 files aswell as some additional services such as performing spectral profiles

## Packages 
Ensure that the H5Cpp, CFITSO packages are installed as well as the gRPC C++ and Protocol Buffers packages

## Ingress Node Installation

Navigate to the Ingress Node and use npm to initialise the node_modules.

```bash
cd ingres
npm install
```

Then use the bash executable proto_ts.sh to initialise all the Protocol Buffers into TypeScript.

```bash
./proto/proto.sh
```

Then compile all the TypeScript code ussing the tsconfig.json file.

```bash
tsc
```

To run the ingress node
```bash
npm start
```
Ensure the correct function is run for the file type being read

## File Reading Service Installation

Navigate to the required file type and run the release bash script. THis will compile the protocol buffers as well as the C++ files
```bash
./Release.sh
```

## Running Services 

Use the bash script to run x number of services or start each service manually by running the executable.

```bash
./run.sh 2
```

## Worker Pool  Controller

cd into the controller folder for the file reading type needed and install the node modules
```bash
npm install
```

Generate the protocol buffer files using the bash script

```bash
./proto/proto.sh
```

Compile the typesciprt code using 
```bash
tsc
```

Run the worker pool with the number of readers present as an arugment 
```bash
npm start 2
```
