// This file is automatically generated by the Open Roberta Lab.
#undef max
#undef min
#define _SENSEBOX_INCLUDES
#include <NEPODefs.h>
#include "RobertaFunctions.h"
#include "SenseBoxMCU.h"
#include <SPI.h>
#include <SD.h>
#include <SPI.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <senseBoxIO.h>
#include <Plot.h>
RobertaFunctions rob;
    
unsigned long _time = millis();

double ___datum;
File _dataFile;
char* _expression = "111111111111111111111112";
#define OLED_RESET 4
Adafruit_SSD1306 _display_L(OLED_RESET);
Plot _plot_L(&_display_L);

void setup()
{
    Serial.begin(9600); 
    SD.begin(28);
    _dataFile = SD.open("test.txt", FILE_WRITE);
    _dataFile.close();
    senseBoxIO.powerI2C(true);
    delay(2000);
    _display_L.begin(SSD1306_SWITCHCAPVCC, 0x3D);
    _display_L.display();
    delay(100);
    _display_L.clearDisplay();
    ___datum = 0;
}

void loop()
{
    ___datum = sqrt(_randomIntegerInRange(1, 100));
    _dataFile = SD.open("test.txt", FILE_WRITE);
    _dataFile.print(_expression);
    _dataFile.print(" : ");
    _dataFile.println(___datum);
    _dataFile.close();
    _display_L.setCursor(0, 0);
    _display_L.setTextSize(1);
    _display_L.setTextColor(WHITE, BLACK);
    _display_L.println("written to file: ");
    _display_L.display();
    
    _display_L.setCursor(0, 5);
    _display_L.setTextSize(1);
    _display_L.setTextColor(WHITE, BLACK);
    _display_L.println(___datum);
    _display_L.display();
    
    _display_L.clearDisplay();
}
