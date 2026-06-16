#include <WiFi.h>
#include <ArduinoWebsockets.h> // Version - 0.5.4
#include <ArduinoJson.h> // Version - 7.4.3

// ========== CONFIGURATION ==========
// WiFi
const char* ssid = "Redmi Note 4x";
const char* password = "12344321";

// WebSocket Server
const char* ws_host = "10.10.10.102";
const uint16_t ws_port = 8080;

// User ID (sesuaikan dengan user yang terdaftar di server)
const int USER_ID = 1;

// Slot-to-Pin Mapping
// Slot yang ditangani ESP32 ini dan GPIO pin-nya
// Contoh: ESP32 ini handle slot 1, 2, 3, 4
const int SLOT_COUNT = 4;
const int slots[SLOT_COUNT] = {1, 2, 3, 4};
const int pins[SLOT_COUNT] = {12, 14, 4, 5};

// ========== GLOBALS ==========
using namespace websockets;
WebsocketsClient client;

unsigned long lastReconnectAttempt = 0;
const unsigned long RECONNECT_INTERVAL = 5000; 

// ========== FUNCTIONS ==========

// Cari index pin berdasarkan slot number, return -1 jika tidak ditemukan
int findPinBySlot(int slot) {
    for (int i = 0; i < SLOT_COUNT; i++) {
        if (slots[i] == slot) {
            return pins[i];
        }
    }
    return -1;
}

// Set relay berdasarkan slot dan status
void setRelay(int slot, bool state) {
    int pin = findPinBySlot(slot);
    if (pin == -1) {
        // Slot tidak ditangani ESP32 ini, abaikan
        return;
    }
    digitalWrite(pin, state ? HIGH : LOW);
    Serial.print("[Slot ");
    Serial.print(slot);
    Serial.print("] -> ");
    Serial.println(state ? "ON" : "OFF");
}

// Handle message "sync" — set semua relay sesuai state dari server
void handleSync(JsonDocument& doc) {
    JsonArray devices = doc["devices"].as<JsonArray>();
    Serial.print("[SYNC] Received ");
    Serial.print(devices.size());
    Serial.println(" devices");

    for (JsonObject device : devices) {
        int slot = device["slot"];
        const char* statusStr = device["status"];
        bool state = (strcmp(statusStr, "true") == 0);
        setRelay(slot, state);
    }
}

// Handle message "command" — update satu relay
void handleCommand(JsonDocument& doc) {
    int slot = doc["slot"];
    const char* statusStr = doc["status"];
    bool state = (strcmp(statusStr, "true") == 0);

    Serial.print("[CMD] Slot: ");
    Serial.print(slot);
    Serial.print(" Status: ");
    Serial.println(statusStr);

    setRelay(slot, state);
}

// Handle message "error" dari server
void handleError(JsonDocument& doc) {
    const char* msg = doc["message"];
    Serial.print("[ERROR] ");
    Serial.println(msg);
}

// Callback saat menerima pesan WebSocket
void onMessageCallback(WebsocketsMessage message) {
    Serial.print("[WS] Raw: ");
    Serial.println(message.data());

    JsonDocument doc;
    DeserializationError error = deserializeJson(doc, message.data());

    if (error) {
        Serial.print("[WS] JSON parse error: ");
        Serial.println(error.c_str());
        return;
    }

    const char* type = doc["type"];

    if (strcmp(type, "sync") == 0) {
        handleSync(doc);
    } else if (strcmp(type, "command") == 0) {
        handleCommand(doc);
    } else if (strcmp(type, "error") == 0) {
        handleError(doc);
    } else {
        Serial.print("[WS] Unknown type: ");
        Serial.println(type);
    }
}

// Konek ke WiFi
void connectToWifi() {
    WiFi.begin(ssid, password);
    Serial.print("[WiFi] Connecting to ");
    Serial.print(ssid);

    int attempts = 0;
    while (WiFi.status() != WL_CONNECTED && attempts < 20) {
        Serial.print(".");
        delay(500);
        attempts++;
    }
    Serial.println();

    if (WiFi.status() == WL_CONNECTED) {
        Serial.print("[WiFi] Connected! IP: ");
        Serial.println(WiFi.localIP());
    } else {
        Serial.println("[WiFi] Connection failed.");
    }
}

// Konek ke WebSocket server dan kirim register
void connectToServer() {
    Serial.println("[WS] Connecting to server...");

    bool connected = client.connect(ws_host, ws_port, "/");

    if (connected) {
        Serial.println("[WS] Connected!");

        // Kirim register message
        JsonDocument doc;
        doc["type"] = "register";
        doc["userId"] = USER_ID;

        String payload;
        serializeJson(doc, payload);
        client.send(payload);

        Serial.print("[WS] Sent register: ");
        Serial.println(payload);
    } else {
        Serial.println("[WS] Connection failed.");
    }
}

// ========== SETUP ==========
void setup() {
    Serial.begin(115200);
    Serial.println("\n[ESP32] Smart Home Client Starting...");
    Serial.print("[CONFIG] User ID: ");
    Serial.println(USER_ID);
    Serial.print("[CONFIG] Slots: ");
    for (int i = 0; i < SLOT_COUNT; i++) {
        Serial.print(slots[i]);
        if (i < SLOT_COUNT - 1) Serial.print(", ");
    }
    Serial.println();

    // Init relay pins
    for (int i = 0; i < SLOT_COUNT; i++) {
        pinMode(pins[i], OUTPUT);
        digitalWrite(pins[i], LOW);
    }

    // Connect WiFi
    connectToWifi();

    // Setup WebSocket callback
    client.onMessage(onMessageCallback);

    // Connect to server
    if (WiFi.status() == WL_CONNECTED) {
        connectToServer();
    }
}

// ========== LOOP ==========
void loop() {
    if (WiFi.status() != WL_CONNECTED) {
        Serial.println("[WiFi] Disconnected. Reconnecting...");
        connectToWifi();
        delay(1000);
        return;
    }

    if (client.available()) {
        client.poll();
    } else {
        // Reconnect dengan interval agar tidak spam
        unsigned long now = millis();
        if (now - lastReconnectAttempt >= RECONNECT_INTERVAL) {
            lastReconnectAttempt = now;
            Serial.println("[WS] Disconnected. Reconnecting...");
            connectToServer();
        }
    }
}
