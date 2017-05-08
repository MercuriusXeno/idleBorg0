
/*global angular*/
angular.module('gameApp', ['ngRoute', 'angular-dialgauge', 'timer', 'ngSanitize', 'idleBorg', '720kb.tooltips', 'ngStorage']).config(function ($routeProvider, $sceDelegateProvider) {
    'use strict';
    $routeProvider.when('/data', {
        templateUrl: 'partials/data.html'
    });
    $routeProvider.when('/work', {
        templateUrl: 'partials/work.html'
    });
    $routeProvider.when('/build', {
        templateUrl: 'partials/build.html'
    });
    $routeProvider.when('/science', {
        templateUrl: 'partials/science.html'
    });
    $routeProvider.when('/evolve', {
        templateUrl: 'partials/evolve.html'
    });
    $routeProvider.when('/welcome', {
        templateUrl: 'partials/welcome.html'
    });
    $routeProvider.otherwise({ redirectTo: '/welcome' });



});

angular.module('idleBorg', []);
