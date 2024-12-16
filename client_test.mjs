import fs from 'node:fs';
import crypto from 'crypto';
import WebSocket from 'isomorphic-ws';
import axios from 'axios';

const SERVER_ADDRESS = "127.0.0.1:8288";
const CLIENT_ID = crypto.randomUUID();

async function transform() {

    const ws = new WebSocket(`ws://${SERVER_ADDRESS}/ws?clientId=${CLIENT_ID}`);

    const inputImgData = fs.readFileSync('images/katia.jpg');
    const b64data = Buffer.from(inputImgData, 'binary').toString('base64');

    const p = { image: b64data, client_id: CLIENT_ID };
    const data = JSON.stringify(p);
    ws.onopen = async function () {
        try {
            const response = await axios.post(`http://${SERVER_ADDRESS}/transform`, data);
            const prompt_id = response.data.prompt_id;
            console.log(`Started workflow with prompt_id=${prompt_id} client_id=${CLIENT_ID}`);
            // Wait for progress message for right node (1 image output)
            let ready = false;
            ws.onmessage = function incoming(msg) {
                if (typeof msg.data === 'string') {
                    const data = JSON.parse(msg.data);
                    if (data.type === 'progress' && data.data.prompt_id === prompt_id && data.data.node === 'save_image_websocket_node' && data.data.value === 0) {
                        ready = true;
                    } else if (data.type === 'executing' && data.data.prompt_id === prompt_id && data.data.node === null) {
                        console.log('Done');
                    } else {
                        ready = false;
                    }
                } else {
                    // Handle binary image output data
                    if (ready) {
                        // Ignore first 8 bytes, they are 0x1 0x2 (not sure why)
                        fs.writeFileSync('images/out.png', msg.data.slice(8));
                        ready = false;
                    }
                }
            };
        } catch(error) {
            console.log('error', error);
        }
    };
    console.log('Returning from queue_prompt');
}

queue_prompt(prompt);
