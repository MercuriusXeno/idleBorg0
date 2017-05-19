//Controller file
/*global angular, console*/
/*jslint white: true */ //shhh jslint, let me space things how I want to. I prefix with commas because it clarifies a list continuation, separation of elements, etc.
/*jslint vars: true */ //shh jslint, I refuse to put my variables at the top of a function. Iterators of a for loop should be declared in the for loop. This is just stupid.
angular.module('gameApp').controller('GameController', ['$scope', '$location', '$interval', '$route', '$localStorage', '$window', '$http', '$sessionStorage', function ($scope, $location, $interval, $route, $localStorage, $window, $http, $sessionStorage) {
    'use strict';

    $scope.version = "0.0.0.6";

    $scope.generateUpgradeTemplateForDevice = function (device) {
        var newUpgrades = {}, compressionReq = {}, networkReq = {}, obfuscateReq = {}, quantumReq = {};
        newUpgrades.inject = function (id, deviceID, name, description, icon, iconFontID, dataCostBase, dataCostIncrement, requirement) {
            newUpgrades.items.push({
                id: id
                , deviceID: deviceID
                , name: name
                , description: description
                , icon: icon
                , iconFontID: iconFontID
                , dataCostBase: dataCostBase
                , dataCostIncrement: dataCostIncrement
                , requirement: requirement
                , count: 0
            });
        };
        //this generates 8 stock templates, 1 for each device, and gives them names. There's four total, one for each "stock upgrade".
        //the stock upgrades are: Compression, Optimization, Encryption and Quantum. Essentially they upgrade: storage, DPS, RISK, and everything, respectively.
        //quantum is nebulous because it improves the device and ALL devices below it. It's meant to help lower tier devices scale up with higher tier devices.

        newUpgrades.items = [];

        //declares the injection routine for the compression upgrade requirements.
        compressionReq.items = [];
        compressionReq.inject = function (id, type, ref, value) { compressionReq.items.push({id: id, type: type, ref: ref, value: value}); };
        compressionReq.inject(compressionReq.items.length, 'science', 0, 1);//the compression science requirement for the compression upgrade
        newUpgrades.inject(
            newUpgrades.items.length //upgrade id
            , device.id //the device ID of the upgrade
            , 'Compression' //upgrade name for all devices
            , 'Doubles storage for this device tier each level.' //upgrade description for all devices
            , 'material-icons' //font family name
            , 'call_merge' //font family icon
            , 125 * device.dataCostBase //base cost of device upgrade is predicated on the base cost of the device it is derived from, at the time of writing.
            , 2.4 //coefficient of the cost, multiplied for each level.
            , compressionReq.items //requirement template of the item
        );

        //declares the injection routine for the compression upgrade requirements.
        networkReq.items = [];
        networkReq.inject = function (id, type, ref, value) { networkReq.items.push({id: id, type: type, ref: ref, value: value}); };

        networkReq.inject(networkReq.items.length, 'science', 1, 1);//networking
        newUpgrades.inject(
            newUpgrades.items.length //upgrade id
            , device.id //upgrade device id
            , 'Optimization' //name
            , 'Doubles DPS for this device tier each level.' //description
            , 'material-icons' //font family name
            , 'call_split' //font family icon
            , 2500 * device.dataCostBase //cost base
            , 4 //cost coefficient
            , networkReq.items //requirement template
        );

        obfuscateReq.items = [];
        obfuscateReq.inject = function (id, type, ref, value) { obfuscateReq.items.push({id: id, type: type, ref: ref, value: value}); };
        obfuscateReq.inject(obfuscateReq.items.length, 'science', 2, 1);//network security
        newUpgrades.inject(
            newUpgrades.items.length //upgrade id
            , device.id //upgrade device id
            , 'Encryption' //name
            , 'Halves risk for this device tier each level.' //description
            , 'material-icons' //font family name
            , 'shuffle' //font family icon
            , 50e3 * device.dataCostBase //cost base
            , 5.6 //cost coefficient
            , obfuscateReq.items
        );

        quantumReq.items = [];
        quantumReq.inject = function (id, type, ref, value) { quantumReq.items.push({id: id, type: type, ref: ref, value: value}); };
        quantumReq.inject(quantumReq.items.length, 'science', 3, 1);//quantum entanglement
        newUpgrades.inject(
            newUpgrades.items.length //upgrade id
            , device.id //upgrade device id
            , 'Quantum Entanglement' //name
            , 'Improves this and lesser devices by 10% in storage, DPS and risk.' //description
            , 'material-icons' //font family name
            , 'timeline' //font family icon
            , 100e4 * device.dataCostBase
            , 7.2 //cost coefficient
            , quantumReq.items //requirement template
        );

        //adds the newly created upgrade template as a property of the device it's being applied to.
        device.upgradeList = newUpgrades.items;
    };

    //base ms between ticks, reduced by time dilation in a linear fashion, but it's with a formula.
    $scope.msBetweenTicks = 1000;

    //returns the tick interval based on the science upgrade "Time Dilation" which increases your TPS by 1 per level. Science Meta 4 is time dilation.
    $scope.getTickInterval = function () { return $scope.msBetweenTicks / (1 + $scope.scienceMeta.items[4].count); };

    $scope.getTicksPerSecond = function () {
        //stub, placeholder value right now is gonna default to 5 (200ms interval) until I can do shmancy shit with upgrades or whatever
        return 1 + $scope.scienceMeta.items[4].count;
    };

    //resets the interval the game needs to actually run. Needed when it starts or changes. Cancels existing interval (if any) as well.
    $scope.resetGameInterval = function () {
        if (angular.isDefined($scope.gameInterval)) { $interval.cancel($scope.gameInterval); }
        $scope.gameInterval = $interval(function () { $scope.gameTick(); }, $scope.getTickInterval());
    };

    //debug button that appears only when the URL contains the phrase "127.0.0.1" implying it's running in localhost. Used for maxing data so I can quickly buy things and test progression.
    $scope.maxDataForDebugging = function () { $scope.data = $scope.getDeviceStorageMax(); };

    $scope.load = function (forceReset) {
        //jslint originally wanted me to declare all variables up front, which is weird: last-possible-moment var declarations are normative in coding, in general. I'll likely break this up later.
        var now, msSinceTimestamp;
        //debug mode! so I can test more rapidly. If the URL contains localhost, then we are running it locally so give us debug mode.
        if (window.location.href.indexOf("127.0.0.1") !== -1) {
            $scope.debugMode = true;
        } else {
            $scope.debugMode = false;
        }

        //metas are going to be our lists of things (templates): info concerning the devices, abilities, upgrades, evolutions, work options, et al, throughout the game.

        $scope.getNameForTooltip = function (name) { return '<span class=\'tooltip-name\'>' + name + '</span>'; };

        $scope.getPriceForTooltip = function (cost) { return '<br><span class=\'tooltip-cost\'>' + $scope.display(cost) + 'B</span>'; };

        // CREATE SCIENCE TEMPLATE FOR THE GAME //

        var requirementTemplate = {}; //the requirement template to store each science requirement. When used, it must be reset so that it doesn't carry to the next object. Passing {} is ok
        requirementTemplate.items = [];
        requirementTemplate.inject = function (id, type, ref, value) { requirementTemplate.items.push({id: id, type: type, ref: ref, value: value}); };

        $scope.scienceMeta = {};
        $scope.scienceMeta.items = [];
        $scope.scienceMeta.inject = function (id, name, desc, icon, iconFontID, dataCost, dataCostIncrement, max, requirementItems) {
            $scope.scienceMeta.items.push({
                id: id //numerical science index, which is usually what is used to access them
                , name: name //friendly name of the science item
                , description: desc //description of the research
                , icon: icon //font family name
                , iconFontID: iconFontID //font family icon, sometimes it only takes a single class name to get the job done so it can be potentially unused
                , dataCostBase: dataCost //this is how much data the first research item costs
                , dataCostIncrement: dataCostIncrement //this is how much the cost increases each level, if applicable
                , max: max //the maximum number of science upgrades you can get for this item
                , count: 0 //this is how many levels of this research the player has acquired
                , requirement: requirementItems //these are the requirement items for this object.
            });
        };

        //this is where I'm creating the science types for the player to research, their descriptions, requirements, etc.
        //I'm hard coding the ids because integers are a bit more performant than string indexing, and I've referred to them explicitly when they are consumed, so I don't want to change them.
        $scope.scienceMeta.inject(
            0 //id
            , 'Compression' //name
            , 'Enables Compression on each device: Doubles storage for a device tier per level.' //description
            , 'material-icons' //icon font family
            , 'call_merge' //icon font ID
            , 5e3 //cost
            , 1 //cost multiplier
            , 1 //max
            , {} //requirements
        );

        $scope.scienceMeta.inject(
            1 //id
            , 'Optimization' //name
            , 'Enables Optimization on each device: Doubles DPS for a device tier per level.' //description
            , 'material-icons' //icon font family
            , 'call_split' //icon font ID
            , 10e5 //cost
            , 1 //cost multiplier
            , 1 //max
            , {} //requirements
        );

        $scope.scienceMeta.inject(
            2 //id
            , 'Encryption' //name
            , 'Enables Encryption on each device: Halves risk for a device tier per level.' //description
            , 'material-icons' //icon font family
            , 'shuffle' //icon font ID
            , 20e7 //cost
            , 1 //cost multiplier
            , 1 //max
            , {} //requirements
        );

        $scope.scienceMeta.inject(
            3 //id
            , 'Quantum Entanglement' //name
            , 'Enables Quantum Entanglement on each device; Risk -10%, Storage & DPS + 10%. Cascades to lesser tiers.' //description
            , 'material-icons' //icon font family
            , 'timeline' //icon font ID
            , 40e9 //cost
            , 1 //cost multiplier
            , 1 //max
            , {} //requirements
        );

        $scope.scienceMeta.inject(
            4 //id
            , 'Time Dilation' //name
            , 'Increases time resolution by one tick per second, each level.' //description
            , 'material-icons' //icon font family
            , 'fast_forward' //icon font ID
            , 1e4 //cost
            , 3000 //cost multiplier
            , 5 //max
            , {} //requirements
        );

        $scope.scienceMeta.inject(
            5 //id
            , 'Improbability Generator' //name
            , 'Capable of generating finite amounts of improbability, but no tea. All Risk / 100.' //description
            , 'material-icons' //icon font family
            , 'local_cafe' //icon font ID
            , 7.2e8 //cost
            , 1 //cost multiplier
            , 1 //max
            , {} //requirements
        );

        $scope.scienceMeta.inject(
            6 //id
            , 'Advanced Clustering' //name
            , 'Device power is increased by 0.5% per device, per level.' //description
            , 'material-icons' //icon font family
            , 'device_hub' //icon font ID
            , 120e6 //cost
            , 200000 //cost multiplier
            , 5 //max
            , {} //requirements
        );

        $scope.scienceMeta.inject(
            7 //id
            , 'Purposeful Redundancy' //name
            , 'Each device tier storage is increased by 1% for each device, per level. Additive.' //description
            , 'material-icons' //icon font family
            , 'cloud_queue' //icon font ID
            , 750e4 //cost
            , 80 //cost multiplier
            , 5 //max
            , {} //requirements
        );

        $scope.scienceMeta.inject(
            8 //id
            , 'Active Refactoring' //name
            , 'Your storage grows naturally by 1% of your DPS, per level, but only when it storage is not full.' //description
            , 'material-icons' //icon font family
            , 'cloud_upload' //icon font ID
            , 800e4 //cost
            , 80 //cost multiplier
            , 5 //max
            , {} //requirements
        );

        $scope.scienceMeta.inject(
            9 //id
            , 'Chronic Migraines' //name
            , 'Your cellular devices deter users. Risk / 10.' //description
            , 'material-icons' //icon font family
            , 'sentiment_very_dissatisfied' //icon font ID
            , 80e6 //cost
            , 200 //cost multiplier
            , 5 //max
            , {} //requirements
        );

        $scope.scienceMeta.inject(
            10 //id
            , 'Burnt Pixels' //name
            , 'Your PCs deter users. Risk / 10.' //description
            , 'material-icons' //icon font family
            , 'remove_from_queue' //icon font ID
            , 80e7 //cost
            , 200 //cost multiplier
            , 5 //max
            , {} //requirements
        );

        $scope.scienceMeta.inject(
            11 //id
            , 'Passive Compression' //name
            , 'Your storage grows naturally by 0.2% of your DPS, per level, but only when storage is full.' //description
            , 'material-icons' //icon font family
            , 'cloud_download' //icon font ID
            , 320e5 //cost
            , 120 //cost multiplier
            , 5 //max
            , {} //requirements
        );

        $scope.scienceMeta.inject(
            12 //id
            , 'Flaky Wifi' //name
            , 'Your workstations deter users. Risk / 10.' //description
            , 'material-icons' //icon font family
            , 'signal_wifi_off' //icon font ID
            , 80e8 //cost
            , 200 //cost multiplier
            , 5 //max
            , {} //requirements
        );

        $scope.scienceMeta.inject(
            13 //id
            , 'SQL Injection' //name
            , 'Your databases deter users. Risk / 10.' //description
            , 'material-icons' //icon font family
            , 'input' //icon font ID
            , 80e9 //cost
            , 200 //cost multiplier
            , 5 //max
            , {} //requirements
        );

        $scope.scienceMeta.inject(
            14 //id
            , 'Garbage Statistics' //name
            , 'Your academic servers deter users.  Risk / 10.' //description
            , 'material-icons' //icon font family
            , 'delete' //icon font ID
            , 80e10 //cost
            , 200 //cost multiplier
            , 5 //max
            , {} //requirements
        );

        $scope.scienceMeta.inject(
            15 //id
            , 'Conspiracy Theories' //name
            , 'Your government servers deter users. Risk / 10.' //description
            , 'material-icons' //icon font family
            , 'record_voice_over' //icon font ID
            , 80e11 //cost
            , 200 //cost multiplier
            , 5 //max
            , {} //requirements
        );

        $scope.scienceMeta.inject(
            16 //id
            , 'Out of Sight' //name
            , 'Your nanocomputers deter users. Risk / 10.' //description
            , 'material-icons' //icon font family
            , 'visibility_off' //icon font ID
            , 80e12 //cost
            , 200 //cost multiplier
            , 5 //max
            , {} //requirements
        );

        $scope.scienceMeta.inject(
            17 //id
            , 'Orbital Uncertainty' //name
            , 'Your quantum computers deter users. Risk / 10.' //description
            , 'material-icons' //icon font family
            , 'help_outline' //icon font ID
            , 80e13 //cost
            , 200 //cost multiplier
            , 5 //max
            , {} //requirements
        );

        $scope.scienceMeta.inject(
            18 //id
            , 'Fermi Paradox' //name
            , 'Your ether networks deter users. Risk / 10.' //description
            , 'material-icons' //icon font family
            , 'bubble_chart' //icon font ID
            , 80e14 //cost
            , 200 //cost multiplier
            , 5 //max
            , {} //requirements
        );

        $scope.scienceMeta.inject(
            19 //id
            , 'Active Hardening' //name
            , 'Your devices are immune to risk during hacks.' //description
            , 'material-icons' //icon font family
            , 'flip' //icon font ID
            , 320e7 //cost
            , 1 //cost multiplier
            , 1 //max
            , {} //requirements
        );

        $scope.scienceMeta.inject(
            20 //id
            , 'Passive Hardening' //name
            , 'Your devices are immune to risk after a risk loss; one tick per level.' //description
            , 'material-icons' //icon font family
            , 'gradient' //icon font ID
            , 800e8 //cost
            , 80 //cost multiplier
            , 5 //max
            , {} //requirements
        );

        $scope.scienceMeta.inject(
            21 //id
            , 'Introvert Subversion' //name
            , 'All device risk cut in half, per level.' //description
            , 'material-icons' //icon font family
            , 'grid_off' //icon font ID
            , 320e7 //cost
            , 80 //cost multiplier
            , 5 //max
            , {} //requirements
        );

        $scope.scienceMeta.inject(
            22 //id
            , 'For Your Protection' //name
            , 'Cells, PCs and Workstations have a 2.5% chance to hack an additional tick, each tick, per level.' //description
            , 'material-icons' //icon font family
            , 'speaker_phone' //icon font ID
            , 70e6 //cost
            , 80 //cost multiplier
            , 10 //max
            , {} //requirements
        );

        $scope.scienceMeta.inject(
            23 //id
            , 'Getting Personal' //name
            , 'Cells, PCs and Workstations cost factors reduced by 0.005, per level.' //description
            , 'material-icons' //icon font family
            , 'phonelink' //icon font ID
            , 70e8 //cost
            , 80 //cost multiplier
            , 5 //max
            , {} //requirements
        );

        $scope.scienceMeta.inject(
            24 //id
            , 'All Work No Play' //name
            , 'Database, Academic and Government hacking has a 2.5% chance to hack an additional tick, per level.' //description
            , 'material-icons' //icon font family
            , 'weekend' //icon font ID
            , 70e7 //cost
            , 80 //cost multiplier
            , 10 //max
            , {} //requirements
        );

        $scope.scienceMeta.inject(
            25 //id
            , 'Public Domain' //name
            , 'Database, Academic and Government cost factors reduced by 0.005, per level.' //description
            , 'material-icons' //icon font family
            , 'public' //icon font ID
            , 70e9 //cost
            , 80 //cost multiplier
            , 5 //max
            , {} //requirements
        );

        $scope.scienceMeta.inject(
            26 //id
            , 'Vaporware' //name
            , 'Nanite, Quantum and Ether networks have a 2.5% chance to hack an additional tick, each tick, per level.' //description
            , 'material-icons' //icon font family
            , 'cloud_circle' //icon font ID
            , 70e8 //cost
            , 80 //cost multiplier
            , 10 //max
            , {} //requirements
        );

        $scope.scienceMeta.inject(
            27 //id
            , 'Imagined Vulnerability' //name
            , 'Nanite, Quantum and Ether networks cost factors reduced by 0.005, per level.' //description
            , 'material-icons' //icon font family
            , 'cloud_done' //icon font ID
            , 70e10 //cost
            , 80 //cost multiplier
            , 5 //max
            , {} //requirements
        );

        $scope.scienceMeta.inject(
            28 //id
            , 'Codependent Replication' //name
            , 'Risk loss has a 15% chance of being negated, per level.' //description
            , 'material-icons' //icon font family
            , 'devices_other' //icon font ID
            , 70e7 //cost
            , 90 //cost multiplier
            , 5 //max
            , {} //requirements
        );

        $scope.scienceMeta.inject(
            29 //id
            , 'Form and Function' //name
            , 'Enables the Work tab, allowing you to consume Data to perform Data Mining.' //description
            , 'material-icons' //icon font family
            , 'tune' //icon font ID
            , 50e5 //cost
            , 1 //cost multiplier
            , 1 //max
            , {} //requirements
        );

        $scope.scienceMeta.inject(
            30 //id
            , 'Stock Manipulation' //name
            , 'Enables the job, Stock Manipulation, which allows you to convert data into fungible currency.' //description
            , 'material-icons' //icon font family
            , 'business' //icon font ID
            , 30e7 //cost
            , 1 //cost multiplier
            , 1 //max
            , {} //requirements
        );

        $scope.scienceMeta.inject(
            31 //id
            , 'Amazon Trail' //name
            , 'Enables the Market tab, where you can exchange currency for materials and resources.' //description
            , 'material-icons' //icon font family
            , 'shopping_basket' //icon font ID
            , 50e8 //cost
            , 1 //cost multiplier
            , 1 //max
            , {} //requirements
        );

        $scope.scienceMeta.inject(
            32 //id
            , 'Basic Robotics' //name
            , 'Enables the Build tab, where you can exchange materials for other resources over time.' //description
            , 'material-icons' //icon font family
            , 'build' //icon font ID
            , 60e7 //cost
            , 1 //cost multiplier
            , 1 //max
            , {} //requirements
        );

        $scope.scienceMeta.inject(
            33 //id
            , 'Three Broken Laws' //name
            , 'Reduces the DPS cost of each active robot by 15% per level.' //description
            , 'material-icons' //icon font family
            , 'recent_actors' //icon font ID
            , 50e9 //cost
            , 200 //cost multiplier
            , 5 //max
            , {} //requirements
        );

        $scope.scienceMeta.inject(
            34 //id
            , 'Predictive Algorithms' //name
            , 'Stock manipulation income is doubled, per level.' //description
            , 'material-icons' //icon font family
            , 'find_replace' //icon font ID
            , 20e8 //cost
            , 100 //cost multiplier
            , 5 //max
            , {} //requirements
        );

        $scope.scienceMeta.inject(
            35 //id
            , 'Cellular Reproduction' //name
            , 'Enables passive cell hacking.' //description
            , 'material-icons' //icon font family
            , 'camera_front' //icon font ID
            , 20e6 //cost
            , 1 //cost multiplier
            , 1 //max
            , {} //requirements
        );

        $scope.scienceMeta.inject(
            36 //id
            , 'Personal Lives' //name
            , 'Enables passive PC hacking.' //description
            , 'material-icons' //icon font family
            , 'fingerprint' //icon font ID
            , 20e7 //cost
            , 1 //cost multiplier
            , 1 //max
            , {} //requirements
        );

        $scope.scienceMeta.inject(
            37 //id
            , 'Consummate Professional' //name
            , 'Enables passive workstation hacking.' //description
            , 'material-icons' //icon font family
            , 'supervisor_account' //icon font ID
            , 20e8 //cost
            , 1 //cost multiplier
            , 1 //max
            , {} //requirements
        );

        $scope.scienceMeta.inject(
            38 //id
            , 'Agent Jobs' //name
            , 'Enables passive database hacking.' //description
            , 'material-icons' //icon font family
            , 'alarm_add' //icon font ID
            , 20e9 //cost
            , 1 //cost multiplier
            , 1 //max
            , {} //requirements
        );

        $scope.scienceMeta.inject(
            39 //id
            , 'Generational Alumni' //name
            , 'Enables passive academic hacking.' //description
            , 'material-icons' //icon font family
            , 'school' //icon font ID
            , 20e10 //cost
            , 1 //cost multiplier
            , 1 //max
            , {} //requirements
        );

        $scope.scienceMeta.inject(
            40 //id
            , 'Spook Spooks' //name
            , 'Enables passive academic hacking.' //description
            , 'material-icons' //icon font family
            , 'assignment_late' //icon font ID
            , 20e11 //cost
            , 1 //cost multiplier
            , 1 //max
            , {} //requirements
        );

        $scope.scienceMeta.inject(
            41 //id
            , 'Little Friends' //name
            , 'Enables passive nanocomputer hacking.' //description
            , 'material-icons' //icon font family
            , 'bug_report' //icon font ID
            , 20e12 //cost
            , 1 //cost multiplier
            , 1 //max
            , {} //requirements
        );

        $scope.scienceMeta.inject(
            42 //id
            , 'Different QED' //name
            , 'Enables passive quantum computer hacking.' //description
            , 'material-icons' //icon font family
            , 'gesture' //icon font ID
            , 20e13 //cost
            , 1 //cost multiplier
            , 1 //max
            , {} //requirements
        );

        $scope.scienceMeta.inject(
            43 //id
            , 'Lift the Veil' //name
            , 'Enables passive ether network hacking.' //description
            , 'material-icons' //icon font family
            , 'bookmark' //icon font ID
            , 20e14 //cost
            , 1 //cost multiplier
            , 1 //max
            , {} //requirements
        );

        $scope.scienceMeta.inject(
            44 //id
            , 'Passive Aggression' //name
            , 'Reduce the penalty of passive hacking by 10% per level.' //description
            , 'material-icons' //icon font family
            , 'filter_list' //icon font ID
            , 20e11 //cost
            , 20 //cost multiplier
            , 1 //max
            , {} //requirements
        );

        // CREATE DEVICE TEMPLATE FOR THE GAME //

        $scope.deviceMeta = {};

        //creates the items array in the device meta.
        $scope.deviceMeta.items = [];

        //declares a push method for the device meta. As above with upgrades/requirements, this probably wasn't necessary, but it works.
        $scope.deviceMeta.inject = function (id, name, description, icon, iconFontID, cpuBase, storage, dataCostIncrement, riskIncrement, dataCostBase, requirement, upgradeList) {
            $scope.deviceMeta.items.push({
                id: id //numerical device index, which is usually what is used to access them.
                , name: name //friendly name of the device hack 'tier'
                , description: description //description of the device
                , icon: icon //font family name
                , iconFontID: iconFontID //font family icon, sometimes it only takes a single class name to get the job done so it can be potentially unused.
                , cpuBase: cpuBase //this is how much cpu a single unit generates per tick.
                , storage: storage //this is how much the device can store. This gets used more later.
                , dataCostIncrement: dataCostIncrement //each level costs [x][previous cost], where x is the increment. Starts out at 1 x dataCostBase
                , dataCostBase: dataCostBase //the initial cost to aquire a single mobile device.
                , riskIncrement: riskIncrement //same as above but for risk. you can see that risk grows faster than cpu for this device.
                , requirement: requirement //the requirement for this device. some devices don't have requirements.
                , upgradeList: upgradeList //the template of upgrades belonging to this device. each one has a set and they're mostly the same.
                , unlocked: false //tells the browser to hide the item and prevents you from buying it.
                , hacking: 0 //tells the browser to disable the button when true. you can only hack a single device per tick.
                , count: 0 //how many of a device you have hacked. This determines cost and other things.
                , offsetCount: 0 //this is a count you get without factoring into costs, among other things.
            });
            $scope.generateUpgradeTemplateForDevice($scope.deviceMeta.items[id]);
        };

        //devices, how much they cost, descriptions, template stuff.
        //when a device has requirements, the requirements template gets cleared() and then I inject the requirements into it, prior to
        //creating that object as a property inside the device's meta, which effectively clones it. I reuse the requirementTemplate repeatedly.
        //the upgrade template method is similar, it creates the same upgrade template for each item, but it does it by ID so we can track them separately.

        $scope.deviceMeta.inject(
            0 //id
            , 'Mobile' //name
            , 'Portability and proximity to users makes mobile devices risky to hold.' //description
            , 'material-icons' //font family
            , 'smartphone' //font icon if applicable
            , 1 //data per tick
            , 50 //storage
            , 1.075 //data cost increment
            , 1.09 //risk increment
            , 40 //data cost base
        );

        $scope.deviceMeta.inject(
            1 //id
            , 'Personal' //name
            , 'Private computer access has improved risk factor over mobile devices.' //description
            , 'material-icons' //font family
            , 'laptop' //font icon if applicable
            , 8 //data per tick
            , 800 //storage
            , 1.07 //data cost increment
            , 1.0875 //risk increment
            , 400 //data cost base
        );

        $scope.deviceMeta.inject(
            2 //id
            , 'Workstation' //name
            , 'Designed for multitasking. Exploited stacks are safe and very powerful.' //description
            , 'fa fa-server' //font family
            , '' //font icon if applicable
            , 64 //data per tick
            , 9600 //storage
            , 1.065 //data cost increment
            , 1.085 //risk increment
            , 4000 //data cost base
        );

        $scope.deviceMeta.inject(
            3 //id
            , 'Database' //name
            , 'A database built for moving large amounts of information, very fast.' //description
            , 'fa fa-database' //font family
            , '' //font icon if applicable
            , 512 //data per tick
            , 102400 //storage
            , 1.06 //data cost increment
            , 1.0825 //risk increment
            , 4e4 //data cost base
        );

        $scope.deviceMeta.inject(
            4 //id
            , 'Academic Server' //name
            , 'An extremely powerful server designed to do statistical analysis.' //description
            , 'fa fa-university' //font family
            , '' //font icon if applicable
            , 4096 //data per tick
            , 1024000 //storage
            , 1.055 //data cost increment
            , 1.08 //risk increment
            , 4e5 //data cost base
        );

        $scope.deviceMeta.inject(
            5 //id
            , 'Government Server' //name
            , 'A government supercomputer that puts common computing to shame.' //description
            , 'fa fa-gavel' //font family
            , '' //font icon if applicable
            , 32768 //data per tick
            , 9830400 //storage
            , 1.05 //data cost increment
            , 1.0775 //risk increment
            , 4e6 //data cost base
        );

        $scope.deviceMeta.inject(
            6 //id
            , 'Nanocomputer' //name
            , 'A privately developed nanoscopic machine with incredible processing power.' //description
            , 'fa fa-microchip' //font family
            , '' //font icon if applicable
            , 262144 //data per tick
            , 91750400 //storage
            , 1.1 //data cost increment
            , 1.045 //risk increment
            , 4e7 //data cost base
        );

        $scope.deviceMeta.inject(
            7 //id
            , 'Quantum Computer' //name
            , 'A world-collaborative physical marvel, capable of moving vast amounts of data.' //description
            , 'fa fa-ravelry' //font family
            , '' //font icon if applicable
            , 2097152 //data per tick
            , 838860800 //storage
            , 1.04 //data cost increment
            , 1.0725 //risk increment
            , 4e8 //data cost base
        );

        $scope.deviceMeta.inject(
            8 //id
            , 'Ether Network' //name
            , 'An alien device network which generates vast computing power. Highly improbable.' //description
            , 'fa fa-eercast' //font family
            , '' //font icon if applicable
            , 16777216 //data per tick
            , 7549747200 //storage
            , 1.035 //data cost increment
            , 1.07 //risk increment
            , 4e9 //data cost base
        );

        //lazy versioning. I tried to write a comprehensive subroutine for updating saves, but it backfired and was bad.
        //I'd like to try again but it's hard to simplify it (for me) because the logic starts getting hairy down in the templates.
        //for now this is easier, harder on players, but easier to maintain. I only want to change versions when something catastrophically breaks.
        if ($localStorage.version === null || $localStorage.version !== $scope.version) {
            forceReset = true;
        }

        if ($localStorage.deviceMeta !== undefined && !forceReset) {
            $scope.buyMode = $localStorage.buyMode; //buymode is how many devices you're trying to buy at once.1,10,100,0[max] in that order. Defaults to 1.
            $scope.data = $localStorage.data; //your player data, this is your primary resource at the beginning.
            $scope.population = $localStorage.population; //a bit nebulous: more people means it's easier to hide, less people means higher risk.
            $scope.deviceMeta = $localStorage.deviceMeta;
            $scope.scienceMeta = $localStorage.scienceMeta;
            $scope.workMeta = $localStorage.workMeta;
            $scope.buyMode = $localStorage.buyMode;
            $scope.version = $localStorage.version;
            $scope.refactoredStorage = $localStorage.refactoredStorage;
        } else {
            $scope.buyMode = 1; //buymode is how many devices you're trying to buy at once.1,10,100,0[max] in that order. Defaults to 1.
            $scope.data = 0; //your player data, this is your primary resource at the beginning.
            $scope.population = 8e9;
            $scope.refactoredStorage = 0;
        }
        $scope.resetGameInterval();
        //here's the very last minute, where we check to see if our timestamps don't line up.
        now = new Date().valueOf();

        if (now > $localStorage.lastSaved) {
            msSinceTimestamp = now - $localStorage.lastSaved;
        }

        $localStorage.lastSaved = new Date().valueOf();
        $scope.save();//forces a wipe to save over old file.
    };

    $scope.save = function () {
        $localStorage.deviceMeta = $scope.deviceMeta;
        $localStorage.refactoredStorage = $scope.refactoredStorage;
        $localStorage.workMeta = $scope.workMeta;
        $localStorage.scienceMeta = $scope.scienceMeta;
        $localStorage.data = $scope.data;
        $localStorage.buyMode = $scope.buyMode;
        $localStorage.population = $scope.population;
        $localStorage.lastSaved = new Date().valueOf();
        $localStorage.permanentlyUnlockScience = $scope.permanentlyUnlockScience;
        $localStorage.version = $scope.version;
    };

    $scope.load(false);

    $scope.hasDevice = function () {
        for (var i = 0; i < $scope.deviceMeta.items.length; i += 1) {
            if ($scope.deviceMeta.items[i].count > 0) {
                return true;
            }
        }
        return false;
    };

    $scope.getFillColor = function (number) {
        if (number >= 0.9) {
            return 'progress-bar-danger fg-white';
        }
        return 'progress-bar-info fg-black';
    };

    $scope.getScienceCost = function (science) {
        return science.dataCostBase * Math.pow(science.dataCostIncrement, science.count);
    };

    $scope.buyScience = function (science) {
        if (!$scope.canBuyScience(science)) {
            return;
        }
        $scope.data -= $scope.getScienceCost(science);
        science.count += 1;
        if (science.id === 4) { $scope.resetGameInterval(); } //special case here for "Time Dilation" - it speeds up time so the interval has to be reset
        $scope.save();
    };

    //returns if
    $scope.canBuyScience = function (science) { return $scope.data >= $scope.getScienceCost(science) && science.count < science.max; };

    //returns if you should see the science item in question. Science items unlock permanently at 20% of their cost.
    $scope.shouldSeeScience = function (science) {
        if (science.unlocked) {
            return true;
        } else {
            if ($scope.getScienceCost(science) <= $scope.data * 5) {
                science.unlocked = true;
                return true;
            }
        }
    };

    $scope.setTab = function (tabName) { $scope.selectedTab = tabName; };

    $scope.hackDevice = function (device, count) {
        device.hacking = count;
        $scope.save();
    };

    $scope.scienceAvailable = function () {
        if ($scope.permanentlyUnlockScience) {
            return true;
        }
        for (var i = 0; i < $scope.scienceMeta.items.length; i += 1) {
            var sciObj = $scope.scienceMeta.items[i];
            if (sciObj.count > 0 || $scope.shouldSeeScience(sciObj)) {
                $scope.permanentlyUnlockScience = true;
                return true;
            }
        }
        return false;
    };

    $scope.shouldHighlightScienceTab = function () {
        for (var i = 0; i < $scope.scienceMeta.items.length; i += 1) {
            var sciObj = $scope.scienceMeta.items[i];
            if ($scope.canBuyScience(sciObj)) {
                return true;
            }
        }
        return false;
    };

    $scope.workAvailable = function () {
        return false;//stub
    };

    $scope.removeDevice = function (deviceID) {
        $scope.deviceMeta.items[deviceID].count -= 1;
        $scope.save();
    };

    $scope.getScienceBasedRiskReduction = function (device) {
        var multiplier;
        switch (device.id) {
        case 0://mobile devices
            multiplier *= Math.pow(0.1, $scope.scienceMeta.items[9].count); //chronic migraines
            break;
        case 1://personal computers
            multiplier *= Math.pow(0.1, $scope.scienceMeta.items[10].count);//burnt pixels
            break;
        }
        return 1;
    };

    $scope.getQuantumTotalLevelForDevice = function (device) {
        var index = device.id, i, deviceMeta, quantumLevel = 0;
        for (i = 8; i > index; i -= 1) {
            deviceMeta = $scope.deviceMeta.items[i];
            quantumLevel += device.upgradeList[3].count; //3 is quantum
        }
        return quantumLevel;
    };

    $scope.getDeviceRisk = function (device) {
        var riskTotal = 0;
        for (var i = 0; i < device.count; i += 1) {
            var riskCoeff = Math.pow(device.riskIncrement, i);
            riskTotal += $scope.getScienceBasedRiskReduction(device) * riskCoeff;
        }
        //encryption per device
        if (device.upgradeList[2].count > 0) {
            riskTotal *= Math.pow(0.5, device.upgradeList[2].count);
        }
        //quantum bonus per device
        if ($scope.getQuantumTotalLevelForDevice(device) > 0) {
            riskTotal *= Math.pow(0.9, $scope.getQuantumTotalLevelForDevice(device));
        }
        return riskTotal;
    };

    $scope.getDeviceRiskForDisplay = function (device) {
        if ($scope.getDeviceRisk(device) === 0) {
            return 0;
        }
        var riskAgainst;
        riskAgainst = $scope.population / $scope.getDeviceRisk(device);
        if (riskAgainst < 1) {
            riskAgainst = 1;
        }
        return riskAgainst;
    };

    $scope.getDataGeneratedPerTick = function (device) {
        var multiplier;
        multiplier = Math.pow(2, Math.floor((device.count + device.offsetCount) / 25))
        return multiplier * ((device.count + device.offsetCount) * device.cpuBase) * $scope.getDeviceCPUFactor(device);
    };

    $scope.getDeviceCPUFactor = function (device) {
        return $scope.getDeviceOptimizationFactor(device) * $scope.getDeviceQuantumFactor(device);
    };

    $scope.getDeviceClusteringFactor = function (device) {
        var scienceMeta = $scope.scienceMeta.items[6];//clustering, if you have it, it's a permanent bonus to all devices.
        return Math.pow(1 + (.005 * scienceMeta.count), device.count);
    };

    $scope.getDeviceOptimizationFactor = function (device) {
        return Math.pow(2, device.upgradeList[1].count) * $scope.getDeviceClusteringFactor(device);
    };

    $scope.getDeviceQuantumFactor = function (device) {
        return Math.pow(1.1, $scope.getQuantumTotalLevelForDevice(device));
    };

    $scope.getDeviceCompressionFactorForStorage = function (device) {
        return $scope.getCompressionFactorForStorage(device.upgradeList[0].count);
    };

    $scope.getCompressionFactorForStorage = function (compressionLevel) {
        return Math.pow(2, compressionLevel);
    };

    $scope.getDeviceRedundancyFactor = function (device) {
        var scienceMeta = $scope.scienceMeta.items[7]; //redundancy
        return 1 + (0.1 * device.count * scienceMeta.count);
    };

    $scope.installClick = function () {
        //doesn't assume you don't have a phone - evolution abilities may later support advanced placement starts.
        if ($scope.population <= 0) {
            $scope.population = 1;
        }
        $scope.hackDevice($scope.deviceMeta.items[0], 1); //hack 1 cell phone
    };

    $scope.processStorage = function () {
        var refactoringGrowth = 0
            , activeRefactoring = $scope.scienceMeta.items[8]//active refactoring
            , passiveCompression = $scope.scienceMeta.items[11]; //passive compression
        if ($scope.data === $scope.getDeviceStorageMax()) {
            refactoringGrowth += $scope.getTickCPU() * 0.002 * passiveCompression.count
        } else {
            refactoringGrowth = $scope.getTickCPU() * 0.01 * activeRefactoring.count;
        }
        $scope.refactoredStorage += refactoringGrowth;
    };

    $scope.processHacks = function () {
        for (var i = 0; i < $scope.deviceMeta.items.length; i += 1) {
            var device = $scope.deviceMeta.items[i];
            if (device.hacking > 0) {
                device.count += 1;
                device.hacking -= 1;
            }
        }
    };

    $scope.gameTick = function () {
        $scope.processHacks();
        $scope.processStorage();
        $scope.processRisk();
        //here's where magic happens, such as data being incremented.
        $scope.data = Math.min($scope.getDeviceStorageMax(), $scope.data + $scope.getTickCPU());
    };

    $scope.getDeviceSpecificStorageBonus = function (device) {
        var scienceMeta;
        switch (device.id) {
        case 0://mobile devices
            scienceMeta = $scope.scienceMeta.items[9];//chronic migraines
            break;
        case 1://personal computers
            scienceMeta = $scope.scienceMeta.items[10];//burnt pixels
            break;
        }
        if (scienceMeta === null || typeof scienceMeta === 'undefined') {
            return 1;
        }
        if (scienceMeta.count > 0) {
            return 100;
        }
        return 1;
    };

    $scope.getDeviceStorageMax = function (device) {
        if (typeof device === 'undefined' || device === null) {
            var i, deviceMeta, storageTotal;
            storageTotal = 0;
            for (i = 0; i < $scope.deviceMeta.items.length; i += 1) {
                deviceMeta = $scope.deviceMeta.items[i];
                storageTotal += (deviceMeta.count + deviceMeta.offsetCount) * deviceMeta.storage * $scope.getDeviceCompressionFactorForStorage(deviceMeta) * $scope.getDeviceRedundancyFactor(deviceMeta) * $scope.getDeviceSpecificStorageBonus(deviceMeta);
            }
        } else {
            return (device.count + device.offsetCount) * device.storage * $scope.getDeviceCompressionFactorForStorage(device) * $scope.getDeviceRedundancyFactor(device) * $scope.getDeviceSpecificStorageBonus(device);
        }
        return storageTotal + $scope.refactoredStorage;
    };

    $scope.processRisk = function () {
        var i, deviceMeta;
        for (i = 0; i < $scope.deviceMeta.items.length; i += 1) {
            deviceMeta = $scope.deviceMeta.items[i];
            if (deviceMeta.count > 0 && $scope.getDeviceRisk(deviceMeta) > 0) {
                if (Math.random() < 1.0 / ($scope.population / $scope.getDeviceRisk(deviceMeta))) {
                    $scope.removeDevice(deviceMeta.id);
                }
            }
            //this sets the scope risk for the object in question
            deviceMeta.riskPercent = 100.0 / ($scope.population / $scope.getDeviceRisk(deviceMeta));
        }
    };

    $scope.getTickCPU = function () {
        var i, cpuFromDevice, cpuTotal;
        cpuTotal = 0;
        for (i = 0; i < $scope.deviceMeta.items.length; i += 1) {
            cpuFromDevice = $scope.getDataGeneratedPerTick($scope.deviceMeta.items[i]);
            cpuTotal += cpuFromDevice;
        }
        return cpuTotal;
    };

    $scope.hasData = function () {
        return $scope.data > 0;
    };

    $scope.requirementsMet = function (requirement) {
        var i, isMet = true, reqObj;
        for (i = 0; i < requirement.length; i += 1) {
            reqObj = requirement[i];
            switch (reqObj.type) {
            case 'device':
                if ($scope.deviceMeta.items[reqObj.ref].count < reqObj.value) {
                    isMet = false;
                }
                break;
            case 'science':
                if ($scope.scienceMeta.items[reqObj.ref].count < reqObj.value) {
                    isMet = false;
                }
                break;
            default:
                isMet = false;
                break;
            }
        }
        return isMet;
    };

    $scope.buyUpgrade = function (upgrade) {
        if (!$scope.canBuyUpgrade(upgrade)) { return; }
        $scope.data -= $scope.getUpgradeCost(upgrade);
        upgrade.count += 1;
        $scope.save();
    };

    $scope.getUpgradeCost = function (upgrade) { return upgrade.dataCostBase * Math.pow(upgrade.dataCostIncrement, upgrade.count); };

    //returns that you have the data for a device upgrade and also meet the requirements.
    $scope.canBuyUpgrade = function (upgrade) { return $scope.data >= $scope.getUpgradeCost(upgrade) && $scope.requirementsMet(upgrade.requirement); };

    //returns that you have data for a device
    $scope.canBuyDevice = function (device) {
        var buyPrice = $scope.getDeviceDataCost(device);
        return $scope.data >= buyPrice && buyPrice > 0;
    };

    $scope.shouldShowDevice = function (device) {
        if (device.unlocked) {
            return true;
        } else {
            if (device.dataCostBase / 5 <= $scope.data) {
                device.unlocked = true;
                return true;
            }
        }
        return false;
    }

    $scope.getDeviceBuyCount = function (device) {
        var i, price, count, lastAffordable;
        lastAffordable = 0;
        price = 0;
        count = $scope.buyMode;
        if (count === 0) {
            i = 0;
            while (price <= $scope.data) {
                lastAffordable = i;
                price += device.dataCostBase * Math.pow(device.dataCostIncrement, device.count + i);
                i += 1;
            }
            return lastAffordable;
        }
        return count;
    };

    $scope.getDeviceDataCost = function (device, count) {
        var i, price, lastAffordable;
        if (typeof count === 'undefined') {
            count = $scope.buyMode;
        }
        lastAffordable = 0;
        price = 0;
        if (count === 0) {
            i = 0;
            while (price <= $scope.data) {
                lastAffordable = price;
                price += device.dataCostBase * Math.pow(device.dataCostIncrement, device.count + i);
                i += 1;
            }
            price = lastAffordable;
        } else {
            for (i = 0; i < count; i += 1) {
                price += device.dataCostBase * Math.pow(device.dataCostIncrement, device.count + i);
            }
        }
        return Math.round(price * 100) / 100;
    };

    $scope.getPriceOfOne = function (device) {
        return $scope.getDeviceDataCost(device, 1);
    };

    //helps get the colors of the device buttons - determines first whether you can afford the item in the current purchasing mode.
    $scope.getCanBuyColor = function (purchaseType, obj) {
        switch (purchaseType) {
        case 'device':
            if ($scope.canBuyDevice(obj)) {
                return 'fg-green';
            }
            return 'fg-gray';
        case 'upgrade':
            if ($scope.canBuyUpgrade(obj)) {
                return 'fg-green';
            }
            return 'fg-gray';
        case 'science':
            if ($scope.canBuyScience(obj)) {
                return 'fg-green';
            }
            return 'fg-gray';
        default:
            return 'fg-gray';
        }
    };

    //helps get the css class of the upgrade buttons which varies by progression.
    $scope.getUpgradeCSS = function (upgrade) {
        if ($scope.requirementsMet(upgrade.requirement)) {
            if ($scope.canBuyUpgrade(upgrade)) {
                return 'btn-upgrade-wrapper btn-enabled';
            } else {
                return 'btn-upgrade-wrapper btn-disabled';
            }
        } else {
            return 'btn-ghost';
        }
    };

    $scope.getTooltipTemplateForUpgrade = function (upgrade) {
        var tooltip = $scope.getNameForTooltip(upgrade.name) + ': ';
        if ($scope.requirementsMet(upgrade.requirement)) {
            tooltip += upgrade.description + ' Costs ' + $scope.display($scope.getUpgradeCost(upgrade)) + 'B';
        } else {
            tooltip += 'Upgrade Locked';
        }
        return tooltip;
    };

    $scope.getNextBuyModeInCycle = function () {
        switch ($scope.buyMode) {
        case 1:
            return 10;
        case 10:
            return 100;
        case 100:
            return 0;
        case 0:
            return 1;
        default:
            return 1;
        }
    };

    $scope.cycleBuyMode = function () {
        $scope.buyMode = $scope.getNextBuyModeInCycle();
    };

    $scope.getDisplayBuyMode = function () {
        if ($scope.buyMode === 0) {
            return 'Max';
        } else {
            return 'x' + $scope.buyMode;
        }
    };

    $scope.truncate = function (number, digits) {
        var x;
        x = number * Math.pow(10, digits);
        x = Math[x < 0 ? 'ceil' : 'floor'](x);
        x /= Math.pow(10, digits);
        return x;
    };

    $scope.getStoragePercentage = function () {
        var storagePercentage;
        if ($scope.getDeviceStorageMax() > 0) {
            storagePercentage = $scope.data * 100 / $scope.getDeviceStorageMax();
        } else {
            storagePercentage = 0;
        }
        return storagePercentage;
    };

    $scope.getDigits = function (number) {
        var i = 0;
        while (number > 10) {
            i += 1;
            number /= 10;
        }
        return i;
    };

    $scope.shorten = function (number, precision, forceScientific) {
        forceScientific = (typeof forceScientific === 'undefined') ? false : forceScientific;
        var i = 0, suffix = '';
        while (number >= 1000) {
            i += 1;
            number /= 1000.0;
        }
        number = $scope.truncate(number, precision);
        if (forceScientific) {
            if (i === 0) {
                return number;
            }
            return number + 'e' + (i * 3);
        }
        switch (i) {
        case 0:
            return number + 'K';
        case 1:
            return number + 'M';
        case 2:
            return number + 'G';
        case 3:
            return number + 'T';
        case 4:
            return number + 'P';
        case 5:
            return number + 'E';
        case 6:
            return number + 'Z';
        case 7:
            return number + 'Y';
        default:
            return number + 'e' + (i * 3);
        }
    };

    $scope.display = function (number, forceScientific) {
        forceScientific = (typeof forceScientific === 'undefined') ? false : forceScientific;
        return $scope.shorten(number, 1, forceScientific);
    };

    $scope.buyDevice = function (device) {
        if ($scope.data < $scope.getDeviceDataCost(device)) {
            return;
        }
        var count = $scope.getDeviceBuyCount(device);
        $scope.data -= $scope.getDeviceDataCost(device);
        $scope.hackDevice(device, count);
    };
}]);
