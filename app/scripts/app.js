'use strict';

/**
 * @ngdoc overview
 * @name stemApp
 * @description
 * # stemApp
 *
 * Main module of the application.
 */
angular
  .module('stemApp', [
    'ngAnimate',
    'ngCookies',
    'ngResource',
    'ngRoute',
    'ngSanitize',
    'ui.bootstrap',
    'ui.sortable',
    'ui.utils'
  ],
  function ($compileProvider) {
    $compileProvider.aHrefSanitizationWhitelist(/^\s*(mailto|tel|sms|gtalk||):/);
  })
  .config(function ($routeProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'views/main.html',
        controller: 'MainCtrl'
      })
      .otherwise({
        redirectTo: '/'
      });
  });
