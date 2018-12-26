const http   = require('http');
const net    = require('net');
const crypto = require('crypto');
const QRcode = require('qrcode');

const server = http.createServer(requestListener);
const client = net.connect(8180,'127.0.0.1');

const encryption = {
    algorithm: 'aes-256-cbc',
    hashAlgorithm: 'sha256',
    hashPassword: 'password',
    serverPassword: 'password'
};

async function requestListener(request,response){
    request.headers.url = request.url;
    request.headers.method = request.method;
    console.info(`Request ${request.headers.method} made to ${request.headers.host} at ${request.headers.url}`);
    const encBuffer = encryptData(Buffer.from(JSON.stringify(request.headers)), crypto.createHash(encryption.hashAlgorithm).update(encryption.hashPassword), encryption.algorithm);

    client.write(encBuffer);
    client.on('data',(data)=>{
        let decrypted = decryptData(data,crypto.createHash(encryption.hashAlgorithm).update(encryption.hashPassword), encryption.algorithm)
        if(decrypted.toString() === 'end'){
            console.log('End of the stream')
            response.end();
        }
        response.write(decrypted);
    });

    response.on('error',error)


}
function encryptData(buffer,hash,alg){
    const hashDigest = hash.digest();
    const cipher = crypto.createCipheriv(
            alg,
            hashDigest.slice(0, 48),
            Math.floor(Date.now() /100000) + "" +Math.floor(Date.now() /100000)
        );
    return Buffer.concat([cipher.update(buffer), cipher.final()]);
}

function decryptData(buffer,hash,alg){
    const hashDigest = hash.digest();
    const cipher = crypto.createDecipheriv(
        alg,
        hashDigest.slice(0, 48),
        Math.floor(Date.now() /100000) + "" +Math.floor(Date.now() /100000)
    );
    return Buffer.concat([cipher.update(buffer), cipher.final()]);
}

function error(error){
    console.error('A Unexpected Error: '+ error.toString());
}

client.on('error',error);

server.listen(9000, () => {
    console.log("Waiting for requests...");
});
