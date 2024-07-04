const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

// Load the protobuf
const PROTO_PATH = '../proto/stream.proto';
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});
const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);

// Get the Streamer service
const streamer = protoDescriptor.Streamer;

// Create a client
const client = new streamer('localhost:9999', grpc.credentials.createInsecure());

// Function to call getNums using a Promise
function callGetNums(x, y) {
  return new Promise((resolve, reject) => {
    const request = { x, y };
    const call = client.getNums(request);

    const responses = [];

    call.on('data', (response) => {
      console.log('Received value:', response.val);
      responses.push(response.val);
    });

    call.on('end', () => {
      console.log('Stream ended.');
      resolve(responses);
    });

    call.on('error', (e) => {
      console.error('Error:', e);
      reject(e);
    });

    call.on('status', (status) => {
      console.log('Status:', status);
    });
  });
}

// Function to call getNums2 using async/await
async function callGetNums2(x, y) {
  return new Promise((resolve, reject) => {
    const request = { x, y };

    client.getNums2(request, (error, response) => {
      if (error) {
        console.error('Error:', error);
        reject(error);
        return;
      }
      console.log('Progress:', response.progress);
      console.log('Values:', response.val);
      resolve(response);
    });
  });
}

// Example usage
async function main() {
  try {
    const numsResponses = await callGetNums(100, 2);
    console.log('Stream responses:', numsResponses);

    const nums2Response = await callGetNums2(1, 2);
    console.log('Unary response:', nums2Response);
  } catch (error) {
    console.error('Error during gRPC call:', error);
  }
}

main();
