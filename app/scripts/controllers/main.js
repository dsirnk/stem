'use strict';

angular
  .module('zenomeApp')
  .controller('MainCtrl', function ($scope, $http) {
    $scope.userList = JSON.parse(localStorage.userList || '[]');

    var genome = 'http://genome.klick.com',
        /*==========  Get Data from API  ==========*/
        genomeAPI = function (param, callback, err) {
          angular.extend(param, { format: 'json', callback: 'JSON_CALLBACK' });
          $http
            .jsonp( genome + '/api/User', { params : param })
            // .get( genome + '/elements/javascripts/data/enabledusers/' )
            .success(callback)
            .error(err)
          ;
        };

    /*==========  Watch userList for changes to sync localStorage  ==========*/
    $scope
      .$watch('userList', function (newVal, oldVal) {
        if (newVal !== null && angular.isDefined(newVal) && newVal !== oldVal) {
          localStorage.userList = angular.toJson(newVal);
        }
      },true);

    /*==========  Get List of Users  ==========*/
    genomeAPI(
      { ForAutocompleter: true, ForGrid: true },
      function (response) {
        $scope.users = response.Entries;
      }
    );
    // $scope.users = ComboUsersData;
    $scope
      .userSelected = function ($item) {
        /*==========  Avoid Duplicate Entires in userList  ==========*/
        var userExists = false;
        for (var i = 0; i < $scope.userList.length; i++) {
          if($scope.userList[i].UserID === $item.UserID) {
            userExists = true;
            continue;
          }
        }
        if (!userExists) {
          /*==========  Get User Data  ==========*/
          genomeAPI(
            { userID: $item.UserID },
            function (response) {
              $item = response.Entries[0];
              $item.PhotoPath = genome + $item.PhotoPath;
              /*==========  Add to userList  ==========*/
              $scope.userList.push($item);
            }
          );
        }
        $scope.userSelect = null;
      };
    $scope
      .userRemove = function ($event, $item) {
        $event.preventDefault();
        $scope.userList.splice($item, 1);
      };
    $scope
      .userSort = {
        containment: 'parent',
        cursor: 'move',
        opacity: 0.75,
        revert: true,
        tolerance: 'intersect',
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
