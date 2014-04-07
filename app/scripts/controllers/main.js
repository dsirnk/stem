'use strict';

angular
  .module('zenomeApp')
  .controller('MainCtrl', function ($scope, $http, $filter) {
    $scope.alerts = $scope.users = [];
    $scope.userList = angular.fromJson(localStorage.userList || '[]');

    var genome = 'http://genome.klick.com',
        /*==========  Get Data from API  ==========*/
        GenomeAPI = function (param, callback) {
          var config = { format: 'json', callback: 'JSON_CALLBACK' };
          $http
            .jsonp(genome + '/api/User', {params: angular.extend(config, param)})
            // .get( genome + '/elements/javascripts/data/enabledusers/' )
            .success(callback)
            .error(function() {
              $scope.alerts.push({
                type: 'danger',
                msg: 'Couldn\'t connect to the API.\n' +
                  'Please ensure you are connected to the internet and' +
                  'Logged into http://geome.klick.com'
              });
            });
        };

    /*==========  Watch userList for changes to sync localStorage  ==========*/
    $scope
      .$watch('userList', function (newVal, oldVal) {
        if (newVal !== null && angular.isDefined(newVal) && newVal !== oldVal) {
          localStorage.userList = angular.toJson(newVal);
        }
      },true);

    /*==========  Get List of Users  ==========*/
    new GenomeAPI(
      { ForAutocompleter: true, ForGrid: true },
      function(r) { $scope.users = r.Entries; }
    );
    // $scope.users = ComboUsersData;
    $scope
      .userSelected = function ($item) {
        /*==========  Avoid Duplicate Entires in userList  ==========*/
        if (!$filter('filter')($scope.userList, {UserID: $item.UserID}).length) {
          /*==========  Get User Data  ==========*/
          new GenomeAPI(
            { userID: $item.UserID },
            function (r) {
              $item = r.Entries[0];
              $item.PhotoPath = genome + $item.PhotoPath;
              /*==========  Add to userList  ==========*/
              $scope.userList.push($item);
            }
          );
        }
        $scope.userSelect = null;
      };
    /*==========  Remove from userList  ==========*/
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
    /*==========  Update userList  ==========*/
    $scope
      .userUpdate = setInterval(function() {
        // $scope.userList
    }, 15000);
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
