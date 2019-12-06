# Changelog
All notable changes to this project will be documented in this file. 

## [Unreleased]

### Fixed
 - issue #1:    added correct isPrime implementations
### Added
 - issue #174:  Edison robot plugin
 - issue #174:  added typicon for edison
 - issue #62:   Raspberry robot plugin
 
### Changed
### Removed
### Deprecated
### Security

## [3.5.0] - 2019-07-31

### Fixed
 - issue #61:   hide robot view when changing scene
 - issue #68:   wrong types cannot be connected to ternary operators anymore 
 - issue #70:   double click changed to single click
 - issue #76:   changed css to avoid overflow
 - issue #78:   changed robot types in database
 - issue #93:   replaced wrong message key to keep caption
 - issue #97:   removed c_str() for colours
 - issue #136:  fixed itself over time
 - issue #163:  reconnect automatically
 - issue #171:  updated the link to github releases on the start pop-up
 - issue #183:  added semicolon
 - issue #190:  fixed wrong comparison
 - issue #207:  flipped boolean line sensor value
 - issue #159:  tested server deployment for raspbian stretch and buster

 
### Added
 - issue #27:   added c4ev3 robot plugin
 - issue #28:   added c4ev3 compiler workflow with custom header files in ors-rsc-cc
 - issue #29:   added c4ev3 code generation
 - issue #30:   added c4ev3 high technic sensors and bluetooth
 - issue #31:   added c4ev3 text to speech
 - issue #144:  compiler output is formatted into a new message type that is displayed to the user in a popup
 - issue #177:  added german translation for sensebox configuration blocks
 
### Changed
 - issue #172:  relaxed filters to allow more python versions
 - issue #209:  renamed WEDO gyro to tilt

### Removed
 - issue #210:  removed BOB3 beginner text category
### Deprecated
### Security

## [3.4.1] - 2019-06-27

### Fixed
 - issue #N/A:   checking out a safe branch for deployment
 - issue #N/A:   small corrections for docker dply and create-empty-db for admin.sh
 - issue #8:    add cast from MicroBitColor to ManagedString in NepoDefs.h not to break serial output on calliope
 - issue #37:   Tiltsensor does work now for WeDo
 - issue #45:   the bug found a resolution alike to createMathChange method; simulation can be opened now, if the "to (var) append text (string)" block is used
 - issue #105:  fix problem, also enable use of country flag in non public mode, if a database is provided
 
### Added
 - issue #N/A:  setting locale in ubuntu container
 - issue #N/A:  'alive' function for cron; typos removed
 
### Changed
 - issue #171:  updated the link to github releases on the start pop-up
 - issue #100:  WLAN credentials are supplied by the user separate from programs and never stored in the database SenseBox uses this

### Removed
 - issue #N/A:  Removed slotname param from configuration and associated tests

### Deprecated
### Security

## [3.4.0] - 2019-05-28

### Fixed
 - issue #N/A:  deployment, testing scripting improvements
 - issue #N/A:  integration tests, logging init.
 - issue #N/A:  refactoring for containerised deployments
 - issue #N/A:  vorwerk error handling
 - issue #4:    if in java code generation now surrounded with parens
 - issue #12:   fixed rgb function for BOB3
 - issue #22:   for plotting the plot is cleared and not the display (axes are not removed anymore when using clear plot block, but plot data is) for SenseBox
 - issue #24:   improved codegeneration for calli:bot
 - issue #988:  configuration block names now correctly work with upper/lower case names
 - issue #1138: added missing RobertaFunctions header for SenseBox code generation
 - issue #1177: improvements of integration tests, including better naming
 - issue #1181: calliope serial write

