import process from 'node:process';
import fs from 'node:fs';
import crypto from 'crypto';
import WebSocket from 'isomorphic-ws';
import axios from 'axios';

const COMFY_SERVER_ADDRESS = "127.0.0.1:8188";
const CLIENT_ID = crypto.randomUUID();

const prompt = {
  "2": {
    "inputs": {
      "rotate_pitch": 0,
      "rotate_yaw": 0,
      "rotate_roll": 0,
      "blink": -20,
      "eyebrow": 0,
      "wink": 0,
      "pupil_x": 0,
      "pupil_y": 0,
      "aaa": 0,
      "eee": 0,
      "woo": 0,
      "smile": 0,
      "src_ratio": 1,
      "sample_ratio": 1.2,
      "sample_parts": "OnlyExpression",
      "crop_factor": 1.8,
      "src_image": [
        "3",
        0
      ]
    },
    "class_type": "ExpressionEditor",
    "_meta": {
      "title": "Expression Editor (PHM)"
    }
  },
  "3": {
    "inputs": {
      "image": ""
    },
    "class_type": "ETN_LoadImageBase64",
    "_meta": {
      "title": "Load Image"
    }
  },
  "save_image_websocket_node": {
    "class_type": "SaveImageWebsocket",
    "inputs": {
      "images": [
          "2",
          0
      ]
    }
  }
};

function queue_prompt(prompt, inputImgData, blink) {
    return new Promise((resolve, reject) => {
        const ws = new WebSocket(`ws://${COMFY_SERVER_ADDRESS}/ws?clientId=${CLIENT_ID}`);

        const b64data = Buffer.from(inputImgData, 'binary').toString('base64');
        prompt["3"]["inputs"]["image"] = b64data;
        prompt["2"]["inputs"]["blink"] = blink;
        const p = { prompt, client_id: CLIENT_ID };
        const data = JSON.stringify(p);
        let result = null;
        ws.onopen = async function () {
            try {
                const response = await axios.post(`http://${COMFY_SERVER_ADDRESS}/prompt`, data);
                const prompt_id = response.data.prompt_id;
                // Wait for progress message for right node (1 image output)
                let ready = false;
                ws.onmessage = function incoming(msg) {
                    if (typeof msg.data === 'string') {
                        const data = JSON.parse(msg.data);
                        if (data.type === 'progress' && data.data.prompt_id === prompt_id && data.data.node === 'save_image_websocket_node' && data.data.value === 0) {
                            ready = true;
                        } else if (data.type === 'executing' && data.data.prompt_id === prompt_id && data.data.node === null) {
                            // Resolve queue_prompt promise
                            resolve(result);
                        } else {
                            ready = false;
                        }
                    } else {
                        // Handle binary image output data
                        if (ready) {
                            // Ignore first 8 bytes, they are 0x1 0x2 (not sure why)
                            result = msg.data.slice(8);
                            ready = false;
                        }
                    }
                }
            } catch(error) {
                console.log(error);
                // Reject queue_prompt promise
                reject();
            }
        };
    });
}

async function main() {
    const inputImgData = fs.readFileSync('images/katia.jpg');
    const outputImgData = await queue_prompt(prompt, inputImgData, 2);
    fs.writeFileSync('images/out.png', outputImgData);
    console.log('Wrote images/out.png');
    process.exit(0);
}

main();
