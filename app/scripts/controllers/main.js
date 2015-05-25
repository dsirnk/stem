/*global $:false*/
'use strict';

/**
 * @ngdoc function
 * @name stemApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the stemApp
 */
var refreshInterval = 5000;

angular
    .module('stemApp')
    .controller('MainCtrl', function ($scope, $filter, Site) {
        angular.extend($scope, {
            /*==========  Initialize scope variables  ==========*/
            moment      : moment,
            log         : function(str) { console.log(JSON.stringify(str, null, 4)); },

            my          : Site.my.get().$promise.then(function(my) { $scope.my = my.Entries[0]; }),
            tickets     : Site.tickets.get().$promise.then(function(tickets) { $scope.tickets = tickets.Entries; }),
            users       : Site.users.get().$promise.then(function(users) { $scope.users = users.Entries; }),
            stems       : (function() {
                            /*==========  Watch users for changes to sync with localStorage  ==========*/
                            $scope.$watch('stems', function (newVal, oldVal) {
                                if (newVal !== null && angular.isDefined(newVal) && newVal !== oldVal) {
                                    localStorage.stems = angular.toJson(newVal);
                                }
                            }, true);

                            (function updateStems() {
                                if (Object.keys($scope.stems || {}).length)
                                    Site.stems.get({ UserIDs: Object.keys($scope.stems).join(',') })
                                        .$promise.then(function(stems) {
                                            stems.Entries.forEach(function(user) { $.extend($scope.stems[user.UserID], $scope.stemInit(user)); });
                                        }, function(e) { console.log('obj'); });
                                setTimeout(updateStems, refreshInterval);
                            })();

                            return angular.fromJson(localStorage.stems || {});
                        })(),
            stemInit    : function(user) {
                            return $.extend(user, {
                                KeyscanFromNow  : moment(user.KeyscanUpdated).fromNow(),
                                KeyscanStamp    : moment(user.KeyscanUpdated).format('llll'),
                                PhotoPath       : user.PhotoPath
                                                ? Site.url + user.PhotoPath
                                                : (function() {
                                                    Site.userPic.get({ UserIDs: user.UserID }).$promise.then(function(u) {
                                                        $scope.stems[user.UserID].PhotoPath = Site.url + u.Entries[0].PhotoPath;
                                                    });
                                                })()
                            });
                        },
            stemAdd  : function(user) { $scope.stems[user.UserID] = $scope.stemInit(user); },
            stemRemove  : function(user) { delete $scope.stems[isNaN(parseInt(user)) ? user.UserID : user]; },
            userListType: localStorage.userListType || 'grid',

            /*==========  Event Handlers  ==========*/

            /*==========  Filter users in the list  ==========*/
            userFilter  : function(user) {
                            return !user.stem && $scope.userQuery && [user.Name, user.Title || '', user.BusinessUnitName || ''].join().toLowerCase().indexOf($scope.userQuery.toLowerCase()) > -1;
                        },
            /*==========  Remove from userList  ==========*/
            userMove    : function ($event) {
                            $event.preventDefault();
                            var user     = $($event.target).closest('user'),
                                prevNext = !!~[8,37,38].indexOf($event.keyCode) ? 'prev' : 'next';
                            user[prevNext]().focus();
                            if (!!~[8,46, undefined].indexOf($event.keyCode)) {
                                $scope.stemRemove(user.attr('id'));
                                user.addClass(prevNext+'-'+$event.type);
                            }
                        },
            /*==========  Sort userList (sortable config)  ==========*/
            userSort    : { containment : 'parent', cursor : 'move', opacity : 0.75, revert : 250, tolerance : 'pointer', 'ui-floating' : 'auto' }
        });
    })
    /*==========  User API Interaction  ==========*/
    .factory('Site', function ($resource) {
        var site       = 'http://genome.klick.com',
            resource   = function(path, params, actionParams) {
                            return $resource(site + '/api' + path, params || { ForGrid: true },
                                { get: angular.extend(
                                    typeof actionParams === 'function' ? { transformResponse: actionParams } : (actionParams || {}), {
                                        method: 'JSONP', params: { format: 'json', callback: 'JSON_CALLBACK' },
                                        interceptor: {
                                            responseError: function(e) {
                                                if (~[0, 401, 403].indexOf(e.status))
                                                    location.href = site + "login/?t=" + encodeURIComponent(location.href);
                                            }
                                        }
                                    }
                                )}
                            );
                        };

        return {
            url     : site,
            my      : resource('/user/current'),
            users   : resource('/user'),
            userPic : resource('/user/photo', { UserIDs: '@UserIDs' }),
            stems   : resource('/user', { UserIDs: '@UserIDs' }),
            tickets : resource('/ticket'),
        };
    })
    /*==========  Load and Store Images  ==========*
    .directive('loadImage', function () {
        return {
            restrict :  'A',
            link     :  function (scope, el) {
                            el.bind('load', function () {
                                el[0].setAttribute('crossOrigin','anonymous');
                                var c    = document.createElement('canvas');
                                var ctx  = c.getContext('2d');
                                ctx.drawImage(el[0], 0, 0);
                                console.debug(c.toDataURL());
                                // localStorage.userList.replace(el.attr('src'), dataURI)
                            });
                        }
        };
    })
    /*==========  _  ==========*/
;