### Added
 - issue #N/A:  integration test for if-then-else construct
 - issue #N/A:  preparation for antlr4 usage
 - issue #N/A:  first version of "eval expression" block
 - issue #N/A:  reporting script in python to scan the apache log. Small error corrected for sensebox-testing helper.
 - issue #N/A:  ev3 versions in properties get the correct value now (pom.xml addition)
 - issue #N/A:  common integration tests added nestedLoops test programm
 - issue #4:    assert/debug block returns null for NXT for now
 - issue #11:   zipped log files added to gitignore
 - issue #24:   implemented and adopted blocks and codegeneration for calli:bot
 - issue #24:   create global buffer and adopt code generation for calli:bot
 - issue #33:   added unit tests for plotting a value and clearing the plot. For SenseBox
 - issue #39:   added access to the iptocountry db for public server only
 - issue #1154: new calliope plugin for the new sim execution
 - issue #1070: serial write to microbit
 - issue #1177: added common integration tests for SenseBox
 - issue #1179: debug and assert block
 - issue #1179: not in task property set for debug/assert block
 - issue #1183: Separated statistical log messages from info log messages. Implemented RollingFileAppender for saving logs in separate files. The rollover is set to daily for test purposes.
 
### Changed
 - issue #N/A:  rename Expedition plugin to RaspberryPi
 - issue #N/A:  adapted to new folder structure
 - issue #N/A:  deployment/startup scripts updated
 - issue #N/A:  docker setup for production system
 - issue #N/A:  ora-cc-rsc repository restructured
 - issue #N/A:  vorwerk icon
 - issue #15:   swapped "RST" and "SDA" in the code generation and in tests
 - issue #23:   boolean is treated as integer when assigning for Calliope (used to be String)
 - issue #26:   path resources for updating NAO, EV3 robots
 - issue #32:   modified the NAO update process to support NAO v5 and v6
 - issue #39:   improve logging for statistics
 - issue #1178: merged screen and plot configuration blocks of SenseBox
 - issue #1178: changed code generation to show plot axis and title for SenseBox
 
### Removed
 - issue #N/A:  USBInstaller, not needed resources
 - issue #N/A:  all robot resources removed. Moved to ora-cc-rsc repository
 - issue #N/A:  OpenRobertaParent folder
 - issue #N/A:  integration test for controlFlowLoops removed: wrong XML
 
### Deprecated
 - issue #N/A:  robertalab repository, moved to openroberta-lab
 
### Security

## [3.3.1] - 2019-04-02

Hotfix

### Fixed
 - issue #1176: field names added in configuration of SenseBox

## [3.3.0] - 2019-03-29

### Fixed
 - issue #N/A:  naming problem UMD <-> AMD in WeDo interpreter
 - issue #N/A:  integration tests can run completely without stopping on the first fail (3646bb5c)
 - issue #970:  template type argument removed from the return type of functions (artifact from previous implementation of lists), tests added
 - issue #981:  resetting, refreshing and restarting programs in multiple robot simulation
 - issue #981:  buttons and displays are connected to corresponding robots in multiple robot simulation
 - issue #1015: for arduino-based and mbed robots insert at last position is implemented using .push_back() method
 - issue #1112: server gets and sets the mutation for in list get block to preserver type information so the block does not pop-out
 - issue #1119: program download modal window's header displays correct robot name after switching the robot system
 - issue #1122: bluetooth send/receive block no longer reset after opening code view or compiling the program (reverse transformation corrections)
 - issue #1125: BOB3 revision number in the library is hardcoded to 103 and not read from flash anymore
 - issue #1138: reverse transformation of gyro sensor for sensebox, so the blockly block does not get reset
 - issue #1142: all ES6 specific code removed from simulation, so it is compatible with IE11 again
 - issue #1160: string constant escaping fixed for java based robots
 - issue #1166: get analog/digital value block does not destroy the program anymore
 - issue #1168: light sensor in ev3 and nxt simulation
 - issue #1170: saved programs for Calliope that contain wait blocks with button A/B behave correctly now
 - issue #1175: brace-enclosed initiliser lists are now properly converted to arrays for usage with animate block in Calliope

