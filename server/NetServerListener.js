class NetServerListener{
    constructor(props) {
        this.http       = require('http');
        this.crypto     = require('crypto');
        this.encryption = props.encryption;

        this.connection = this.connection.bind(this);
    }

    connection(socket){
        socket.on('end',()=>{
            console.log('Socket Client Disconnected');
            socket.end();
        });

        socket.on('data',(data)=>{
            const decrypted = this.decryptData(data,this.crypto.createHash(this.encryption.hashAlgorithm).update(this.encryption.hashPassword),this.encryption.algorithm);
            const headers = JSON.parse(decrypted.toString());
            console.info(`Want ${headers.method} made to ${headers.host} at ${headers.url}`);

            const request = this.http.request(headers.url,{...headers,headers},(response)=>{
                console.log(`STATUS: ${response.statusCode}`);
                console.log(`HEADERS: ${JSON.stringify(response.headers)}`);
                response.setEncoding('utf8');
                response.on("data",(chunk)=>{
                    console.info(`Request ${headers.method} made to ${headers.host} at ${headers.url}`);
                    socket.write(this.encryptData(Buffer.from(chunk),this.crypto.createHash(this.encryption.hashAlgorithm).update(this.encryption.hashPassword),this.encryption.algorithm));
                });
                response.on("end",()=>{
                    console.info("No more chunk");
                    socket.write(this.encryptData(Buffer.from('end'),this.crypto.createHash(this.encryption.hashAlgorithm).update(this.encryption.hashPassword),this.encryption.algorithm));
                });
            });

            request.end();
            request.on("error",this.error);
        });

        socket.on('error',this.error);
    }

    error(error){
        console.error('A Unexpected Error: '+ error.toString());
    }

    open(){
        console.log("Socket Server opened")
    }

    decryptData(buffer,hash,alg){
        const hashDigest = hash.digest();
        const cipher = this.crypto.createDecipheriv(
            alg,
            hashDigest.slice(0, 48),
            Math.floor(Date.now() /100000) + "" +Math.floor(Date.now() /100000)
        );
        return Buffer.concat([cipher.update(buffer), cipher.final()]);
    }

    encryptData(buffer,hash,alg){
        const hashDigest = hash.digest();
        const cipher = this.crypto.createCipheriv(
            alg,
            hashDigest.slice(0, 48),
            Math.floor(Date.now() /100000) + "" +Math.floor(Date.now() /100000)
        );
        return Buffer.concat([cipher.update(buffer), cipher.final()]);
    }
}

module.exports =  NetServerListener;