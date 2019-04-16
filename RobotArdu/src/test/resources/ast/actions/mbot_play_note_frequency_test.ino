// This file is automatically generated by the Open Roberta Lab.

#define ANALOG2PERCENT 0.0978

#include <math.h>
#include <MeMCore.h>
#include <Wire.h>
#include <SoftwareSerial.h>
#include <MeDrive.h>
#include <NEPODefs.h>
#include <RobertaFunctions.h>

MeBuzzer _meBuzzer;
RobertaFunctions rob;

void setup()
{
    Serial.begin(9600); 
}

void loop()
{
    _meBuzzer.tone(8, 300, 100);
    delay(20); 
    _meBuzzer.tone(8, 261.626, 2000);
    delay(20); 
}