// This file is automatically generated by the Open Roberta Lab.

#include <math.h>
#include <IRremote.h>
#include <NEPODefs.h>


bool ___item;
IRrecv _irrecv_I(11);

bool _getIRPresence(IRrecv &irrecv) {
    decode_results results;
    if (irrecv.decode(&results)) {
        irrecv.resume();
        return true;
    } else {
        return false;
    }
}

long int  _getIRValue(IRrecv &irrecv) {
    decode_results results;
    if (irrecv.decode(&results)) {
        long int tmpValue = results.value;
        irrecv.resume();
        return tmpValue;
    } else {
        return 0;
    }
}

void setup()
{
    Serial.begin(9600); 
    pinMode(13, OUTPUT);
    _irrecv_I.enableIRIn();
    ___item = _getIRPresence(_irrecv_I);
}

void loop()
{
}