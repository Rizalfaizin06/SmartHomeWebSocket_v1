const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let lamp1 = "lamp1-off";
let lamp2 = "lamp2-off";

app.get("/message/:message", (req, res) => {
    const message = req.params.message;
    if (message == "lamp1-on") {
        lamp1 = "lamp1-on";
    } else if (message == "lamp1-off") {
        lamp1 = "lamp1-off";
    } else if (message == "lamp2-on") {
        lamp2 = "lamp2-on";
    } else if (message == "lamp2-off") {
        lamp2 = "lamp2-off";
    } else {
    }
    console.log("status lamp | " + lamp1 + " | " + lamp2);

    res.send(message);
    broadcastStatus(message);
});

function broadcastStatus(message) {
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            console.log(
                `Sending message to client with ID: ${client.id_client}`
            );
            client.send(message);
        }
    });
}

wss.on("connection", function connection(ws) {
    console.log("Client connected | " + lamp1 + " | " + lamp2);
    ws.send(lamp1);
    ws.send(lamp2);

    ws.id_client = Math.random().toString(36).substr(2, 9);

    console.log(`Client connected with ID: ${ws.id_client}`);

    ws.on("message", function (message) {
        console.log(`Received message from ${ws.id_client}: ${message}`);
    });

    ws.on("close", function () {
        console.log(`Client disconnected with ID: ${ws.id_client}`);
    });
});

server.listen(8080, () => {
    console.log("Server is listening on port 8080");
});

app.get("/set/:timeout", (req, res) => {
    const timeout = req.params.timeout;
});
setTimeout(() => {
    setInterval(() => {
        if (lamp1 === "lamp1-on") {
            lamp1 = "lamp1-off";
        } else {
            lamp1 = "lamp1-on";
        }
        console.log(`Scheduled lamp change: ${lamp1}`);
        broadcastStatus(lamp1, "on");
        console.log(lamp2);
    }, 5000);
}, 30000);

// Function to schedule lamp state changes
// function scheduleLampChange(lamp, state, time) {
//     setTimeout(() => {
//         if (lamp === "lamp1") {
//             lamp1 = state;
//         } else if (lamp === "lamp2") {
//             lamp2 = state;
//         }
//         console.log(`Scheduled lamp change: ${lamp} to ${state}`);
//         broadcastStatus(state); // Broadcast for both "on" and "off" states
//     }, time);
// }

// function scheduleRepeatingLampChange(lamp, state, hours = 13, minutes = 0) {
//     const now = new Date();
//     // Hitung waktu target berikutnya (besok jam 13:00:00)
//     const tomorrow = new Date();
//     tomorrow.setDate(tomorrow.getDate() + 1);
//     tomorrow.setHours(hours, minutes, 0, 0); // Set jam, menit, detik, dan milidetik ke 0
//     const targetTimeNext = tomorrow;

//     // Hitung delay untuk waktu target berikutnya
//     const delay = targetTimeNext.getTime() - now.getTime();
//     console.log(delay);
//     // Jalankan fungsi scheduleLampChange pada waktu target dan ulangi setiap hari
//     setInterval(
//         () => {
//             scheduleLampChange(lamp, state, 0); // No delay needed for repeating schedule
//         },
//         delay,
//         24 * 60 * 60 * 1000 // Ulangi setiap 24 jam (dalam milidetik)
//     );
// }

// Example usage: Scheduled lamp turn-on and turn-off at 13:00
// scheduleRepeatingLampChange("lamp1", "lamp1-on", "13:00:00"); // Adjust time as needed