### Added
 - issue #1118: display deactivation for Calliope as switch LED matrix on/off block under Pin section of Action toolbox
 - issue #1124: new flag in the http session to give better feedback of the robot's state during compilation, so the play button does not become active before needed
 - issue #1138: sensebox OLED screen support for textual mode
 - issue #1138: missing OLED screen off block to the sensebox toolboxes
 - issue #1138: unit tests for OLED screen (text mode, off block), write to SD card action, send data to OpenSenseMap action, serial print, buzzer, LED, RGB LED, in-built BMX055 sensor, external sensors (HDC1080, BME280, VEML/TSL), button, sound, ultrasonic and light sensors for sensebox
 - issue #1138: checkers for missing configuration components for sensebox
 - issue #1152: execution of WeDo programs can be aborted
 - issue #1165: SHT31 sensor (humidity) support for Calliope, includes code generation, blockly changes and unit tests

### Changed
 - issue #N/A:  email address for support changed to support-o-r@iais.fraunhofer.de
 - issue #N/A:  background images for Calliope changed
 - issue #1138: sensebox libraries updated
 - issue #1138: correct C++ STL (ARM port, not ArduinoSTL) is used for sensebox
 - issue #1138: label for OLED screen changed from OLED I2C to OLED Display I2C for sensebox
 - issue #1138: default value type for send data inputs changed from string to number for sensebox, has effect on empty inputs
 - issue #1157: colour handling re-designed to make it simpler
 - issue #1159: trashcan is now bigger for easier block delition
 - issue #1160: string constants are put in single quotes instead of double
 - issue #1166: read/write pin action classes pulled from RobotMbed to Robot project
 - issue #1167: program download modal window now filled with JavaScript, table HTML removed from index.html and custom messages defined for sensebox. Affects systems with auto connection: microbit, calliope 2016 and 2017, sensebox.
 - issue #1168: light sensor mode changed from RED to LIGHT due to server refactoring, affects ev3 and nxt
 - issue #1171: direction and regulation are set to false for other power consumers, affected ev3dev

### Removed
 - issue #1166: read/write pin action classes from RobotArdu plugin
 - issue #1171: side property is removed for the middle motor, affected ev3dev
 
### Deprecated
### Security

## [3.2.1] - 2019-02-27

Hotfix

### Fixed
 - Bob3 connection type changed from token to arduinoAgentOrToken

## [3.2.0] - 2019-02-20

### Fixed
 - issue #1101: python functions would now always have return statement

### Added
 - issue #963:  chinese and swedish translations
 - issue #1107: initial sensebox support
 - issue #1131: sensebox and mBot background images

### Changed
 - issue #N/A:  WeDo now uses colour numbers instead of colour constants
 - issue #970:  template type argument removed from the return type of functions (artifact from previous implementation of lists), calliope only
 - issue #1012: a new ArrayList is now generated from a subList call to make a copy, instead of a view for Java based robots
 - issue #1132: ev3lejosv0 internally mapped to ev3lejos, so old robots could connect
 - issue #1133: directory for storing user project programs on the server renamed (src->source)

### Removed
### Deprecated
### Security

## [3.1.1] - 2019-02-19

Hotfix

### Fixed
 - issue #1130: python scripts generated for ev3dev are stored on the server for further retreval

## [3.1.0] - 2019-02-17

### Fixed
### Added
### Changed
### Removed
### Deprecated
### Security

## [3.0.3] - 2018-12-22

hotfix

### Fixed
### Added
### Changed
### Removed
### Deprecated
### Security

## [3.0.2] - 2018-10-09

hotfix

### Fixed
### Added
### Changed
### Removed
### Deprecated
### Security

## [3.0.1] - 2018-09-05

### Fixed
### Added
### Changed
### Removed
### Deprecated
### Security

## [3.0.0] - 2018-09-03

### Fixed
### Added
### Changed
### Removed
### Deprecated
### Security

## [2.8.1] - 2018-07-18

### Fixed
### Added
### Changed
### Removed
### Deprecated
### Security
