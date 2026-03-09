#include <WiFi.h>
#include <HTTPClient.h>
#include <DHT.h>
#include <LiquidCrystal_I2C.h>

// Configuration
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
const char* serverUrl = "http://YOUR_BACKEND_IP:8000/api/v1/sensors/data";

// Pins
#define SOIL_MOISTURE_PIN 34
#define FLOW_SENSOR_PIN 27
#define DHT_PIN 26
#define RELAY_PIN 25
#define BUZZER_PIN 33

// Sensors
#define DHTTYPE DHT11
DHT dht(DHT_PIN, DHTTYPE);
LiquidCrystal_I2C lcd(0x27, 16, 2);

// Global Variables
volatile int pulseCount = 0;
float flowRate = 0.0;
unsigned int flowMilliLitres = 0;
unsigned long totalMilliLitres = 0;
unsigned long oldTime = 0;

int fieldId = 1; // Registered ID for this field

void IRAM_ATTR pulseCounter() {
  pulseCount++;
}

void setup() {
  Serial.begin(115200);
  
  // Pins
  pinMode(RELAY_PIN, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, LOW); // Pump Off
  
  // WiFi
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("WiFi Connected");

  // Sensors & Display
  dht.begin();
  lcd.init();
  lcd.backlight();
  lcd.setCursor(0, 0);
  lcd.print("AI Irrigation");
  lcd.setCursor(0, 1);
  lcd.print("System Ready");

  // Flow sensor interrupt
  pinMode(FLOW_SENSOR_PIN, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(FLOW_SENSOR_PIN), pulseCounter, FALLING);
}

void loop() {
  // 1. Read Sensors
  float humidity = dht.readHumidity();
  float temperature = dht.readTemperature();
  int soilMoistureValue = analogRead(SOIL_MOISTURE_PIN);
  float soilMoisturePercent = map(soilMoistureValue, 4095, 0, 0, 100); // Simple mapping
  
  // 2. Flow Calculation
  if ((millis() - oldTime) > 1000) {
    detachInterrupt(digitalPinToInterrupt(FLOW_SENSOR_PIN));
    flowRate = ((1000.0 / (millis() - oldTime)) * pulseCount) / 7.5;
    oldTime = millis();
    flowMilliLitres = (flowRate / 60) * 1000;
    totalMilliLitres += flowMilliLitres;
    pulseCount = 0;
    attachInterrupt(digitalPinToInterrupt(FLOW_SENSOR_PIN), pulseCounter, FALLING);
  }

  // 3. Display Info
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("M:" + String(soilMoisturePercent) + "% T:" + String(temperature));
  lcd.setCursor(0, 1);
  lcd.print("Flow:" + String(flowRate) + "L/m");

  // 4. Send Data to Backend
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(serverUrl);
    http.addHeader("Content-Type", "application/json");

    String jsonStr = "{\"field_id\":" + String(fieldId) + ", \"soil_moisture\":" + String(soilMoisturePercent) + 
                     ", \"temperature\":" + String(temperature) + ", \"humidity\":" + String(humidity) + 
                     ", \"flow_rate\":" + String(flowRate) + "}";
    
    int httpResponseCode = http.POST(jsonStr);
    
    if (httpResponseCode > 0) {
      String response = http.getString();
      Serial.println("Response: " + response);
      
      // Handle Pump Action from Backend
      if (response.indexOf("START") > 0) {
        digitalWrite(RELAY_PIN, HIGH);
        Serial.println("Pump START");
      } else if (response.indexOf("FORCE_OFF") > 0) {
        digitalWrite(RELAY_PIN, LOW);
        digitalWrite(BUZZER_PIN, HIGH);
        delay(100);
        digitalWrite(BUZZER_PIN, LOW);
        Serial.println("Pump FORCE OFF");
      } else if (response.indexOf("STAY_OFF") > 0) {
        digitalWrite(RELAY_PIN, LOW);
      }
    }
    http.end();
  }

  // 5. Water Flow Logic (Check for failure/leaks)
  if (digitalRead(RELAY_PIN) == HIGH && flowRate < 0.1) {
    // Pump is on but no flow?
    tone(BUZZER_PIN, 1000, 500); 
    lcd.setCursor(0, 1);
    lcd.print("PUMP FAILURE!");
  }

  delay(5000); // 5s interval
}
