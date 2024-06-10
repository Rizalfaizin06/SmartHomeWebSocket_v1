#include <ArduinoWebsockets.h>
#include <WiFi.h>

const int lamp1 = 18;
const int lamp2 = 19;
const char* ssid = "Treacherous";
const char* password = "12344321";
const char* websockets_server_host = "192.168.100.123";
const uint16_t websockets_server_port = 8080;

using namespace websockets;

WebsocketsClient client;

void connectToWifi() {
  WiFi.begin(ssid, password);
  Serial.print("Connecting to " + String(ssid));

  for (int i = 0; i < 10 && WiFi.status() != WL_CONNECTED; i++) {
    Serial.print(".");
    delay(500);
  }
  Serial.println(".");

  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("Not Connected");
  } else {
    Serial.println("Connected to Wifi.");
  }
}

void connectToServer() {
  Serial.print("Connecting to server.");
  bool connected = client.connect(websockets_server_host, websockets_server_port, "/");
  // bool connected = client.connect("ws://home.rizalscompanylab.my.id/");

  for (int i = 0; i < 10 && !client.available() || !client.ping(); i++) {
    Serial.print(".");
    delay(250);
  }
  Serial.println(".");
  if (connected) {
    Serial.println("Connected to server!");
    // client.send("Hello Server");
  } else {
    Serial.println("Failed to connect to server.");
  }
}

void setup() {
  Serial.begin(115200);

  pinMode(lamp1, OUTPUT);
  pinMode(lamp2, OUTPUT);
  digitalWrite(lamp1, HIGH);
  digitalWrite(lamp2, HIGH);

  connectToWifi();
  if (WiFi.status() == WL_CONNECTED) {
    connectToServer();
  }

  client.onMessage([&](WebsocketsMessage message) {
    Serial.print("Got Message: ");
    Serial.println(message.data());

    if (message.data() == "lamp1-on") {
      digitalWrite(lamp1, LOW);
      Serial.println("Turning ON Lamp 1");
    } else if (message.data() == "lamp1-off") {
      digitalWrite(lamp1, HIGH);
      Serial.println("Turning OFF Lamp 1");
    } else if (message.data() == "lamp2-off") {
      digitalWrite(lamp2, HIGH);
      Serial.println("Turning OFF Lamp 2");
    } else if (message.data() == "lamp2-off") {
      digitalWrite(lamp2, HIGH);
      Serial.println("Turning OFF Lamp 2");
    } else {
      Serial.println("Doing Nothing");
    }
  });
}

void loop() {
  if (WiFi.status() == WL_CONNECTED) {
    if (!client.available() || !client.ping()) {
      Serial.println("Disconnected from server. Reconnecting...");
      connectToServer();
    } else {
      client.poll();
    }
  } else {
    Serial.println("Disconnected from WiFi. Reconnecting...");
    connectToWifi();
  }

  delay(500);
}
