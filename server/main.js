const net = require('net');
const Listener = require('./NetServerListener');
const encryption = {
    algorithm: 'aes-256-cbc',
    hashAlgorithm: 'sha256',
    hashPassword: 'password',
    serverPassword: 'password'
};
const _listener = new Listener({encryption});

const server = net.createServer(_listener.connection);

server.on('error',_listener.error);

server.listen(8180,_listener.open);