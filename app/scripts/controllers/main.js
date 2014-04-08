/*global $:false*/
'use strict';

var genome = 'http://genome.klick.com',
    genomeAPI = { format: 'json', callback: 'JSON_CALLBACK' },
    refreshInterval = 60000;

angular
  .module('zenomeApp')
  .controller('MainCtrl', function ($scope, $filter, Genome) {
    /*==========  Initialize scope variables  ==========*/
    $scope.alerts = [];
    $scope.userList = angular.fromJson(localStorage.userList || '[]');

    /*==========  Get List of Users  ==========*/
    $scope.user = Genome.Users.get();
    // $scope.user = ComboUsersData;

    /*==========  Watch userList for changes to sync localStorage  ==========*/
    $scope
      .$watch('userList', function (newVal, oldVal) {
        if (newVal !== null && angular.isDefined(newVal) && newVal !== oldVal) {
          localStorage.userList = angular.toJson(newVal);
        }
      },true);

    /*==========  Event Handlers  ==========*/
    angular.extend($scope, {
      userSelected: function ($item) {
        var user = { UserID: $item.UserID };
        /*==========  Avoid Duplicate Entires in userList  ==========*/
        if (!$filter('filter')($scope.userList, user).length) {
          Genome.User.get(user)
            .$promise.then(function (r) {
              $scope.userList.push(r);
            });
        }
        $scope.userSelect = null;
      },
      /*==========  Remove from userList  ==========*/
      userMove: function ($event, $item) {
        $event.preventDefault();
        var user = $($event.target).closest('.user');
        var prevNext = [8,37,38].indexOf($event.keyCode)!==-1 ? 'prev' : 'next';
        user[prevNext]().focus();
        if ([8,46].indexOf($event.keyCode)!==-1) {
          user.addClass(prevNext+'-'+$event.type);
          $scope.userList.splice($item, 1);
        }
      },
      /*==========  Sort userList (sortable config)  ==========*/
      userSort: {
        // containment: 'parent',
        cursor: 'move',
        opacity: 0.75,
        revert: 250,
        tolerance: 'pointer',
      },
      /*==========  Update userList  ==========*/
      userUpdate: setInterval(function () {
        angular.forEach($scope.userList, function (user) {
          Genome.User.get({ UserID: user.UserID })
            .$promise.then(function (r) {
              if(!angular.equals(user, r)) {
                // #todo: Highlight user on change
              }
              angular.extend(user, r);
            });
        });
      }, refreshInterval)
    });
  })
  /*==========  User API Interaction  ==========*/
  .factory('Genome', function ($resource) {
    return {
      Users: $resource(
        genome + '/api/User/',
        { ForAutocompleter: true, ForGrid: true },
        { get: { method: 'JSONP', params: genomeAPI } }
      ),
      User: $resource(
        genome + '/api/User/',
        { UserID: '@UserID' },
        { get: { method: 'JSONP', params: genomeAPI,
            transformResponse: function (r) {
              r.Entries[0].PhotoPath = genome + r.Entries[0].PhotoPath;
              return r.Entries[0];
            }
          }
        }
      )
    };
  })
  // /*==========  Store images offline  ==========*/
  // .directive('onimageload', function () {
  //   return {
  //     restrict: 'A',
  //     link: function (scope, el) {
  //       el.bind('load', function () {
  //         var c = document.createElement('canvas');
  //         var ctx = c.getContext('2d');
  //         c.width = el.width;
  //         c.height = el.height;
  //         ctx.drawImage(el, 0, 0);
  //         console.log(c.toDataURL());
  //         // localStorage.userList.replace(el.attr('src'), dataURI)
  //       });
  //     }
  //   };
  // })
;
