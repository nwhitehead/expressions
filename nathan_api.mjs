import fs from 'node:fs';
import crypto from 'crypto';
import WebSocket from 'isomorphic-ws';
import axios from 'axios';

const SERVER_ADDRESS = "127.0.0.1:8188";
const CLIENT_ID = crypto.randomUUID();

const prompt = `
{
  "2": {
    "inputs": {
      "rotate_pitch": 0,
      "rotate_yaw": 0,
      "rotate_roll": 0,
      "blink": 0,
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
}
`;


// function queue_prompt(prompt) {
//     const p = { prompt, client_id: CLIENT_ID };
//     const data = JSON.stringify(p);
//     req =  urllib.request.Request("http://{}/prompt".format(server_address), data=data)
//     return json.loads(urllib.request.urlopen(req).read())

// }


// const ws = new WebSocket('wss://websocket-echo.com/');
const ws = new WebSocket(`ws://${SERVER_ADDRESS}/ws?clientId=${CLIENT_ID}`);

ws.onopen = function open() {
    console.log('connected');
    ws.send(Date.now());
};

ws.onclose = function close() {
    console.log('disconnected');
};

ws.onmessage = function incoming(data) {
    console.log(`Roundtrip time: ${Date.now() - data.data} ms\n${JSON.stringify(data)}`);
    ws.close();
};
