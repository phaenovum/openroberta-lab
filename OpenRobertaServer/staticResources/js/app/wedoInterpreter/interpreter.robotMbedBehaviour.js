var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
define(["require", "exports", "interpreter.aRobotBehaviour", "interpreter.constants", "interpreter.util"], function (require, exports, interpreter_aRobotBehaviour_1, C, U) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var RobotMbedBehaviour = (function (_super) {
        __extends(RobotMbedBehaviour, _super);
        function RobotMbedBehaviour() {
            var _this = _super.call(this) || this;
            _this.hardwareState.motors = {};
            U.loggingEnabled(false, false);
            return _this;
        }
        RobotMbedBehaviour.prototype.getSample = function (s, name, sensor, port, mode) {
            var robotText = 'robot: ' + name + ', port: ' + port + ', mode: ' + mode;
            U.debug(robotText + ' getsample from ' + sensor);
            var sensorName = sensor;
            if (sensorName == C.TIMER) {
                s.push(this.timerGet(port));
            }
            else if (sensorName == C.ENCODER_SENSOR_SAMPLE) {
                s.push(this.getEncoderValue(mode, port));
            }
            else {
                s.push(this.getSensorValue(sensorName, mode));
            }
        };
        RobotMbedBehaviour.prototype.getEncoderValue = function (mode, port) {
            var sensor = this.hardwareState.sensors.encoder;
            port = port == C.MOTOR_LEFT ? C.LEFT : C.RIGHT;
            if (port != undefined) {
                var v = sensor[port];
                if (v === undefined) {
                    return "undefined";
                }
                else {
                    return this.rotation2Unit(v, mode);
                }
            }
            return sensor;
        };
        RobotMbedBehaviour.prototype.rotation2Unit = function (value, unit) {
            switch (unit) {
                case C.DEGREE:
                    return value;
                case C.ROTATIONS:
                    return value / 360.0;
                case C.DISTANCE:
                    return value * C.WHEEL_DIAMETER * Math.PI / 360.0;
                default:
                    return 0;
            }
        };
        RobotMbedBehaviour.prototype.getSensorValue = function (sensorName, mode) {
            var sensor = this.hardwareState.sensors[sensorName];
            if (sensor === undefined) {
                return "undefined";
            }
            if (mode != undefined) {
                var v = sensor[mode];
                if (v === undefined) {
                    return false;
                }
                else {
                    return v;
                }
            }
            return sensor;
        };
        RobotMbedBehaviour.prototype.encoderReset = function (port) {
            U.debug('encoderReset for ' + port);
            this.hardwareState.actions.encoder = {};
            if (port == C.MOTOR_LEFT) {
                this.hardwareState.actions.encoder.leftReset = true;
            }
            else {
                this.hardwareState.actions.encoder.rightReset = true;
            }
        };
        RobotMbedBehaviour.prototype.timerReset = function (port) {
            this.hardwareState.timers[port] = Date.now();
            U.debug('timerReset for ' + port);
        };
        RobotMbedBehaviour.prototype.timerGet = function (port) {
            var now = Date.now();
            var startTime = this.hardwareState.timers[port];
            if (startTime === undefined) {
                startTime = this.hardwareState.timers['start'];
            }
            var delta = now - startTime;
            U.debug('timerGet for ' + port + ' returned ' + delta);
            return delta;
        };
        RobotMbedBehaviour.prototype.ledOnAction = function (name, port, color) {
            var robotText = 'robot: ' + name + ', port: ' + port;
            U.debug(robotText + ' led on color ' + color);
            this.hardwareState.actions.led = {};
            this.hardwareState.actions.led.color = color;
        };
        RobotMbedBehaviour.prototype.statusLightOffAction = function (name, port) {
            var robotText = 'robot: ' + name + ', port: ' + port;
            U.debug(robotText + ' led off');
            this.hardwareState.actions.led = {};
            this.hardwareState.actions.led.mode = C.OFF;
        };
        RobotMbedBehaviour.prototype.toneAction = function (name, frequency, duration) {
            U.debug(name + ' piezo: ' + ', frequency: ' + frequency + ', duration: ' + duration);
            this.hardwareState.actions.tone = {};
            this.hardwareState.actions.tone.frequency = frequency;
            this.hardwareState.actions.tone.duration = duration;
            return duration;
        };
        RobotMbedBehaviour.prototype.playFileAction = function (file) {
            U.debug('play file: ' + file);
            this.hardwareState.actions.tone = {};
            this.hardwareState.actions.tone.file = file;
            switch (file) {
                case '0':
                    return 1000;
                case '1':
                    return 350;
                case '2':
                    return 700;
                case '3':
                    return 700;
                case '4':
                    return 500;
            }
        };
        RobotMbedBehaviour.prototype.setVolumeAction = function (volume) {
            U.debug('set volume: ' + volume);
            this.hardwareState.actions.volume = volume;
            this.hardwareState.volume = volume;
        };
        RobotMbedBehaviour.prototype.getVolumeAction = function (s) {
            U.debug('get volume');
            s.push(this.hardwareState.volume);
        };
        RobotMbedBehaviour.prototype.setLanguage = function (language) {
            U.debug('set language ' + language);
            this.hardwareState.actions.language = language;
        };
        RobotMbedBehaviour.prototype.sayTextAction = function (text, speed, pitch) {
            if (this.hardwareState.actions.sayText == undefined) {
                this.hardwareState.actions.sayText = {};
            }
            this.hardwareState.actions.sayText.text = text;
            this.hardwareState.actions.sayText.speed = speed;
            this.hardwareState.actions.sayText.pitch = pitch;
            return;
        };
        RobotMbedBehaviour.prototype.motorOnAction = function (name, port, duration, speed) {
            var robotText = 'robot: ' + name + ', port: ' + port;
            var durText = duration === 0 ? ' w.o. duration' : (' for ' + duration + ' msec');
            U.debug(robotText + ' motor speed ' + speed + durText);
            if (this.hardwareState.actions.motors == undefined) {
                this.hardwareState.actions.motors = {};
            }
            this.hardwareState.actions.motors[port] = speed;
            this.hardwareState.motors[port] = speed;
            return 0;
        };
        RobotMbedBehaviour.prototype.motorStopAction = function (name, port) {
            var robotText = 'robot: ' + name + ', port: ' + port;
            U.debug(robotText + ' motor stop');
            this.motorOnAction(name, port, 0, 0);
        };
        RobotMbedBehaviour.prototype.driveAction = function (name, direction, speed, distance) {
            var robotText = 'robot: ' + name + ', direction: ' + direction;
            var durText = distance === 0 ? ' w.o. duration' : (' for ' + distance + ' msec');
            U.debug(robotText + ' motor speed ' + speed + durText);
            if (this.hardwareState.actions.motors == undefined) {
                this.hardwareState.actions.motors = {};
            }
            if (direction != C.FOREWARD) {
                speed *= -1;
            }
            this.hardwareState.actions.motors[C.MOTOR_LEFT] = speed;
            this.hardwareState.actions.motors[C.MOTOR_RIGHT] = speed;
            this.hardwareState.motors[C.MOTOR_LEFT] = speed;
            this.hardwareState.motors[C.MOTOR_RIGHT] = speed;
            var rotations = distance / (C.WHEEL_DIAMETER * Math.PI);
            var rotationPerSecond = C.MAX_ROTATION * Math.abs(speed) / 100.0;
            var duration = rotations / rotationPerSecond * 1000;
            return duration;
        };
        RobotMbedBehaviour.prototype.curveAction = function (name, direction, speedL, speedR, distance) {
            var robotText = 'robot: ' + name + ', direction: ' + direction;
            var durText = distance === 0 ? ' w.o. duration' : (' for ' + distance + ' msec');
            U.debug(robotText + ' left motor speed ' + speedL + ' right motor speed ' + speedR + durText);
            if (this.hardwareState.actions.motors == undefined) {
                this.hardwareState.actions.motors = {};
            }
            if (direction != C.FOREWARD) {
                speedL *= -1;
                speedR *= -1;
            }
            this.hardwareState.actions.motors[C.MOTOR_LEFT] = speedL;
            this.hardwareState.actions.motors[C.MOTOR_RIGHT] = speedR;
            this.hardwareState.motors[C.MOTOR_LEFT] = speedL;
            this.hardwareState.motors[C.MOTOR_RIGHT] = speedR;
            if (speedL == speedR) {
                var rotations = distance / (C.WHEEL_DIAMETER * Math.PI);
                var rotationPerSecond = C.MAX_ROTATION * Math.abs(speedL) / 100.0;
                var duration = rotations / rotationPerSecond * 1000;
                return duration;
            }
            return 0;
        };
        RobotMbedBehaviour.prototype.turnAction = function (name, direction, speed, angle) {
            var robotText = 'robot: ' + name + ', direction: ' + direction;
            var durText = angle === 0 ? ' w.o. duration' : (' for ' + angle + ' msec');
            U.debug(robotText + ' motor speed ' + speed + durText);
            if (this.hardwareState.actions.motors == undefined) {
                this.hardwareState.actions.motors = {};
            }
            this.setTurnSpeed(speed, direction);
            var rotations = C.TURN_RATIO * (angle / 720.);
            var rotationPerSecond = C.MAX_ROTATION * Math.abs(speed) / 100.0;
            angle = rotations / rotationPerSecond * 1000;
            return angle;
        };
        RobotMbedBehaviour.prototype.setTurnSpeed = function (speed, direction) {
            if (direction == C.LEFT) {
                this.hardwareState.actions.motors[C.MOTOR_LEFT] = -speed;
                this.hardwareState.actions.motors[C.MOTOR_RIGHT] = speed;
            }
            else {
                this.hardwareState.actions.motors[C.MOTOR_LEFT] = speed;
                this.hardwareState.actions.motors[C.MOTOR_RIGHT] = -speed;
            }
        };
        RobotMbedBehaviour.prototype.driveStop = function (name) {
            U.debug('robot: ' + name + ' stop motors');
            if (this.hardwareState.actions.motors == undefined) {
                this.hardwareState.actions.motors = {};
            }
            this.hardwareState.actions.motors[C.MOTOR_LEFT] = 0;
            this.hardwareState.actions.motors[C.MOTOR_RIGHT] = 0;
        };
        RobotMbedBehaviour.prototype.getMotorSpeed = function (s, name, port) {
            var robotText = 'robot: ' + name + ', port: ' + port;
            U.debug(robotText + ' motor get speed');
            var speed = this.hardwareState.motors[port];
            s.push(speed);
        };
        RobotMbedBehaviour.prototype.setMotorSpeed = function (name, port, speed) {
            var robotText = 'robot: ' + name + ', port: ' + port;
            U.debug(robotText + ' motor speed ' + speed);
            if (this.hardwareState.actions.motors == undefined) {
                this.hardwareState.actions.motors = {};
            }
            this.hardwareState.actions.motors[port] = speed;
            this.hardwareState.motors[port] = speed;
        };
        RobotMbedBehaviour.prototype.showTextAction = function (text, mode) {
            var showText = "" + text;
            U.debug('***** show "' + showText + '" *****');
            var textLen = showText.length;
            var duration = 0;
            if (mode == C.TEXT) {
                duration = (textLen + 1) * 7 * 150;
            }
            else if (mode == C.CHARACTER && textLen > 1) {
                duration = textLen * 400;
            }
            this.hardwareState.actions.display = {};
            this.hardwareState.actions.display[mode.toLowerCase()] = showText;
            return duration;
        };
        RobotMbedBehaviour.prototype.showTextActionPosition = function (text, x, y) {
            var showText = "" + text;
            U.debug('***** show "' + showText + '" *****');
            this.hardwareState.actions.display = {};
            this.hardwareState.actions.display.text = showText;
            this.hardwareState.actions.display.x = x;
            this.hardwareState.actions.display.y = y;
        };
        RobotMbedBehaviour.prototype.showImageAction = function (image, mode) {
            var showImage = "" + image;
            U.debug('***** show "' + showImage + '" *****');
            var imageLen = image.length;
            var duration = 0;
            if (mode == C.ANIMATION) {
                duration = imageLen * 200;
            }
            this.hardwareState.actions.display = {};
            this.hardwareState.actions.display.picture = image;
            if (mode) {
                this.hardwareState.actions.display.mode = mode.toLowerCase();
            }
            return duration;
        };
        RobotMbedBehaviour.prototype.displaySetBrightnessAction = function (value) {
            U.debug('***** set brightness "' + value + '" *****');
            this.hardwareState.actions.display = {};
            this.hardwareState.actions.display[C.BRIGHTNESS] = value;
            return 0;
        };
        RobotMbedBehaviour.prototype.lightAction = function (mode, color) {
            U.debug('***** light action mode= "' + mode + ' color=' + color + '" *****');
            this.hardwareState.actions.led = {};
            this.hardwareState.actions.led[C.MODE] = mode;
            this.hardwareState.actions.led[C.COLOR] = color;
        };
        RobotMbedBehaviour.prototype.displaySetPixelBrightnessAction = function (x, y, brightness) {
            U.debug('***** set pixel x="' + x + ", y=" + y + ", brightness=" + brightness + '" *****');
            this.hardwareState.actions.display = {};
            this.hardwareState.actions.display[C.PIXEL] = {};
            this.hardwareState.actions.display[C.PIXEL][C.X] = x;
            this.hardwareState.actions.display[C.PIXEL][C.Y] = y;
            this.hardwareState.actions.display[C.PIXEL][C.BRIGHTNESS] = brightness;
            return 0;
        };
        RobotMbedBehaviour.prototype.displayGetPixelBrightnessAction = function (s, x, y) {
            U.debug('***** get pixel x="' + x + ", y=" + y + '" *****');
            var sensor = this.hardwareState.sensors[C.DISPLAY][C.PIXEL];
            s.push(sensor[y][x]);
        };
        RobotMbedBehaviour.prototype.clearDisplay = function () {
            U.debug('clear display');
            this.hardwareState.actions.display = {};
            this.hardwareState.actions.display.clear = true;
            return 0;
        };
        RobotMbedBehaviour.prototype.writePinAction = function (pin, mode, value) {
            this.hardwareState.actions["pin" + pin] = {};
            this.hardwareState.actions["pin" + pin][mode] = {};
            this.hardwareState.actions["pin" + pin][mode] = value;
        };
        RobotMbedBehaviour.prototype.gyroReset = function (_port) {
            throw new Error("Method not implemented.");
        };
        RobotMbedBehaviour.prototype.getState = function () {
            return this.hardwareState;
        };
        RobotMbedBehaviour.prototype.close = function () {
        };
        return RobotMbedBehaviour;
    }(interpreter_aRobotBehaviour_1.ARobotBehaviour));
    exports.RobotMbedBehaviour = RobotMbedBehaviour;
});
