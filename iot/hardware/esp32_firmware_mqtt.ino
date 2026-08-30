#include <WiFi.h>
#include <PubSubClient.h>
#include <DHT.h>
#include <LiquidCrystal_I2C.h>
#include <ArduinoJson.h> // Make sure ArduinoJson library is installed in Arduino IDE

// WiFi Configuration
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// MQTT Broker Configuration
const char* mqttServer = "broker.hivemq.com";
const int mqttPort = 1883;
const char* mqttClientName = "ESP32_Field_Device_1";

// Pins Mapping
#define SOIL_MOISTURE_PIN 34
#define FLOW_SENSOR_PIN 27
#define DHT_PIN 26
#define RELAY_PIN 25
#define BUZZER_PIN 33

#define DHTTYPE DHT11
DHT dht(DHT_PIN, DHTTYPE);
LiquidCrystal_I2C lcd(0x27, 16, 2);

WiFiClient espClient;
PubSubClient client(espClient);

// Global Variables
volatile int pulseCount = 0;
float flowRate = 0.0;
unsigned int flowMilliLitres = 0;
unsigned long totalMilliLitres = 0;
unsigned long oldTime = 0;
unsigned long lastPublishTime = 0;

int fieldId = 1; // Field ID registered in database

void IRAM_ATTR pulseCounter() {
  pulseCount++;
}

// MQTT Callback Function (Executed when server sends pump commands)
void callback(char* topic, byte* payload, unsigned int length) {
  String message = "";
  for (int i = 0; i < length; i++) {
    message += (char)payload[i];
  }
  Serial.print("MQTT Callback Received [");
  Serial.print(topic);
  Serial.print("]: ");
  Serial.println(message);

  // Parse JSON Command from Backend
  StaticJsonDocument<256> doc;
  DeserializationError error = deserializeJson(doc, message);
  
  if (!error) {
    const char* action = doc["action"];
    if (String(action) == "START") {
      digitalWrite(RELAY_PIN, HIGH); // Turn Relay PUMP ON
      Serial.println("Pump START command executed.");
      lcd.setCursor(0, 1);
      lcd.print("Pump: RUNNING   ");
    } else if (String(action) == "FORCE_OFF") {
      digitalWrite(RELAY_PIN, LOW); // Turn Relay PUMP OFF
      digitalWrite(BUZZER_PIN, HIGH);
      delay(100);
      digitalWrite(BUZZER_PIN, LOW);
      Serial.println("Pump FORCE_OFF command executed.");
      lcd.setCursor(0, 1);
      lcd.print("Pump: FORCE OFF ");
    } else if (String(action) == "STAY_OFF") {
      digitalWrite(RELAY_PIN, LOW);
      lcd.setCursor(0, 1);
      lcd.print("Pump: STANDBY   ");
    }
  }
}

void reconnect() {
  while (!client.connected()) {
    Serial.print("Connecting to MQTT Broker...");
    
    // Topics
    String statusTopic = "irrigation/status/" + String(fieldId);
    String commandTopic = "irrigation/commands/" + String(fieldId);

    // Connect with Last Will & Testament (LWT) "OFFLINE"
    if (client.connect(mqttClientName, statusTopic.c_str(), 1, true, "OFFLINE")) {
      Serial.println("CONNECTED!");
      
      // Publish "ONLINE" status (Retained message)
      client.publish(statusTopic.c_str(), "ONLINE", true);
      
      // Subscribe to command topic for this field
      client.subscribe(commandTopic.c_str());
      Serial.print("Subscribed to: ");
      Serial.println(commandTopic);
    } else {
      Serial.print("Failed, rc=");
      Serial.print(client.state());
      Serial.println(" Retrying in 5 seconds...");
      delay(5000);
    }
  }
}

void setup() {
  Serial.begin(115200);

  pinMode(RELAY_PIN, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, LOW); // Default Off

  // Connect WiFi
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi Connected!");

  // Sensors & Display
  dht.begin();
  lcd.init();
  lcd.backlight();
  lcd.setCursor(0, 0);
  lcd.print("AI Irrigation");
  lcd.setCursor(0, 1);
  lcd.print("MQTT Ready");

  // Setup MQTT Client
  client.setServer(mqttServer, mqttPort);
  client.setCallback(callback);

  // Flow Sensor Interrupt
  pinMode(FLOW_SENSOR_PIN, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(FLOW_SENSOR_PIN), pulseCounter, FALLING);
}

void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop(); // Keeps MQTT connection active & processes callbacks

  // Read Telemetry & Publish every 5 seconds (5000 ms)
  unsigned long now = millis();
  if (now - lastPublishTime > 5000) {
    lastPublishTime = now;

    // Read Sensors
    float humidity = dht.readHumidity();
    float temperature = dht.readTemperature();
    int soilMoistureValue = analogRead(SOIL_MOISTURE_PIN);
    float soilMoisturePercent = map(soilMoistureValue, 4095, 0, 0, 100);

    // Calculate Flow Rate
    if ((now - oldTime) > 1000) {
      detachInterrupt(digitalPinToInterrupt(FLOW_SENSOR_PIN));
      flowRate = ((1000.0 / (now - oldTime)) * pulseCount) / 7.5;
      oldTime = now;
      pulseCount = 0;
      attachInterrupt(digitalPinToInterrupt(FLOW_SENSOR_PIN), pulseCounter, FALLING);
    }

    // Display Info on LCD
    lcd.setCursor(0, 0);
    lcd.print("M:" + String((int)soilMoisturePercent) + "% T:" + String((int)temperature) + "C    ");

    // Prepare JSON Telemetry Payload
    StaticJsonDocument<200> doc;
    doc["field_id"] = fieldId;
    doc["soil_moisture"] = soilMoisturePercent;
    doc["temperature"] = temperature;
    doc["humidity"] = humidity;
    doc["flow_rate"] = flowRate;

    char jsonBuffer[512];
    serializeJson(doc, jsonBuffer);

    // Publish to MQTT Topic
    client.publish("irrigation/telemetry", jsonBuffer);
    Serial.print("Published MQTT Telemetry: ");
    Serial.println(jsonBuffer);
  }
}
