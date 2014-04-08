/*global $:false*/
'use strict';

angular
  .module('zenomeApp')
  .controller('MainCtrl', function ($scope, $http, $filter, Genome) {
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
            .$promise.then(function(r) {
              $scope.userList.push(r);
              $scope.userStorage();
            });
        }
        $scope.userSelect = null;
      },
      /*==========  Remove from userList  ==========*/
      userRemove: function ($event, $item) {
        $event.preventDefault();
        $($event.target)
          .closest('.user')
          .addClass($event.type)
          .prev().focus();
        $scope.userList.splice($item, 1);
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
      // userUpdate: setInterval(function() {
      //   for (var i = 0; i < $scope.userList.length; i++) {
      //     // #todo: Use Async for loop
      //     var thisUser = $scope.userList[i];
      //     Genome.User.get({ UserID: thisUser.UserID })
      //       .$promise.then(function(r) {
      //         if(!angular.equals(thisUser, r)) {
      //           // #todo: Highlight user on change
      //         };
      //         angular.extend(thisUser, r);
      //       });
      //   }
      // }, 10000)
    });
  })
  /*==========  User API Interaction  ==========*/
  .factory('Genome', function($resource) {
    var genome = 'http://genome.klick.com',
        genomeAPI = { format: 'json', callback: 'JSON_CALLBACK' },
        counter = 0;

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
            transformResponse: function(r) {
              r.Entries[0].PhotoPath = genome + r.Entries[0].PhotoPath;
              if (r.Entries[0].UserID === 4806) {
                r.Entries[0].KeyscanStatus = ('IN' + ++counter);
              }
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
