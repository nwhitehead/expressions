import fs from 'node:fs';
import crypto from 'crypto';
import axios from 'axios';

// Where to talk to custom API server
const SERVER_ADDRESS = "127.0.0.1:8288";
const CLIENT_ID = crypto.randomUUID();

const inputImgData = fs.readFileSync('images/katia.jpg');
const b64data = Buffer.from(inputImgData, 'binary').toString('base64');

async function main() {
    const data = { inputImgData: b64data, blink: -20 };
    const response = await axios.post(`http://${SERVER_ADDRESS}/transform`, data);
    const outImage = Buffer.from(response.data.image, 'base64');
    fs.writeFileSync('images/out_client.png', outImage);
}

main();
