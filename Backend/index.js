const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let lampStatus = "OFF"; // Status awal lampu

// Route untuk menangani status lampu
app.get("/lamp/:status", (req, res) => {
    const status = req.params.status.toUpperCase();
    if (status === "ON" || status === "OFF") {
        lampStatus = status;
        res.send(`Lampu sekarang ${lampStatus}`);
        broadcastStatus(); // Broadcast status lampu ke semua klien yang terhubung
    } else {
        res.status(400).send("Invalid status");
    }
});
app.get("/message/:message", (req, res) => {
    const message = req.params.message;
    // if (message === "ON" || message === "OFF") {
    // lampmessage = message;
    res.send(message);
    broadcastStatus(message); // Broadcast status lampu ke semua klien yang terhubung
    // } else {
    //     res.status(400).send("Invalid status");
    // }
});

// Fungsi untuk mengirim status terbaru ke semua klien
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
    // console.log("Client connected");
    // // ws.send(`Lamp status: ${lampStatus}`); // Kirim status lampu saat terhubung

    // ws.on("message", function incoming(message) {
    //     console.log("Received: %s", message);

    // });

    // ws.on("close", () => {
    //     console.log("Client disconnected");
    // });

    ws.id_client = Math.random().toString(36).substr(2, 9);

    console.log(`Client connected with ID: ${ws.id_client}`);

    ws.on("message", function (message) {
        console.log(`Received message from ${ws.id_client}: ${message}`);
    });

    ws.on("close", function () {
        console.log(`Client disconnected with ID: ${ws.id_client}`);
    });
});

// Set up the server to listen on port 3000
server.listen(8080, () => {
    console.log("Server is listening on port 8080");
});
