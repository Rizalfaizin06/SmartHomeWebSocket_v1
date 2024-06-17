#include <ArduinoWebsockets.h>
#include <WiFi.h>

const int device1 = 5;
const int device2 = 4;
const int device3 = 14;
const int device4 = 12;
const char* ssid = "Treacherous";
const char* password = "12344321";
const char* websockets_server_host = "192.168.10.95";
// const char* websockets_server_host = "192.168.100.123";
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

  // for (int i = 0; i < 10 && !client.available() || !client.ping(); i++) {
  //   Serial.print(".");
  //   delay(250);
  // }
  // Serial.println(".");
  if (connected) {
    Serial.println("Connected to server!");
    // client.send("Hello Server");
  } else {
    Serial.println("Failed to connect to server.");
  }
}

void setup() {
  Serial.begin(115200);

  pinMode(device1, OUTPUT);
  pinMode(device2, OUTPUT);
  pinMode(device3, OUTPUT);
  pinMode(device4, OUTPUT);
  digitalWrite(device1, HIGH);
  digitalWrite(device2, HIGH);
  digitalWrite(device3, HIGH);
  digitalWrite(device4, HIGH);

  connectToWifi();
  if (WiFi.status() == WL_CONNECTED) {
    connectToServer();
  }

  client.onMessage([&](WebsocketsMessage message) {
    Serial.print("Got Message: ");
    Serial.println(message.data());

    if (message.data() == "device1-on") {
      digitalWrite(device1, LOW);
      Serial.println("Turning ON Device 1");
    } else if (message.data() == "device1-off") {
      digitalWrite(device1, HIGH);
      Serial.println("Turning OFF Device 1");
    } else if (message.data() == "device2-on") {
      digitalWrite(device2, LOW);
      Serial.println("Turning ON Device 2");
    } else if (message.data() == "device2-off") {
      digitalWrite(device2, HIGH);
      Serial.println("Turning OFF Device 2");
    } else if (message.data() == "device3-on") {
      digitalWrite(device3, LOW);
      Serial.println("Turning ON Device 3");
    } else if (message.data() == "device3-off") {
      digitalWrite(device3, HIGH);
      Serial.println("Turning OFF Device 3");
    } else if (message.data() == "device3-on") {
      digitalWrite(device3, LOW);
      Serial.println("Turning ON Device 3");
    } else if (message.data() == "device3-off") {
      digitalWrite(device3, HIGH);
      Serial.println("Turning OFF Device 3");
    } else {
      Serial.println("Doing Nothing");
    }
  });
}

void loop() {
  if (WiFi.status() == WL_CONNECTED) {
    
      Serial.println("Check Server");
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
