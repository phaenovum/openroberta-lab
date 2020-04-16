// This file is automatically generated by the Open Roberta Lab.

#define ANALOG2PERCENT 0.0978

#include <MeMCore.h>
#include <MeDrive.h>
#include <NEPODefs.h>

MeBuzzer _meBuzzer;

void setup()
{
    Serial.begin(9600); 
}

void loop()
{
    _meBuzzer.tone(8, 300, 100);
    _meBuzzer.tone(8, 261.626, 2000);
}
