'use strict';

angular
  .module('zenomeApp', [
    'ngCookies',
    'ngResource',
    'ngSanitize',
    'ngRoute',
    // 'ngAnimate',
    'ui',
    'ui.bootstrap'
  ])
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
