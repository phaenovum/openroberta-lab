/**
 * @fileOverview Simulate a robot
 * @author Beate Jost <beate.jost@iais.fraunhofer.de>
 */

/**
 * @namespace SIM
 */

define(['exports', 'simulation.scene', 'simulation.math', 'program.controller', 'simulation.constants', 'util', 'program.controller',
        'interpreter.interpreter', 'interpreter.robotSimBehaviour', 'volume-meter', 'simulation.constants', 'message', 'jquery'
    ], function (exports, Scene, SIMATH, ROBERTA_PROGRAM, CONST, UTIL, PROGRAM_C,
                 SIM_I, MBED_R, Volume, C, MSG, $) {

        var interpreters;
        var scene;
        var userPrograms;
        var configurations = [];
        var canvasOffset;
        var offsetX;
        var offsetY;
        var isDownRobots = [];
        var isDownObstacle = false;
        var isDownRuler = false;
        var startX;
        var startY;
        var scale = 1;
        var timerStep = 0;
        var canceled;
        var storedPrograms;
        var customBackgroundLoaded = false;
        var debugMode = false;
        var breakpoints = [];
        var observers = {};

        var imgGoal = new Image();

        var imgObstacle1 = new Image();
        var imgPattern = new Image();
        var imgRuler = new Image();
        var imgList = ['/js/app/simulation/simBackgrounds/baustelle.svg', '/js/app/simulation/simBackgrounds/ruler.svg',
            '/js/app/simulation/simBackgrounds/wallPattern.png', '/js/app/simulation/simBackgrounds/calliopeBackground.svg',
            '/js/app/simulation/simBackgrounds/microbitBackground.svg', '/js/app/simulation/simBackgrounds/simpleBackground.svg',
            '/js/app/simulation/simBackgrounds/drawBackground.svg', '/js/app/simulation/simBackgrounds/robertaBackground.svg',
            '/js/app/simulation/simBackgrounds/rescueBackground.svg', '/js/app/simulation/simBackgrounds/wroBackground.svg',
            '/js/app/simulation/simBackgrounds/mathBackground.svg',
            '/js/app/simulation/simBackgrounds/roborave/line-following/es/linefollowing.svg',
            '/js/app/simulation/simBackgrounds/roborave/line-following/ms/linefollowing.svg',
            '/js/app/simulation/simBackgrounds/roborave/line-following/hs/linefollowing.svg',
            '/js/app/simulation/simBackgrounds/roborave/labyrinth/es/labyrinth.svg',
            '/js/app/simulation/simBackgrounds/roborave/labyrinth/ms/labyrinth.svg',
            '/js/app/simulation/simBackgrounds/roborave/labyrinth/hs/labyrinth.svg',
            '/js/app/simulation/simBackgrounds/dummyBackground.svg',
            '/js/app/simulation/simBackgrounds/dummyBackground.svg',
            '/js/app/simulation/simBackgrounds/dummyBackground.svg'
        ];
        var imgListIE = ['/js/app/simulation/simBackgrounds/baustelle.png', '/js/app/simulation/simBackgrounds/ruler.png',
            '/js/app/simulation/simBackgrounds/wallPattern.png', '/js/app/simulation/simBackgrounds/calliopeBackground.png',
            '/js/app/simulation/simBackgrounds/microbitBackground.png', '/js/app/simulation/simBackgrounds/simpleBackground.png',
            '/js/app/simulation/simBackgrounds/drawBackground.png', '/js/app/simulation/simBackgrounds/robertaBackground.png',
            '/js/app/simulation/simBackgrounds/rescueBackground.png', '/js/app/simulation/simBackgrounds/wroBackground.png',
            '/js/app/simulation/simBackgrounds/mathBackground.png',
            '/js/app/simulation/simBackgrounds/roborave/line-following/es/linefollowing.png',
            '/js/app/simulation/simBackgrounds/roborave/line-following/ms/linefollowing.png',
            '/js/app/simulation/simBackgrounds/roborave/line-following/hs/linefollowing.png',
            '/js/app/simulation/simBackgrounds/roborave/labyrinth/es/labyrinth.png',
            '/js/app/simulation/simBackgrounds/roborave/labyrinth/ms/labyrinth.png',
            '/js/app/simulation/simBackgrounds/roborave/labyrinth/hs/labyrinth.png',
            '/js/app/simulation/simBackgrounds/dummyBackground.png',
            '/js/app/simulation/simBackgrounds/dummyBackground.png',
            '/js/app/simulation/simBackgrounds/dummyBackground.png'
        ];
        // [] -> dummys for scenes without random Images
        var randomImageList = [[], [], [], [], [], [], [], [], [], [], [], [], [], [], ['/js/app/simulation/simBackgrounds/roborave/rainbow/es/dino.svg', '/js/app/simulation/simBackgrounds/roborave/rainbow/es/rainbow.svg'],
            ['/js/app/simulation/simBackgrounds/roborave/rainbow/ms/'],
            ['/js/app/simulation/simBackgrounds/roborave/rainbow/hs/']]
        var randomImageListIE = []
        var randomImageObjectList = [[]]


        var imgObjectList = [];
        var RR_LineFollowing_ES = 8;
        var RR_LineFollowing_MS = 9;
        var RR_LineFollowing_HS = 10;
        var RR_Maze_ES = 11;
        var RR_Maze_MS = 12;
        var RR_Maze_HS = 13;
        var RR_Rainbow_ES = 14;
        var RR_Rainbow_MS = 15;
        var RR_Rainbow_HS = 16;

        function preloadImages() {
            imgGoal.src = "/js/app/simulation/simBackgrounds/goal.svg";

            if (isIE()) {
                imgList = imgListIE;
                randomImageList = randomImageListIE;
            }
            let i;
            hs_dir = randomImageList[RR_Rainbow_HS][0];
            for (i = 0; i < 256; i++) {
                randomImageList[RR_Rainbow_HS][i] = hs_dir + "space_invaders_" + i.toString() + ".svg";
            }
            ms_dir = randomImageList[RR_Rainbow_MS][0];
            for (i = 0; i < 24; i++) {
                randomImageList[RR_Rainbow_MS][i] = ms_dir + "dino_" + i.toString() + ".svg";
            }
            for (i = 0; i < 24; i++) {
                randomImageList[RR_Rainbow_MS][i + 24] = ms_dir + "rainbow_" + i.toString() + ".svg";
            }
            for (i = 0; i < imgList.length; i++) {
                if (i === 0) {
                    imgObstacle1.src = imgList[i];
                } else if (i == 1) {
                    imgRuler.src = imgList[i];
                } else if (i == 2) {
                    imgPattern.src = imgList[i];
                } else {
                    imgObjectList[i - 3] = new Image();
                    imgObjectList[i - 3].src = imgList[i];
                }
            }

            for (i = 0; i < randomImageList.length; i++) {
                randomImageObjectList[i] = [];
                if (randomImageList[i].length !== 0) {
                    for (var j = 0; j < randomImageList[i].length; j++) {
                        randomImageObjectList[i][j] = null;//new Image();
                        //randomImageObjectList[i][j].src = randomImageList[i][j];
                    }
                }
            }
            if (UTIL.isLocalStorageAvailable()) {
                var customBackground = localStorage.getItem("customBackground");

                if (customBackground) {
                    // TODO backwards compatibility for non timestamped background images; can be removed after some time
                    try {
                        JSON.parse(customBackground);
                    } catch (e) {
                        localStorage.setItem("customBackground", JSON.stringify({
                            image: customBackground,
                            timestamp: new Date().getTime()
                        }));
                        customBackground = localStorage.getItem("customBackground");
                    }

                    customBackground = JSON.parse(customBackground);
                    // remove images older than 30 days
                    var currentTimestamp = new Date().getTime();
                    if (currentTimestamp - customBackground.timestamp > 63 * 24 * 60 * 60 * 1000) {
                        localStorage.removeItem('customBackground');
                    } else {
                        // add image to backgrounds if recent
                        var dataImage = customBackground.image;
                        imgObjectList[i - 3] = new Image();
                        imgObjectList[i - 3].src = "data:image/png;base64," + dataImage;
                        customBackgroundLoaded = true;
                    }
                }
            }
        }

        preloadImages();

        var currentBackground = RR_LineFollowing_ES;

        function getrandomObject() {

            const idx = Math.floor(Math.random() * randomImageObjectList[currentBackground].length);

            var img = randomImageObjectList[currentBackground][idx];

            if(randomImageObjectList[currentBackground][idx] == null) {
                img = new Image();
                randomImageObjectList[currentBackground][idx] = img;
                img.src = randomImageList[currentBackground][idx];
            }



            // TODO: move to scene?
            function updateBackground(scene) {
                if(img.complete && img.naturalHeight !== 0) {
                    resizeAll(); // the initial image has no size, this will break the scene and we need to resize ist
                    //console.log("image loaded");
                } else {
                    //console.log("image not loaded ...");
                    setTimeout(updateBackground, 500, scene);
                }
            }

            updateBackground(scene);



            return randomImageObjectList[currentBackground][idx];
        }

        function setBackground(num, callback) {
            if (num == undefined) {
                setObstacle();
                setWaypoints();
                setRuler();
                removeMouseEvents();
                if (randomImageObjectList[currentBackground].length !== 0) {
                    scene = new Scene(getrandomObject(), robots, imgPattern, ruler, imgGoal);
                } else {
                    scene = new Scene(imgObjectList[currentBackground], robots, imgPattern, ruler, imgGoal);
                }
                scene.updateBackgrounds();
                scene.drawObjects();
                scene.drawRuler();
                addMouseEvents();
                reloadProgram();
                resizeAll();
                return currentBackground;
            }
            setPause(true);
            $('#simControl').attr('data-original-title', Blockly.Msg.MENU_SIM_STOP_TOOLTIP);
            if (num === -1) {
                currentBackground += 1;
                if (currentBackground >= imgObjectList.length) {
                    currentBackground = 2;
                }
                if (currentBackground === (imgObjectList.length - 1) && customBackgroundLoaded && UTIL.isLocalStorageAvailable()) {
                    // update timestamp of custom background
                    localStorage.setItem("customBackground", JSON.stringify({
                        image: JSON.parse(localStorage.getItem("customBackground")).image,
                        timestamp: new Date().getTime()
                    }));
                }
            } else {
                currentBackground = num;
            }
            var debug = robots[0].debug;
            var moduleName = 'simulation.robot.' + simRobotType;
            require([moduleName], function (ROBOT) {
                createRobots(ROBOT, numRobots);
                for (var i = 0; i < robots.length; i++) {
                    robots[i].debug = debug;
                    robots[i].reset();
                }
                callback();
            });
        }

        exports.setBackground = setBackground;

        function getBackground() {
            return currentBackground;
        }

        exports.getBackground = getBackground;

        function initMicrophone(robot) {
            if (navigator.mediaDevices === undefined) {
                navigator.mediaDevices = {};
            }
            navigator.mediaDevices.getUserMedia = navigator.mediaDevices.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

            try {
                // ask for an audio input
                navigator.mediaDevices.getUserMedia({
                    "audio": {
                        "mandatory": {
                            "googEchoCancellation": "false",
                            "googAutoGainControl": "false",
                            "googNoiseSuppression": "false",
                            "googHighpassFilter": "false"
                        },
                        "optional": []
                    },
                }).then(function (stream) {
                    var mediaStreamSource = robot.webAudio.context.createMediaStreamSource(stream);
                    robot.sound = Volume.createAudioMeter(robot.webAudio.context);
                    mediaStreamSource.connect(robot.sound);
                }, function () {
                    console.log("Sorry, but there is no microphone available on your system");
                });
            } catch (e) {
                console.log("Sorry, but there is no microphone available on your system");
            }
        }

        exports.initMicrophone = initMicrophone;

        var time;
        var renderTime = 5; // approx. time in ms only for the first rendering

        var dt = 0;

        function getDt() {
            return dt;
        }

        exports.getDt = getDt;

        var pause = false;

        function setPause(value) {
            if (!value && readyRobots.indexOf(false) > -1) {
                setTimeout(function () {
                    setPause(false);
                }, 100);
            } else {
                if (value && !debugMode) {
                    $('#simControl').addClass('typcn-media-play-outline').removeClass('typcn-media-stop');
                    $('#simControl').attr('data-original-title', Blockly.Msg.MENU_SIM_START_TOOLTIP);
                } else {
                    $('#simControl').addClass('typcn-media-stop').removeClass('typcn-media-play-outline');
                    $('#simControl').attr('data-original-title', Blockly.Msg.MENU_SIM_STOP_TOOLTIP);
                }
                pause = value;
            }
            for (var i = 0; i < robots.length; i++) {
                if (robots[i].left) {
                    robots[i].left = 0;
                }
                if (robots[i].right) {
                    robots[i].right = 0;
                }
            }
        }

        exports.setPause = setPause;

        var stepCounter;
        var runRenderUntil;

        function setStep() {
            stepCounter = -50;
            setPause(false);
        }

        exports.setStep = setStep;

        var info;

        function setInfo() {
            if (info === true) {
                info = false;
            } else {
                info = true;
            }
        }

        exports.setInfo = setInfo;

        function resetGame() {
            resetScore();
            resetWaypoints();

            if (exports.switches) {
                for (let i = 0; i < exports.switches.length; i++) {
                    exports.switches[i].pressed = false;
                }
            }
        }
        exports.resetGame = resetGame;

        function resetPose() {
            for (var i = 0; i < numRobots; i++) {
                if (robots[i].resetPose) {
                    robots[i].resetPose();
                }
                if (robots[i].time) {
                    robots[i].time = 0;
                }
            }
            resetGame();
        }

        exports.resetPose = resetPose;

        function stopProgram() {
            setPause(true);
            for (var i = 0; i < numRobots; i++) {
                robots[i].reset();
            }
            reloadProgram();
            for (var i = 0; i < numRobots; i++) {
                interpreters[i].removeHighlights();
            }

            setTimeout(function () {
                init(userPrograms, false, simRobotType);
                addMouseEvents();
            }, 205);

            resetGame();
        }

        exports.stopProgram = stopProgram;

        // obstacles
        // scaled playground
        var ground = {
            x: 0,
            y: 0,
            w: 500,
            h: 500,
            isParallelToAxis: true
        };

        var obstacle = {
            x: 0,
            y: 0,
            xOld: 0,
            yOld: 0,
            w: 0,
            h: 0,
            wOld: 0,
            hOld: 0,
            isParallelToAxis: true,
        };


        var obslist = [ground, obstacle];
        exports.obstacleList = obslist;
        // EDIT:
        /*var goal = {
            x: 0,
            y: 0,
            w: 100,
            h: 100,
            color: "#FFFFFF"
        };*/

        exports.goal = null; // define goal rect if needed

        exports.goalReached = false;
        exports.goalTime = 0;
        exports.score = 0;
        exports.addedRemainingTime = false;

        // will probably never change
        exports.goalNeedsWaypoint = true;

        exports.timeout = 1; // set to -1 for infinite time
        exports.isTimeout = false;


        exports.rainbowColor = []

        function resetScore() {
            exports.score = 0;
            exports.goalReached = false;
            exports.goalTime = 0;
            exports.isTimeout = false;
            exports.addedRemainingTime = false;
        }


        // waypoint settings:
        exports.waypointData = {
            // this list can be empty
            waypointLists: [],
            onAllWaypointsDone: function () {
                //console.log("All waypoints triggered!!!");
                if(this.waypointsRainbowMode) {
                    exports.goalReached = true;
                    if (exports.timeout !== -1 && !exports.addedRemainingTime) {
                        exports.addedRemainingTime = true;
                        exports.score += exports.timeout - UTIL.round(exports.goalTime, 1)
                    }
                }
                this.enableGoal = true;
            },
            getNextWaypointForList: function(idx) {
                if(idx >= this.waypointLists.length) {
                    console.log("Error: no waypoints found!!!");
                    return null;
                }

                const wp = this.waypointLists[idx];

                if(wp.currentWaypointIdx < wp.waypoints.length-1) {
                    return wp.waypoints[wp.currentWaypointIdx+1];
                } else if(this.waypointsReverse) {
                    const nextIdx = 2*wp.waypoints.length - wp.currentWaypointIdx - 2;
                    if(nextIdx >= 0) {
                        return wp.waypoints[nextIdx];
                    } else {
                        return "end";
                    }
                } else {
                    return "end";
                }
            },
            enableGoal: false,
            colorIdx: 0,

            // Settings:
            waypointsRainbowMode: true,
            // TODO: settings per waypoint?
            waypointsReverse: true, // forces the player to move the same way backwards
            waypointsDebug: true

        };

        function resetWaypoints() {
            const waypointData = exports.waypointData;
            waypointData.enableGoal = false;
            waypointData.colorIdx = 0;

            const waypointLists = waypointData.waypointLists;
            for (let i = 0; i < waypointLists.length; i++) {
                const waypoints = waypointLists[i];
                waypoints.currentWaypointIdx = -1;
                waypoints.done = false;
                for (let j = 0; j < waypoints.waypoints.length; j++) {
                    waypoints.waypoints[j].forwardsMarker = false;
                    waypoints.waypoints[j].backwardsMarker = false;
                }
            }

        }
        
        
        
        
        
        
        exports.showScore = function () {
            exports.goalReached = true;
        }
        

        var switches = null;
        /*[
            {
                pressed: false, // default value
                x: 100,
                y: 100,
                w: 100,
                h: 100,
                colorPressed: "#00ff00",
                colorReleased: "#FF0000",
                obstacle: switchableObstacle,
                onPress: function (sim, robot, swt) {
                    console.log("switch pressed");
                    if(sim.obstacleList.includes(swt.obstacle)) {
                        sim.obstacleList.splice( $.inArray(swt.obstacle, sim.obstacleList), 1 );
                    }
                },
                onRelease: function (sim, robot, swt) {
                    console.log("switch released");
                    sim.obstacleList.push(swt.obstacle);
                }
            }
        ];*/

        exports.switches = switches;

        var hoverindex = 0;
        exports.hoverindex = hoverindex;

        var ruler = {
            x: 0,
            y: 0,
            xOld: 0,
            yOld: 0,
            w: 0,
            h: 0,
            wOld: 0,
            hOld: 0
        };
        // Note: The ruler is not considered an obstacle. The robot will
        // simply drive over it.

        var globalID;
        var robots = [];
        var robotIndex = 0;
        var mouseOnRobotIndex = 0;
        var simRobotType;
        var numRobots = 0;
        exports.getNumRobots = function () {
            return numRobots;
        };
        var ROBOT;

        function callbackOnTermination() {
            console.log("END of Sim");
        }

        function init(programs, refresh, robotType) {
            mouseOnRobotIndex = -1;
            storedPrograms = programs;
            numRobots = programs.length;
            reset = false;
            simRobotType = robotType;
            userPrograms = programs;
            runRenderUntil = [];
            configurations = [];
            for (i = 0; i < programs.length; i++) {
                runRenderUntil[i] = 0;
            }
            if (robotType.indexOf("calliope") >= 0) {
                currentBackground = 0;
                $('.dropdown.sim, .simScene, #simImport, #simResetPose, #simButtonsHead').hide();
            } else if (robotType === 'microbit') {
                $('.dropdown.sim, .simScene, #simImport, #simResetPose, #simButtonsHead').hide();
                currentBackground = 1;
            } else if (currentBackground === 0 || currentBackground === 1) {
                currentBackground = 2;
            }
            if (currentBackground > 1) {
                if (isIE() || isEdge()) { // TODO IE and Edge: Input event not firing for file type of input
                    $('.dropdown.sim, .simScene').show();
                    $('#simImport').hide();
                } else {
                    $('.dropdown.sim, .simScene, #simImport, #simResetPose').show();
                }
                if ($('#device-size').find('div:visible').first().attr('id')) {
                    $('#simButtonsHead').show();
                }
            }

            // we do not allow picture uploads because users should not edit the provided maps
            // therefore this button has been disabled
            // Note: in theory a user with javascript knowledge could use this anyway
            $('#simImport').hide();

            interpreters = programs.map(function (x) {
                var src = JSON.parse(x.javaScriptProgram);
                configurations.push(x.javaScriptConfiguration);
                return new SIM_I.Interpreter(src, new MBED_R.RobotMbedBehaviour(), callbackOnTermination, breakpoints);
            });
            updateDebugMode(debugMode);

            isDownRobots = [];
            for (var i = 0; i < numRobots; i++) {
                isDownRobots.push(false);
            }
            if (refresh) {
                robotIndex = 0;
                robots = [];
                readyRobots = [];
                isDownRobots = [];
                require(['simulation.robot.' + simRobotType], function (reqRobot) {
                    createRobots(reqRobot, numRobots);
                    for (var i = 0; i < numRobots; i++) {
                        robots[i].reset();
                        robots[i].resetPose();
                        readyRobots.push(false);
                        isDownRobots.push(false);
                    }
                    removeMouseEvents();
                    canceled = false;
                    isDownObstacle = false;
                    isDownRuler = false;
                    stepCounter = 0;
                    pause = true;
                    info = false;
                    setObstacle();
                    setWaypoints();
                    setRuler();
                    initScene();

                });

            } else {
                for (var i = 0; i < numRobots; i++) {
                    robots[i].replaceState(interpreters[i].getRobotBehaviour());
                    if (robots[i].endless) {
                        robots[i].reset();
                    }
                }
                reloadProgram();
            }

            if(exports.goalReached) {
                exports.goalReached = false;
                resetPose();
            }


        }

        exports.init = init;

        function run(refresh, robotType) {
            init(storedPrograms, refresh, robotType);
        }

        exports.run = run;

        function getRobotIndex() {
            return robotIndex;
        }

        exports.getRobotIndex = getRobotIndex;

        function cancel() {
            canceled = true;
            removeMouseEvents();
        }

        exports.cancel = cancel;

        var reset = false;

        /*
         * The below Colors are picked from the toolkit and should be used to color
         * the robots
         */
        var colorsAdmissible = [
            [242, 148, 0],
            [143, 164, 2],
            [235, 106, 10],
            [51, 184, 202],
            [0, 90, 148],
            [186, 204, 30],
            [235, 195, 0],
            [144, 133, 186]
        ];

        function render() {
            if (canceled) {
                cancelAnimationFrame(globalID);
                return;
            }
            var actionValues = [];
            for (var i = 0; i < numRobots; i++) {
                actionValues.push({});
            }
            globalID = requestAnimationFrame(render);
            var now = new Date().getTime();
            var dtSim = now - (time || now);
            var dtRobot = Math.min(15, (dtSim - renderTime) / numRobots);
            var dtRobot = Math.abs(dtRobot);
            dt = dtSim / 1000;
            time = now;
            stepCounter += 1;

            for (var i = 0; i < numRobots; i++) {
                if (!robots[i].pause && !pause) {
                    if (!interpreters[i].isTerminated() && !reset) {
                        if (runRenderUntil[i] <= now) {
                            var delayMs = interpreters[i].run(now + dtRobot);
                            var nowNext = new Date().getTime();
                            runRenderUntil[i] = nowNext + delayMs;
                        }
                    } else if (reset || interpreters[i].isTerminated() && !robots[i].endless) {
                        reset = false;
                        robots[i].buttons.Reset = false;
                        removeMouseEvents();
                        robots[i].pause = true;
                        robots[i].reset();
                        scene.drawRobots();
                        scene.drawVariables();

                        // some time to cancel all timeouts
                        setTimeout(function () {
                            init(userPrograms, false, simRobotType);
                            addMouseEvents();
                        }, 205);

                        if (!(interpreters[i].isTerminated() && !robots[i].endless)) {
                            setTimeout(function () {
                                //delete robot.button.Reset;
                                setPause(false);
                                for (var i = 0; i < robots.length; i++) {
                                    robots[i].pause = false;
                                }
                            }, 1000);
                        }
                    }
                }
                robots[i].update();
                updateBreakpointEvent();
            }
            var renderTimeStart = new Date().getTime();

            function allPause() {
                for (var i = 0; i < robots.length; i++) {
                    if (!robots[i].pause) {
                        return false;
                    }
                }
                return true;
            }

            if (allPause()) {
                setPause(true);
                for (var i = 0; i < robots.length; i++) {
                    robots[i].pause = false;
                }
            }

            reset = robots[0].buttons.Reset;
            scene.updateSensorValues(!pause);
            scene.drawRobots();
            scene.drawVariables();
            renderTime = new Date().getTime() - renderTimeStart;
        }

        function reloadProgram() {
            $('.simForward').removeClass('typcn-media-pause');
            $('.simForward').addClass('typcn-media-play');
            $('#simControl').addClass('typcn-media-play-outline').removeClass('typcn-media-stop');
            $('#simControl').attr('data-original-title', Blockly.Msg.MENU_SIM_START_TOOLTIP);
        }

        function setObstacle() {

            // remove old values
            exports.goal = null;
            exports.switches = null;

            for (var i = obslist.length; i > 2; i--) {
                obslist.pop();
            }
            if (currentBackground == 3) {
                obstacle.x = 500;
                obstacle.y = 250;
                obstacle.w = 100;
                obstacle.h = 100;
                obstacle.img = null;
                obstacle.color = "#33B8CA";
            } else if (currentBackground == 2) {
                obstacle.x = 0;
                obstacle.y = 0;
                obstacle.w = 0;
                obstacle.h = 0;
                obstacle.img = null;
                obstacle.color = null;

                const obs = {
                    x: 10,
                    y: 10,
                    w: 50,
                    h: 50,
                    isParallelToAxis: true,
                    color: "#33B8CA"
                };

                obslist.push(obs);
            } else if (currentBackground == 4) {
                obstacle.x = 500;
                obstacle.y = 260;
                obstacle.w = 100;
                obstacle.h = 100;
                obstacle.img = imgObstacle1;
                obstacle.color = null;
            } else if (currentBackground == 7) {
                obstacle.x = 0;
                obstacle.y = 0;
                obstacle.w = 0;
                obstacle.h = 0;
                obstacle.color = null;
            } else if (currentBackground == 0) {
                obstacle.x = 0;
                obstacle.y = 0;
                obstacle.w = 0;
                obstacle.h = 0;
                obstacle.color = null;
                obstacle.img = null;
            } else if (currentBackground == 1) {
                obstacle.x = 0;
                obstacle.y = 0;
                obstacle.w = 0;
                obstacle.h = 0;
                obstacle.color = null;
                obstacle.img = null;
            } else if (currentBackground == 5) {
                obstacle.x = 505;
                obstacle.y = 405;
                obstacle.w = 20;
                obstacle.h = 20;
                obstacle.color = "#33B8CA";
                obstacle.img = null;
            } else if (currentBackground == 6) {
                obstacle.x = 425;
                obstacle.y = 254;
                obstacle.w = 50;
                obstacle.h = 50;
                obstacle.color = "#009EE3";
                obstacle.img = null;
            } else if (currentBackground == RR_LineFollowing_ES || currentBackground == RR_LineFollowing_MS || currentBackground == RR_LineFollowing_HS) {
                obstacle.x = 734;
                obstacle.y = 62;
                obstacle.w = 60;
                obstacle.h = 20;
                obstacle.color = "#F68712";
                obstacle.img = null;

                exports.goal = {
                    x: 40,
                    y: 460,
                    w: 60,
                    h: 20,
                    color: "#F68712",
                    time: 0,
                    reached: false
                };
            } else if (currentBackground === RR_Maze_ES) {
                obstacle.x = 700;
                obstacle.y = 100;
                obstacle.w = 5;
                obstacle.h = 450;
                obstacle.color = "#000000";
                var MazeObstacleList = [{ // add obstacles with lists like this
                    x: 500,
                    y: 100,
                    w: 200,
                    h: 5,
                    isParallelToAxis: true,
                    color: "#000000"
                }, {
                    x: 400,
                    y: 0,
                    w: 5,
                    h: 200,
                    isParallelToAxis: true,
                    color: "#000000"
                }, {
                    x: 400,
                    y: 200,
                    w: 200,
                    h: 5,
                    isParallelToAxis: true,
                    color: "#000000"
                }, {
                    x: 600,
                    y: 200,
                    w: 5,
                    h: 250,
                    isParallelToAxis: true,
                    color: "#000000"
                }, {
                    x: 400,
                    y: 450,
                    w: 200,
                    h: 5,
                    isParallelToAxis: true,
                    color: "#000000"
                }, {
                    x: 300,
                    y: 100,
                    w: 5,
                    h: 450,
                    isParallelToAxis: true,
                    color: "#000000"
                }, {
                    x: 300,
                    y: 300,
                    w: 200,
                    h: 50,
                    isParallelToAxis: true,
                    color: "#111111"
                }, {
                    x: 200,
                    y: 0,
                    w: 5,
                    h: 350,
                    isParallelToAxis: true,
                    color: "#000000"
                }, {
                    x: 100,
                    y: 450,
                    w: 200,
                    h: 5,
                    isParallelToAxis: true,
                    color: "#000000"
                }, {
                    x: 100,
                    y: 100,
                    w: 5,
                    h: 350,
                    isParallelToAxis: true,
                    color: "#000000"
                }];
                for (i = 0; i < MazeObstacleList.length; i++) {
                    obslist.push(MazeObstacleList[i]);
                }
                exports.goal = {
                    x: 200,
                    y: 450,
                    w: 100,
                    h: 100,
                    color: "#bb7700",
                    time: 0,
                    reached: false
                };
            } else if (currentBackground === RR_Maze_MS) {
                obstacle.x = 700;
                obstacle.y = 100;
                obstacle.w = 5;
                obstacle.h = 450;
                obstacle.color = "#000000";
                var MazeObstacleList = [{ // add obstacles with lists like this
                    x: 500,
                    y: 100,
                    w: 200,
                    h: 5,
                    isParallelToAxis: true,
                    color: "#000000"
                }, {
                    x: 400,
                    y: 0,
                    w: 5,
                    h: 200,
                    isParallelToAxis: true,
                    color: "#000000"
                }, {
                    x: 400,
                    y: 200,
                    w: 200,
                    h: 5,
                    isParallelToAxis: true,
                    color: "#000000"
                }, {
                    x: 600,
                    y: 200,
                    w: 5,
                    h: 250,
                    isParallelToAxis: true,
                    color: "#000000"
                }, {
                    x: 400,
                    y: 450,
                    w: 200,
                    h: 5,
                    isParallelToAxis: true,
                    color: "#000000"
                }, {
                    x: 300,
                    y: 100,
                    w: 5,
                    h: 450,
                    isParallelToAxis: true,
                    color: "#000000"
                }, {
                    x: 300,
                    y: 300,
                    w: 200,
                    h: 5,
                    isParallelToAxis: true,
                    color: "#000000"
                }, {
                    x: 400,
                    y: 300,
                    w: 100,
                    h: 50,
                    isParallelToAxis: true,
                    color: "#111111"
                }, {
                    x: 200,
                    y: 0,
                    w: 5,
                    h: 350,
                    isParallelToAxis: true,
                    color: "#000000"
                }, {
                    x: 100,
                    y: 450,
                    w: 200,
                    h: 5,
                    isParallelToAxis: true,
                    color: "#000000"
                }, {
                    x: 100,
                    y: 100,
                    w: 5,
                    h: 350,
                    isParallelToAxis: true,
                    color: "#000000"
                }];
                for (i = 0; i < MazeObstacleList.length; i++) {
                    obslist.push(MazeObstacleList[i]);
                }
                exports.goal = {
                    x: 200,
                    y: 450,
                    w: 100,
                    h: 100,
                    color: "#bb7700",
                    time: 0,
                    reached: false
                };
            } else if (currentBackground === RR_Maze_HS) {
                obstacle.x = 700;
                obstacle.y = 100;
                obstacle.w = 5;
                obstacle.h = 450;
                obstacle.color = "#000000";
                var MazeObstacleList = [{ // add obstacles with lists like this
                    x: 600,
                    y: 100,
                    w: 100,
                    h: 5,
                    isParallelToAxis: true,
                    color: "#000000"
                }, {
                    x: 400,
                    y: 100,
                    w: 100,
                    h: 5,
                    isParallelToAxis: true,
                    color: "#000000"
                }, {
                    x: 400,
                    y: 0,
                    w: 5,
                    h: 100,
                    isParallelToAxis: true,
                    color: "#000000"
                }, {
                    x: 500,
                    y: 100,
                    w: 5,
                    h: 100,
                    isParallelToAxis: true,
                    color: "#000000"
                }, {
                    x: 500,
                    y: 200,
                    w: 100,
                    h: 5,
                    isParallelToAxis: true,
                    color: "#000000"
                }, {
                    x: 600,
                    y: 200,
                    w: 5,
                    h: 250,
                    isParallelToAxis: true,
                    color: "#000000"
                }, {
                    x: 400,
                    y: 450,
                    w: 200,
                    h: 5,
                    isParallelToAxis: true,
                    color: "#000000"
                }, {
                    x: 300,
                    y: 100,
                    w: 5,
                    h: 450,
                    isParallelToAxis: true,
                    color: "#000000"
                }, {
                    x: 300,
                    y: 300,
                    w: 200,
                    h: 50,
                    isParallelToAxis: true,
                    color: "#111111"
                }, {
                    x: 300,
                    y: 200,
                    w: 100,
                    h: 5,
                    isParallelToAxis: true,
                    color: "#000000"
                }, {
                    x: 200,
                    y: 0,
                    w: 5,
                    h: 350,
                    isParallelToAxis: true,
                    color: "#000000"
                }, {
                    x: 100,
                    y: 450,
                    w: 200,
                    h: 5,
                    isParallelToAxis: true,
                    color: "#000000"
                }, {
                    x: 100,
                    y: 100,
                    w: 5,
                    h: 350,
                    isParallelToAxis: true,
                    color: "#000000"
                }];
                for (i = 0; i < MazeObstacleList.length; i++) {
                    obslist.push(MazeObstacleList[i]);
                }
                exports.goal = {
                    x: 200,
                    y: 450,
                    w: 100,
                    h: 100,
                    color: "#bb7700",
                    time: 0,
                    reached: false
                };
            } else if (currentBackground === RR_Rainbow_ES || currentBackground === RR_Rainbow_MS) {
                obstacle.x = 290;
                obstacle.y = 350;
                obstacle.w = 25;
                obstacle.h = 40;
                obstacle.color = "#444444";
                var MazeObstacleList = [{ // add obstacles with lists like this
                    x: 180,
                    y: 180,
                    w: 40,
                    h: 25,
                    isParallelToAxis: true,
                    color: "#444444"
                }, {
                    x: 760,
                    y: 170,
                    w: 25,
                    h: 40,
                    isParallelToAxis: true,
                    color: "#444444"
                }, {
                    x: 480,
                    y: 490,
                    w: 40,
                    h: 25,
                    isParallelToAxis: true,
                    color: "#444444"
                }];
                for (i = 0; i < MazeObstacleList.length; i++) {
                    obslist.push(MazeObstacleList[i]);
                }
            } else if (currentBackground === RR_Rainbow_HS) {
                obstacle.x = 288;
                obstacle.y = 408;
                obstacle.w = 15;
                obstacle.h = 20;
                obstacle.color = "#ff00ff";
                var MazeObstacleList = [{ // add obstacles with lists like this
                    x: 44,
                    y: 248,
                    w: 15,
                    h: 20,
                    isParallelToAxis: true,
                    color: "#ff00ff"
                }, {
                    x: 678,
                    y: 267,
                    w: 15,
                    h: 20,
                    isParallelToAxis: true,
                    color: "#ff00ff"
                }, {
                    x: 470,
                    y: 480,
                    w: 20,
                    h: 15,
                    isParallelToAxis: true,
                    color: "#ff00ff"
                }, {
                    x: 585,
                    y: 58,
                    w: 15,
                    h: 20,
                    isParallelToAxis: true,
                    color: "#ff00ff"
                }, {
                    x: 388,
                    y: 120,
                    w: 20,
                    h: 15,
                    isParallelToAxis: true,
                    color: "#ff00ff"
                }];
                for (i = 0; i < MazeObstacleList.length; i++) {
                    obslist.push(MazeObstacleList[i]);
                }
            } else {
                obstacle.x = 0;
                obstacle.y = 0;
                obstacle.w = 0;
                obstacle.h = 0;
                obstacle.color = null;
                obstacle.img = null;
            }
        }

        function setWaypoints() {
            exports.waypointData.waypointLists = [];
            exports.waypointData.waypointsRainbowMode = false;
            exports.waypointData.waypointsReverse = false;
            exports.goalNeedsWaypoint = false;
            exports.timeout = -1; // disable timeout

            switch (currentBackground) {
                case RR_LineFollowing_ES:
                    exports.waypointData.waypointLists = [
                        {
                            waypoints: [{
                                x: 35,
                                y: 235,
                                w: 80,
                                h: 20,
                                score: 50
                            }, {
                                x: 165,
                                y: 70,
                                w: 20,
                                h: 80,
                                score: 0
                            }, {
                                x: 700,
                                y: 280,
                                w: 50,
                                h: 50,
                                score: 50
                            }, {
                                x: 710,
                                y: 40,
                                w: 100,
                                h: 80,
                                score: 100
                            }],
                            currentWaypointIdx: -1,
                            done: false,
                        }
                    ]
                    exports.waypointData.waypointsReverse = true;
                    exports.goalNeedsWaypoint = true;
                    exports.timeout = 120;
                    break;
                case RR_LineFollowing_MS:
                    exports.waypointData.waypointLists = [
                        {
                            waypoints: [{
                                x: 35,
                                y: 350,
                                w: 80,
                                h: 20,
                                score: 25
                            }, {
                                x: 650,
                                y: 340,
                                w: 50,
                                h: 50,
                                score: 50
                            }, {
                                x: 730,
                                y: 230,
                                w: 50,
                                h: 50,
                                score: 25
                            }, {
                                x: 710,
                                y: 40,
                                w: 100,
                                h: 80,
                                score: 100
                            }],
                            currentWaypointIdx: -1,
                            done: false,
                        }
                    ]
                    exports.waypointData.waypointsReverse = true;
                    exports.goalNeedsWaypoint = true;
                    exports.timeout = 120;
                    break;
                case RR_LineFollowing_HS:
                    exports.waypointData.waypointLists = [
                        {
                            waypoints: [{
                                x: 35,
                                y: 350,
                                w: 80,
                                h: 20,
                                score: 25
                            }, {
                                x: 250,
                                y: 320,
                                w: 50,
                                h: 50,
                                score: 50
                            }, {
                                x: 650,
                                y: 330,
                                w: 50,
                                h: 50,
                                score: 50
                            },{
                                x: 730,
                                y: 230,
                                w: 50,
                                h: 50,
                                score: 25
                            },  {
                                x: 710,
                                y: 40,
                                w: 100,
                                h: 80,
                                score: 50
                            }],
                            currentWaypointIdx: -1,
                            done: false,
                        }
                    ]
                    exports.waypointData.waypointsReverse = true;
                    exports.goalNeedsWaypoint = true;
                    exports.timeout = 120;
                    break;
                case RR_Maze_ES:
                case RR_Maze_MS:
                    exports.waypointData.waypointLists = [
                        {
                            waypoints: [
                                {
                                    x: 700,
                                    y: 0,
                                    w: 100,
                                    h: 100,
                                    score: 10
                                },{
                                    x: 400,
                                    y: 0,
                                    w: 100,
                                    h: 100,
                                    score: 10
                                },{
                                    x: 400,
                                    y: 100,
                                    w: 100,
                                    h: 100,
                                    score: 10
                                },{
                                    x: 600,
                                    y: 100,
                                    w: 100,
                                    h: 100,
                                    score: 10
                                },{
                                    x: 600,
                                    y: 440,
                                    w: 100,
                                    h: 100,
                                    score: 10
                                },{
                                    x: 300,
                                    y: 440,
                                    w: 100,
                                    h: 100,
                                    score: 10
                                },{
                                    x: 300,
                                    y: 340,
                                    w: 100,
                                    h: 100,
                                    score: 10
                                },{
                                    x: 500,
                                    y: 340,
                                    w: 100,
                                    h: 100,
                                    score: 10
                                },{
                                    x: 500,
                                    y: 200,
                                    w: 100,
                                    h: 100,
                                    score: 10
                                },{
                                    x: 300,
                                    y: 200,
                                    w: 100,
                                    h: 100,
                                    score: 10
                                },{
                                    x: 300,
                                    y: 0,
                                    w: 100,
                                    h: 100,
                                    score: 10
                                },{
                                    x: 200,
                                    y: 0,
                                    w: 100,
                                    h: 100,
                                    score: 10
                                },{
                                    x: 200,
                                    y: 340,
                                    w: 100,
                                    h: 100,
                                    score: 10
                                },{
                                    x: 100,
                                    y: 340,
                                    w: 100,
                                    h: 100,
                                    score: 10
                                },{
                                    x: 100,
                                    y: 0,
                                    w: 100,
                                    h: 100,
                                    score: 10
                                },{
                                    x: 0,
                                    y: 0,
                                    w: 100,
                                    h: 100,
                                    score: 10
                                },{
                                    x: 0,
                                    y: 440,
                                    w: 100,
                                    h: 100,
                                    score: 10
                                }
                            ],
                            currentWaypointIdx: -1,
                            done: false,
                        }
                    ]
                    exports.goalNeedsWaypoint = true;
                    exports.timeout = 120;
                    break;
                case RR_Maze_HS:
                    exports.waypointData.waypointLists = [
                        {
                            waypoints: [
                                {
                                    x: 700,
                                    y: 0,
                                    w: 100,
                                    h: 100,
                                    score: 10
                                },{
                                    x: 500,
                                    y: 0,
                                    w: 100,
                                    h: 100,
                                    score: 10
                                },{
                                    x: 500,
                                    y: 100,
                                    w: 100,
                                    h: 100,
                                    score: 10
                                },{
                                    x: 600,
                                    y: 100,
                                    w: 100,
                                    h: 100,
                                    score: 10
                                },{
                                    x: 600,
                                    y: 440,
                                    w: 100,
                                    h: 100,
                                    score: 10
                                },{
                                    x: 300,
                                    y: 440,
                                    w: 100,
                                    h: 100,
                                    score: 10
                                },{
                                    x: 300,
                                    y: 340,
                                    w: 100,
                                    h: 100,
                                    score: 10
                                },{
                                    x: 500,
                                    y: 340,
                                    w: 100,
                                    h: 100,
                                    score: 10
                                },{
                                    x: 500,
                                    y: 200,
                                    w: 100,
                                    h: 100,
                                    score: 10
                                },{
                                    x: 400,
                                    y: 200,
                                    w: 100,
                                    h: 100,
                                    score: 10
                                },{
                                    x: 400,
                                    y: 100,
                                    w: 100,
                                    h: 100,
                                    score: 10
                                },{
                                    x: 300,
                                    y: 100,
                                    w: 100,
                                    h: 100,
                                    score: 10
                                },{
                                    x: 300,
                                    y: 0,
                                    w: 100,
                                    h: 100,
                                    score: 10
                                },{
                                    x: 200,
                                    y: 0,
                                    w: 100,
                                    h: 100,
                                    score: 10
                                },{
                                    x: 200,
                                    y: 340,
                                    w: 100,
                                    h: 100,
                                    score: 10
                                },{
                                    x: 100,
                                    y: 340,
                                    w: 100,
                                    h: 100,
                                    score: 10
                                },{
                                    x: 100,
                                    y: 0,
                                    w: 100,
                                    h: 100,
                                    score: 10
                                },{
                                    x: 0,
                                    y: 0,
                                    w: 100,
                                    h: 100,
                                    score: 10
                                },{
                                    x: 0,
                                    y: 440,
                                    w: 100,
                                    h: 100,
                                    score: 10
                                }
                            ],
                            currentWaypointIdx: -1,
                            done: false,
                        }
                    ]
                    exports.goalNeedsWaypoint = true;
                    exports.timeout = 120;
                    break;
                case RR_Rainbow_ES:
                case RR_Rainbow_MS:
                    exports.waypointData.waypointLists = [
                        {
                            waypoints: [
                                {
                                    x: 270,
                                    y: 250,
                                    w: 40,
                                    h: 40,
                                    score: 10
                                },
                                {
                                    x: 170,
                                    y: 195,
                                    w: 40,
                                    h: 40,
                                    score: 10
                                }
                            ],
                            currentWaypointIdx: -1,
                            done: false,
                        },
                        {
                            waypoints: [
                                {
                                    x: 390,
                                    y: 340,
                                    w: 40,
                                    h: 40,
                                    score: 10
                                },
                                {
                                    x: 230,
                                    y: 340,
                                    w: 40,
                                    h: 40,
                                    score: 10
                                }
                            ],
                            currentWaypointIdx: -1,
                            done: false,
                        },
                        {
                            waypoints: [
                                {
                                    x: 390,
                                    y: 160,
                                    w: 40,
                                    h: 40,
                                    score: 10
                                },
                                {
                                    x: 680,
                                    y: 165,
                                    w: 40,
                                    h: 40,
                                    score: 10
                                }
                            ],
                            currentWaypointIdx: -1,
                            done: false,
                        },
                        {
                            waypoints: [
                                {
                                    x: 485,
                                    y: 250,
                                    w: 40,
                                    h: 40,
                                    score: 10
                                },
                                {
                                    x: 470,
                                    y: 440,
                                    w: 40,
                                    h: 40,
                                    score: 10
                                }
                            ],
                            currentWaypointIdx: -1,
                            done: false,
                        }
                    ]
                    exports.waypointData.waypointsReverse = true;
                    exports.waypointData.waypointsRainbowMode = true;
                    exports.timeout = 180;
                    exports.rainbowColor = [
                        "#e40303ff",
                        "#ffed00ff",
                        "#008026ff",
                        "#004dffff"
                    ]
                    break;
                case RR_Rainbow_HS:
                    exports.waypointData.waypointLists = [{
                        waypoints: [
                            {
                                x: 345,
                                y: 385,
                                w: 20,
                                h: 20,
                                score: 10
                            },
                            {
                                x: 245,
                                y: 403,
                                w: 20,
                                h: 20,
                                score: 10
                            }
                        ],
                        currentWaypointIdx: -1,
                        done: false,
                    },
                        {
                            waypoints: [
                                {
                                    x: 470,
                                    y: 363,
                                    w: 20,
                                    h: 20,
                                    score: 10
                                },
                                {
                                    x: 470,
                                    y: 450,
                                    w: 20,
                                    h: 20,
                                    score: 10
                                }
                            ],
                            currentWaypointIdx: -1,
                            done: false,
                        },
                        {
                            waypoints: [
                                {
                                    x: 490,
                                    y: 265,
                                    w: 20,
                                    h: 20,
                                    score: 10
                                },
                                {
                                    x: 660,
                                    y: 265,
                                    w: 20,
                                    h: 20,
                                    score: 10
                                }
                            ],
                            currentWaypointIdx: -1,
                            done: false,
                        },
                        {
                            waypoints: [
                                {
                                    x: 445,
                                    y: 175,
                                    w: 20,
                                    h: 20,
                                    score: 10
                                },
                                {
                                    x: 565,
                                    y: 57,
                                    w: 20,
                                    h: 20,
                                    score: 10
                                }
                            ],
                            currentWaypointIdx: -1,
                            done: false,
                        },
                        {
                            waypoints: [
                                {
                                    x: 310,
                                    y: 175,
                                    w: 20,
                                    h: 20,
                                    score: 10
                                },
                                {
                                    x: 382,
                                    y: 95,
                                    w: 20,
                                    h: 20,
                                    score: 10
                                }
                            ],
                            currentWaypointIdx: -1,
                            done: false,
                        },
                        {
                            waypoints: [
                                {
                                    x: 278,
                                    y: 263,
                                    w: 20,
                                    h: 20,
                                    score: 10
                                },
                                {
                                    x: 64,
                                    y: 245,
                                    w: 20,
                                    h: 20,
                                    score: 10
                                }
                            ],
                            currentWaypointIdx: -1,
                            done: false,
                        }]
                    exports.waypointData.waypointsReverse = true;
                    exports.waypointData.waypointsRainbowMode = true;
                    exports.timeout = 240;
                    exports.rainbowColor = [
                        "#e40303ff",
                        "#ff8c00ff",
                        "#ffed00ff",
                        "#008026ff",
                        "#004dffff",
                        "#750787ff"
                    ]
                    break;
                default:
                    break;
            }
        }


        function setRuler() {
            if (currentBackground == 4) {
                ruler.x = 430;
                ruler.y = 400;
                ruler.w = 300;
                ruler.h = 30;
                ruler.img = imgRuler;
                ruler.color = null;
                //} else if (currentBackground == RR_LineFollowing_ES) {
                //    ruler.x = 200;
                //    ruler.y = 200;
                //    ruler.w = 300;
                //    ruler.h = 30;
                //    ruler.img = imgRuler;
                //    ruler.color = null;
            } else {
                // All other scenes currently don't have a movable ruler.
                ruler.x = 0;
                ruler.y = 0;
                ruler.w = 0;
                ruler.h = 0;
                ruler.img = null;
                ruler.color = null;
            }
        }

        function isAnyRobotDown() {
            for (var i = 0; i < numRobots; i++) {
                if (isDownRobots[i]) {
                    return true;
                }
            }
            return false;
        }

        function handleKeyEvent(e) {
            var keyName = e.key;
            switch (keyName) {
                case "ArrowUp":
                    robots[robotIndex].pose.x += Math.cos(robots[robotIndex].pose.theta);
                    robots[robotIndex].pose.y += Math.sin(robots[robotIndex].pose.theta);
                    break;
                case "ArrowLeft":
                    robots[robotIndex].pose.theta -= Math.PI / 180;
                    break;
                case "ArrowDown":
                    robots[robotIndex].pose.x -= Math.cos(robots[robotIndex].pose.theta);
                    robots[robotIndex].pose.y -= Math.sin(robots[robotIndex].pose.theta);
                    break;
                case "ArrowRight":
                    robots[robotIndex].pose.theta += Math.PI / 180;
                    break;
                default:
                // nothing to do so far
            }
        }

        function handleMouseDown(e) {
            var X = e.clientX || e.originalEvent.touches[0].pageX;
            var Y = e.clientY || e.originalEvent.touches[0].pageY;
            var scsq = 1;
            if (scale < 1)
                scsq = scale * scale;
            var top = $('#robotLayer').offset().top;
            var left = $('#robotLayer').offset().left;
            startX = (parseInt(X - left, 10)) / scale;
            startY = (parseInt(Y - top, 10)) / scale;
            var dx;
            var dy;
            for (var i = 0; i < numRobots; i++) {
                dx = startX - robots[i].mouse.rx;
                dy = startY - robots[i].mouse.ry;
                var boolDown = (dx * dx + dy * dy < robots[i].mouse.r * robots[i].mouse.r);
                isDownRobots[i] = boolDown;
                if (boolDown) {
                    mouseOnRobotIndex = i;
                }
            }
            /*
            for (var i = 1; i < obslist.length; i++) {
                isDownObstacle = (startX > obslist[i].x && startX < obslist[i].x + obslist[i].w && startY > obslist[i].y && startY < obslist[i].y + obslist[i].h);
                if (isDownObstacle) {
                    break;
                }
            }*/

            isDownObstacle = false;
            isDownRuler = (startX > ruler.x && startX < ruler.x + ruler.w && startY > ruler.y && startY < ruler.y + ruler.h);
            if (isDownRobots || isDownObstacle || isDownRuler || isAnyRobotDown()) {
                e.stopPropagation();
            }
        }

        function handleDoubleMouseClick(e) {
            if (numRobots > 1) {
                var X = e.clientX || e.originalEvent.touches[0].pageX;
                var Y = e.clientY || e.originalEvent.touches[0].pageY;
                var dx;
                var dy;
                var top = $('#robotLayer').offset().top;
                var left = $('#robotLayer').offset().left;
                startX = (parseInt(X - left, 10)) / scale;
                startY = (parseInt(Y - top, 10)) / scale;
                for (var i = 0; i < numRobots; i++) {
                    dx = startX - robots[i].mouse.rx;
                    dy = startY - robots[i].mouse.ry;
                    var boolDown = (dx * dx + dy * dy < robots[i].mouse.r * robots[i].mouse.r);
                    if (boolDown) {
                        $("#brick" + robotIndex).hide();
                        robotIndex = i;
                        $("#brick" + robotIndex).show();
                        $("#robotIndex")[0][i].selected = true;
                        break;
                    }
                }
            }
        }

        function handleMouseUp(e) {
            $("#robotLayer").css('cursor', 'auto');
            if (mouseOnRobotIndex >= 0 && robots[mouseOnRobotIndex].drawWidth) {
                robots[mouseOnRobotIndex].canDraw = true;
            }
            isDownObstacle = false;
            isDownRuler = false;
            for (var i = 0; i < numRobots; i++) {
                if (isDownRobots[i]) {
                    isDownRobots[i] = false;
                }
            }
            mouseOnRobotIndex = -1;
        }

        function handleMouseOut(e) {
            e.preventDefault();
            isDownObstacle = false;
            isDownRuler = false;
            for (var i = 0; i < numRobots; i++) {
                if (isDownRobots[i]) {
                    isDownRobots[i] = false;
                }
            }
            mouseOnRobotIndex = -1;
            e.stopPropagation();
        }

        function handleMouseMove(e) {
            var X = e.clientX || e.originalEvent.touches[0].pageX;
            var Y = e.clientY || e.originalEvent.touches[0].pageY;
            var top = $('#robotLayer').offset().top;
            var left = $('#robotLayer').offset().left;
            mouseX = (parseInt(X - left, 10)) / scale;
            mouseY = (parseInt(Y - top, 10)) / scale;
            var dx;
            var dy;
            if (!isAnyRobotDown() && !isDownObstacle && !isDownRuler) {
                var hoverRobot = false;
                for (var i = 0; i < numRobots; i++) {
                    dx = mouseX - robots[i].mouse.rx;
                    dy = mouseY - robots[i].mouse.ry;
                    var tempcheckhover = (dx * dx + dy * dy < robots[i].mouse.r * robots[i].mouse.r);
                    if (tempcheckhover) {
                        hoverRobot = true;
                        break;
                    }
                }
                var hoverRuler = (mouseX > ruler.x && mouseX < ruler.x + ruler.w && mouseY > ruler.y && mouseY < ruler.y + ruler.h);
                if (hoverRobot || hoverRuler)
                    $("#robotLayer").css('cursor', 'pointer');
                var hoverObstacle = false;
                /*for (var i = 1; i < obslist.length; i++) {
                    hoverObstacle = (mouseX > obslist[i].x && mouseX < obslist[i].x + obslist[i].w && mouseY > obslist[i].y && mouseY < obslist[i].y + obslist[i].h);
                    if (hoverObstacle) {
                        $("#robotLayer").css('cursor', 'pointer');
                        hoverindex = i;
                        return;
                    }
                    hoverindex = 0;
                }*/
                $("#robotLayer").css('cursor', 'auto');
                return;
            }
            $("#robotLayer").css('cursor', 'pointer');
            dx = (mouseX - startX);
            dy = (mouseY - startY);
            startX = mouseX;
            startY = mouseY;
            if (isAnyRobotDown()) {
                if (robots[mouseOnRobotIndex].drawWidth) {
                    robots[mouseOnRobotIndex].canDraw = false;
                }
                robots[mouseOnRobotIndex].pose.xOld = robots[mouseOnRobotIndex].pose.x;
                robots[mouseOnRobotIndex].pose.yOld = robots[mouseOnRobotIndex].pose.y;
                robots[mouseOnRobotIndex].pose.x += dx;
                robots[mouseOnRobotIndex].pose.y += dy;
                robots[mouseOnRobotIndex].mouse.rx += dx;
                robots[mouseOnRobotIndex].mouse.ry += dy;
            } else if (isDownObstacle) {
                obslist[hoverindex].x += dx;
                obslist[hoverindex].y += dy;
                scene.drawObjects();
            } else if (isDownRuler) {
                ruler.x += dx;
                ruler.y += dy;
                scene.drawRuler();
            }
        }

        var dist = 0;

        function handleMouseWheel(e) {
            var delta = 0;
            if (e.originalEvent.wheelDelta !== undefined) {
                delta = e.originalEvent.wheelDelta;
            } else {
                if (e.originalEvent.touches) {
                    if (e.originalEvent.touches[0] && e.originalEvent.touches[1]) {
                        var diffX = e.originalEvent.touches[0].pageX - e.originalEvent.touches[1].pageX;
                        var diffY = e.originalEvent.touches[0].pageY - e.originalEvent.touches[1].pageY;
                        var newDist = diffX * diffX + diffY * diffY;
                        if (dist == 0) {
                            dist = newDist;
                            return;
                        } else {
                            delta = newDist - dist;
                            dist = newDist;
                        }
                    } else {
                        dist = 0;
                        return;
                    }
                } else {
                    delta = -e.originalEvent.deltaY;
                }
            }
            var zoom = false;
            if (delta > 0) {
                scale *= 1.025;
                if (scale > 2) {
                    scale = 2;
                }
                zoom = true;
            } else if (delta < 0) {
                scale *= 0.925;
                if (scale < 0.25) {
                    scale = 0.25;
                }
                zoom = true;
            }
            if (zoom) {
                scene.drawBackground();
                scene.drawRuler();
                scene.drawObjects();
                e.stopPropagation();
            }
        }

        function resizeAll() {
            if (!canceled) {
                canvasOffset = $("#simDiv").offset();
                offsetX = canvasOffset.left;
                offsetY = canvasOffset.top;
                scene.playground.w = $('#simDiv').outerWidth();
                scene.playground.h = $(window).height() - offsetY;
                ground.x = 10;
                ground.y = 10;
                ground.w = imgObjectList[currentBackground].width;
                ground.h = imgObjectList[currentBackground].height;
                var scaleX = scene.playground.w / (ground.w + 20);
                var scaleY = scene.playground.h / (ground.h + 20);
                scale = Math.min(scaleX, scaleY) - 0.05;
                scene.updateBackgrounds();
                scene.drawObjects();
                scene.drawRuler();
            }
        }

        function addMouseEvents() {
            $("#robotLayer").on('mousedown touchstart', function (e) {
                if (robots[robotIndex].handleMouseDown) {
                    robots[robotIndex].handleMouseDown(e, offsetX, offsetY, scale, scene.playground.w / 2, scene.playground.h / 2);
                } else {
                    handleMouseDown(e);
                }
            });
            $("#robotLayer").on('mousemove touchmove', function (e) {
                if (robots[robotIndex].handleMouseMove) {
                    robots[robotIndex].handleMouseMove(e, offsetX, offsetY, scale, scene.playground.w / 2, scene.playground.h / 2);
                } else {
                    handleMouseMove(e);
                }
            });
            $("#robotLayer").mouseup(function (e) {
                if (robots[robotIndex].handleMouseUp) {
                    robots[robotIndex].handleMouseUp(e, offsetX, offsetY, scale, scene.playground.w / 2, scene.playground.h / 2);
                } else {
                    handleMouseUp(e);
                }
            });
            $("#robotLayer").on('mouseout touchcancel', function (e) {
                if (robots[robotIndex].handleMouseOut) {
                    robots[robotIndex].handleMouseOut(e, offsetX, offsetY, scene.playground.w / 2, scene.playground.h / 2);
                } else {
                    handleMouseOut(e);
                }
            });
            $("#simDiv").on('wheel mousewheel touchmove', function (e) {
                handleMouseWheel(e);
            });
            $("#canvasDiv").draggable();
            $("#robotLayer").on("dblclick", function (e) {
                handleDoubleMouseClick(e);
            });
            $(document).on('keydown', function (e) {
                handleKeyEvent(e);
            });
            $("#robotIndex").change(function (e) {
                $("#brick" + robotIndex).hide();
                robotIndex = e.target.selectedIndex;
                $("#brick" + robotIndex).show();
            }).change();
        }

        function removeMouseEvents() {
            $("#robotLayer").off();
            $("#simDiv").off();
            $("#canvasDiv").off();
            $(document).unbind('keydown', handleKeyEvent);
            $("#simRobotModal").off();
            $("#robotIndex").unbind('change');
        }

        function initScene() {
            if (randomImageObjectList[currentBackground].length !== 0) {
                scene = new Scene(getrandomObject(), robots, imgPattern, ruler, imgGoal);
            } else {
                scene = new Scene(imgObjectList[currentBackground], robots, imgPattern, ruler, imgGoal);
            }
            scene.updateBackgrounds();
            scene.drawObjects();
            scene.drawRuler();
            scene.drawRobots();
            scene.drawVariables();
            addMouseEvents();
            for (var i = 0; i < numRobots; i++) {
                readyRobots[i] = true;
            }
            resizeAll();
            $(window).on("resize", resizeAll);
            $('#backgroundDiv').on("resize", resizeAll);
            render();
        }

        function getScale() {
            return scale;
        }

        exports.getScale = getScale;

        function getInfo() {
            return info;
        }

        exports.getInfo = getInfo;

        function isIE() {
            var ua = window.navigator.userAgent;
            var ie = ua.indexOf('MSIE ');
            var ie11 = ua.indexOf('Trident/');

            if ((ie > -1) || (ie11 > -1)) {
                return true;
            }
            return false;
        }

        function isEdge() {
            var ua = window.navigator.userAgent;
            var edge = ua.indexOf('Edge');
            return edge > -1;
        }

        function importImage() {
            $('#backgroundFileSelector').val(null);
            $('#backgroundFileSelector').attr("accept", ".png, .jpg, .jpeg, .svg");
            $('#backgroundFileSelector').trigger('click'); // opening dialog
            $('#backgroundFileSelector').change(function (event) {
                var file = event.target.files[0];
                var reader = new FileReader();
                reader.onload = function (event) {
                    var img = new Image();
                    img.onload = function () {
                        var canvas = document.createElement("canvas");
                        var scaleX = 1;
                        var scaleY = 1;
                        // - 20 because of the border pattern which is 10 pixels wide on both sides
                        if (img.width > C.MAX_WIDTH - 20) {
                            scaleX = (C.MAX_WIDTH - 20) / img.width;
                        }
                        if (img.height > C.MAX_HEIGHT - 20) {
                            scaleY = (C.MAX_HEIGHT - 20) / img.height;
                        }
                        var scale = Math.min(scaleX, scaleY);
                        canvas.width = img.width * scale;
                        canvas.height = img.height * scale;
                        var ctx = canvas.getContext("2d");
                        ctx.scale(scale, scale);
                        ctx.drawImage(img, 0, 0);
                        var dataURL = canvas.toDataURL("image/png");
                        var image = new Image(canvas.width, canvas.height);
                        image.src = dataURL;
                        image.onload = function () {
                            if (customBackgroundLoaded) {
                                // replace previous image
                                imgObjectList[imgObjectList.length - 1] = image;
                            } else {
                                imgObjectList[imgObjectList.length] = image;
                            }
                            setBackground(imgObjectList.length - 1, setBackground);
                            initScene();
                        }

                        if (UTIL.isLocalStorageAvailable()) {
                            $('#show-message-confirm').one('shown.bs.modal', function (e) {
                                $('#confirm').off();
                                $('#confirm').on('click', function (e) {
                                    e.preventDefault();
                                    localStorage.setItem("customBackground", JSON.stringify({
                                        image: dataURL.replace(/^data:image\/(png|jpg);base64,/, ""),
                                        timestamp: new Date().getTime()
                                    }));
                                });
                                $('#confirmCancel').off();
                                $('#confirmCancel').on('click', function (e) {
                                    e.preventDefault();
                                });
                            });
                            MSG.displayPopupMessage("Blockly.Msg.POPUP_BACKGROUND_STORAGE", Blockly.Msg.POPUP_BACKGROUND_STORAGE, Blockly.Msg.YES, Blockly.Msg.NO);
                        }
                    };
                    img.src = reader.result;
                };
                reader.readAsDataURL(file);
                return false;
            });
        }

        exports.importImage = importImage;

        function arrToRgb(values) {
            return 'rgb(' + values.join(', ') + ')';
        }

        function createRobots(reqRobot, numRobots) {
            $("#simRobotContent").empty();
            $("#simRobotModal").modal("hide");
            robots = [];
            if (numRobots >= 1) {
                var tempRobot = createRobot(reqRobot, configurations[0], 0, 0, interpreters[0].getRobotBehaviour());
                tempRobot.savedName = userPrograms[0].savedName;
                robots[0] = tempRobot;
                if (robots[0].brick) {
                    $("#simRobotContent").append(robots[0].brick);
                }
                for (var i = 1; i < numRobots; i++) {
                    var yOffset = 60 * (Math.floor((i + 1) / 2)) * (Math.pow((-1), i));
                    tempRobot = createRobot(reqRobot, configurations[i], i, yOffset, interpreters[i].getRobotBehaviour());
                    tempRobot.savedName = userPrograms[i].savedName;
                    var tempcolor = arrToRgb(colorsAdmissible[((i - 1) % (colorsAdmissible.length))]);
                    tempRobot.geom.color = tempcolor;
                    tempRobot.touchSensor.color = tempcolor;
                    robots[i] = tempRobot;
                    if (robots[i].brick) {
                        $("#simRobotContent").append(robots[i].brick);
                        $("#brick" + i).hide();
                    }
                }
            } else {
                // should not happen
                // TODO throw exception
            }
        }

        function createRobot(reqRobot, configuration, num, optYOffset, robotBehaviour) {
            var yOffset = optYOffset || 0;
            var robot;
            if (currentBackground == 2) {
                robot = new reqRobot({
                    x: 240,
                    y: 200 + yOffset,
                    theta: 0,
                    xOld: 240,
                    yOld: 200 + yOffset,
                    transX: 0,
                    transY: 0
                }, configuration, num, robotBehaviour);
                robot.canDraw = false;
            } else if (currentBackground == 3) {
                robot = new reqRobot({
                    x: 200,
                    y: 200 + yOffset,
                    theta: 0,
                    xOld: 200,
                    yOld: 200 + yOffset,
                    transX: 0,
                    transY: 0
                }, configuration, num, robotBehaviour);
                robot.canDraw = true;
                robot.drawColor = "#000000";
                robot.drawWidth = 10;
            } else if (currentBackground == 4) {
                var robotY = 104 + yOffset;
                if (num >= 2) {
                    robotY = 104 + 60 * (num - 1);
                }
                robot = new reqRobot({
                    x: 70,
                    y: robotY,
                    theta: 0,
                    xOld: 70,
                    yOld: 104 + yOffset,
                    transX: 0,
                    transY: 0
                }, configuration, num, robotBehaviour);
                robot.canDraw = false;
            } else if (currentBackground == 5) {
                robot = new reqRobot({
                    x: 400,
                    y: 50 + 60 * num,
                    theta: 0,
                    xOld: 400,
                    yOld: 50 + yOffset,
                    transX: 0,
                    transY: 0
                }, configuration, num, robotBehaviour);
                robot.canDraw = false;
            } else if (currentBackground == 6) {
                var robotY = 440 + yOffset;
                if (num > 2) {
                    robotY = 440 - 60 * (num - 1);
                }
                robot = new reqRobot({
                    x: 800,
                    y: robotY,
                    theta: -Math.PI / 2,
                    xOld: 800,
                    yOld: 440 + yOffset,
                    transX: 0,
                    transY: 0
                }, configuration, num, robotBehaviour);
                robot.canDraw = false;
            } else if (currentBackground == 7) {
                var cx = imgObjectList[currentBackground].width / 2.0 + 10;
                var cy = imgObjectList[currentBackground].height / 2.0 + 10;
                robot = new reqRobot({
                    x: cx,
                    y: cy + yOffset,
                    theta: 0,
                    xOld: cx,
                    yOld: cy + yOffset,
                    transX: -cx,
                    transY: -cy
                }, configuration, num, robotBehaviour);
                robot.canDraw = true;
                robot.drawColor = "#ffffff";
                robot.drawWidth = 1;
            } else if (currentBackground == RR_LineFollowing_ES || currentBackground == RR_LineFollowing_MS || currentBackground == RR_LineFollowing_HS) {
                var cx = 71;
                var cy = 420;
                robot = new reqRobot({
                    x: cx,
                    y: cy + yOffset,
                    theta: -Math.PI / 2,
                    xOld: cx,
                    yOld: cy + yOffset,
                    transX: -cx,
                    transY: -cy
                }, configuration, num, robotBehaviour);
                robot.canDraw = false;
            } else if (currentBackground == RR_Maze_ES || currentBackground === RR_Maze_MS || currentBackground === RR_Maze_HS) {
                var cx = 760;
                var cy = 490;
                robot = new reqRobot({
                    x: cx,
                    y: cy + yOffset,
                    theta: -Math.PI / 2,
                    xOld: cx,
                    yOld: cy + yOffset,
                    transX: -cx,
                    transY: -cy
                }, configuration, num, robotBehaviour);
                robot.canDraw = false;
            } else if (currentBackground == RR_Rainbow_ES || currentBackground == RR_Rainbow_MS || currentBackground == RR_Rainbow_HS) {
                var cx = 410;
                var cy = 270;
                robot = new reqRobot({
                    x: cx,
                    y: cy + yOffset,
                    theta: -Math.PI / 2,
                    xOld: cx,
                    yOld: cy + yOffset,
                    transX: -cx,
                    transY: -cy
                }, configuration, num, robotBehaviour);
                robot.canDraw = true;
                robot.drawColor = "#00ffff";
                robot.drawWidth = 1;
            } else {
                var cx = imgObjectList[currentBackground].width / 2.0 + 10;
                var cy = imgObjectList[currentBackground].height / 2.0 + 10;
                robot = new reqRobot({
                    x: cx,
                    y: cy + yOffset,
                    theta: 0,
                    xOld: cx,
                    yOld: cy + yOffset,
                    transX: 0,
                    transY: 0
                }, configuration, num, robotBehaviour);
                robot.canDraw = false;
            }
            return robot;
        }

        function getWebAudio() {
            if (!this.webAudio) {
                this.webAudio = {};
                var AudioContext = window.AudioContext || window.webkitAudioContext || false;
                if (AudioContext) {
                    this.webAudio.context = new AudioContext();
                } else {
                    this.webAudio.context = null;
                    this.webAudio.oscillator = null;
                    console.log("Sorry, but the Web Audio API is not supported by your browser. Please, consider upgrading to the latest version or downloading Google Chrome or Mozilla Firefox");
                }
            }
            return this.webAudio;
        }

        exports.getWebAudio = getWebAudio;

        function updateBreakpointEvent() {
            if (debugMode) {
                Blockly.getMainWorkspace().getAllBlocks().forEach(function (block) {
                    if (!$(block.svgGroup_).hasClass('blocklyDisabled')) {

                        if (observers.hasOwnProperty(block.id)) {
                            observers[block.id].disconnect();
                        }

                        var observer = new MutationObserver(function (mutations) {
                            mutations.forEach((mutation) => {
                                if ($(block.svgGroup_).hasClass('blocklyDisabled')) {
                                    removeBreakPoint(block);
                                    $(block.svgPath_).removeClass('breakpoint').removeClass('selectedBreakpoint');
                                } else {
                                    if ($(block.svgGroup_).hasClass('blocklySelected')) {
                                        if ($(block.svgPath_).hasClass('breakpoint')) {
                                            removeBreakPoint(block);
                                            $(block.svgPath_).removeClass('breakpoint');
                                        } else if ($(block.svgPath_).hasClass('selectedBreakpoint')) {
                                            removeBreakPoint(block);
                                            $(block.svgPath_).removeClass('selectedBreakpoint').addClass('highlight');
                                        } else {
                                            addBreakPoint(block);
                                            if ($(block.svgPath_).hasClass('highlight')) {
                                                $(block.svgPath_).addClass('selectedBreakpoint')
                                            } else {
                                                $(block.svgPath_).addClass('breakpoint');
                                            }
                                        }
                                    }
                                }
                            });
                        });
                        observers[block.id] = observer;
                        observer.observe(block.svgGroup_, {attributes: true});

                    }
                });
            } else {
                Blockly.getMainWorkspace().getAllBlocks().forEach(function (block) {
                    if (observers.hasOwnProperty(block.id)) {
                        observers[block.id].disconnect();
                    }
                    $(block.svgPath_).removeClass('breakpoint');
                })
            }
        }

        function updateDebugMode(mode) {
            debugMode = mode;
            if (interpreters !== null) {
                for (var i = 0; i < numRobots; i++) {
                    interpreters[i].setDebugMode(mode);
                }
            }
            updateBreakpointEvent();


        }

        exports.updateDebugMode = updateDebugMode;

        function addBreakPoint(block) {
            breakpoints.push(block.id);
        }

        exports.addBreakPoint = addBreakPoint;

        function removeBreakPoint(block) {
            for (var i = 0; i < breakpoints.length; i++) {
                if (breakpoints[i] === block.id) {
                    breakpoints.splice(i, 1);
                }
            }
            if (!breakpoints.length > 0) {
                if (interpreters !== null) {
                    for (var i = 0; i < numRobots; i++) {
                        interpreters[i].removeEvent(CONST.DEBUG_BREAKPOINT);
                    }
                }
            }
        }

        exports.removeBreakPoint = removeBreakPoint;

        function interpreterAddEvent(mode) {
            updateBreakpointEvent();
            if (interpreters !== null) {
                for (var i = 0; i < numRobots; i++) {
                    interpreters[i].addEvent(mode);
                }
            }
        }

        exports.interpreterAddEvent = interpreterAddEvent;

        function endDebugging() {
            if (interpreters !== null) {
                for (var i = 0; i < numRobots; i++) {
                    interpreters[i].setDebugMode(false);
                    interpreters[i].breakPoints = [];
                }
            }
            breakpoints = [];
            debugMode = false;
            updateBreakpointEvent();
        }

        exports.endDebugging = endDebugging;

        function getSimVariables() {
            if (interpreters !== null) {
                return interpreters[0].getVariables();
            } else {
                return {};
            }
        }

        exports.getSimVariables = getSimVariables;
    }
);

//http://paulirish.com/2011/requestanimationframe-for-smart-animating/
//http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating
//requestAnimationFrame polyfill by Erik Möller
//fixes from Paul Irish and Tino Zijdel
(function () {
    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for (var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
        window.cancelAnimationFrame = (window[vendors[x] + 'CancelAnimationFrame'] || window[vendors[x] + 'CancelRequestAnimationFrame']);
    }

    if (!window.requestAnimationFrame) {
        window.requestAnimationFrame = function (callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, frameRateMs - (currTime - lastTime));
            var id = window.setTimeout(function () {
                callback();
            }, timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };
    }

    if (!window.cancelAnimationFrame) {
        window.cancelAnimationFrame = function (id) {
            clearTimeout(id);
        };
    }
}());