require("dotenv").config();

const express = require("express");
const cors = require("cors");
const http = require("http");
const WebSocket = require("ws");
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./swagger.json");

const { Device } = require("./models");
const { refreshSchedules } = require("./controllers/scheduleController");

const authRoutes = require("./routes/auth");
const deviceRoutes = require("./routes/device");
const scheduleRoutes = require("./routes/schedule");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const port = process.env.PORT || 8080;

// ========== User-to-WebSocket Connections Mapping ==========
// { userId: Set<ws> }
const userConnections = {};

// ========== Middleware ==========
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Swagger
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// ========== Broadcast to User's ESP32s Only ==========
// Kirim command hanya ke ESP32 yang sudah register dengan userId tertentu
function broadcastStatus(userId, deviceId, deviceName, slot, status, time) {
    console.log(`[WS] User ${userId} | ${deviceName} (slot: ${slot}) -> ${status ? "ON" : "OFF"} at ${time}`);

    const payload = JSON.stringify({
        type: "command",
        slot,
        status: status === true ? "true" : "false",
    });

    // Hanya kirim ke client yang terdaftar untuk userId ini
    const clients = userConnections[userId];
    if (clients) {
        clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(payload);
            }
        });
    }

    Device.update({ status }, { where: { id: deviceId } });
}

// ========== Routes ==========
app.use("/auth", authRoutes);
app.use("/devices", deviceRoutes(broadcastStatus));
app.use("/schedules", scheduleRoutes(broadcastStatus));

// ========== WebSocket Connection Handler ==========
wss.on("connection", function connection(ws) {
    ws.id_client = Math.random().toString(36).substring(2, 11);
    ws.userId = null; // Belum ter-register
    console.log(`[WS] Client connected: ${ws.id_client}`);

    ws.on("message", async (raw) => {
        let message;
        try {
            message = JSON.parse(raw.toString());
        } catch (e) {
            ws.send(JSON.stringify({ type: "error", message: "Invalid JSON format." }));
            return;
        }

        // Handle register message dari ESP32
        if (message.type === "register") {
            const userId = message.userId;

            if (!userId) {
                ws.send(JSON.stringify({ type: "error", message: "userId is required." }));
                return;
            }

            // Simpan mapping
            ws.userId = userId;
            if (!userConnections[userId]) {
                userConnections[userId] = new Set();
            }
            userConnections[userId].add(ws);

            console.log(`[WS] Client ${ws.id_client} registered as User ${userId}`);

            // Kirim sync: state semua device milik user ini
            const devices = await Device.findAll({ where: { user_id: userId } });
            const syncPayload = JSON.stringify({
                type: "sync",
                devices: devices.map((d) => ({
                    slot: d.slot,
                    status: d.status === true ? "true" : "false",
                })),
            });
            ws.send(syncPayload);

            console.log(`[WS] Sent sync (${devices.length} devices) to Client ${ws.id_client}`);
            return;
        }

        // Pesan lain bisa ditambahkan di sini (misal heartbeat/pong)
        console.log(`[WS] Message from ${ws.id_client}: ${raw}`);
    });

    ws.on("close", () => {
        console.log(`[WS] Client disconnected: ${ws.id_client}`);

        // Hapus dari mapping
        if (ws.userId && userConnections[ws.userId]) {
            userConnections[ws.userId].delete(ws);
            if (userConnections[ws.userId].size === 0) {
                delete userConnections[ws.userId];
            }
        }
    });
});

// ========== Ping/Pong Heartbeat ==========
// Deteksi ESP32 yang disconnect diam-diam
const PING_INTERVAL = 30000; // 30 detik

setInterval(() => {
    wss.clients.forEach((ws) => {
        if (ws.isAlive === false) {
            console.log(`[WS] Terminating dead client: ${ws.id_client}`);
            return ws.terminate();
        }
        ws.isAlive = false;
        ws.ping();
    });
}, PING_INTERVAL);

wss.on("connection", (ws) => {
    ws.isAlive = true;
    ws.on("pong", () => {
        ws.isAlive = true;
    });
});

// ========== Start Server ==========
server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
    console.log(`Swagger docs: http://localhost:${port}/api-docs`);
});

// Load scheduled jobs
refreshSchedules(broadcastStatus);
