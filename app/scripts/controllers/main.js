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
            stems       : 0,
            alerts      : {},
            moment      : moment,

            /*==========  Get My info  ==========*/
            my          : (function() { Site.my.get().$promise.then(function(my) { $scope.my = my.Entries[0]; }); })(),
            /*==========  Get List of Tickets  ==========*/
            tickets     : (function() { Site.tickets.get().$promise.then(function(tickets) { $scope.tickets = tickets.Entries; }); })(),
            /*==========  Get List of Users  ==========*/
            users       : (function() {
                            /*==========  Watch users for changes to sync with localStorage  ==========*/
                            $scope.$watch('users', function (newVal, oldVal) {
                                if (newVal !== null && angular.isDefined(newVal) && newVal !== oldVal) {
                                    localStorage.users = angular.toJson(newVal);
                                }
                            }, true);

                            /*==========  Tag users with additional info / tools  ==========*/
                            function userTag(users) {
                                var stems = 0;
                                users = users || [];
                                $scope.users = $scope.users || [];
                                users.forEach(function(user, i) {
                                    // if (($scope.users[i] || {}).stem) if (Math.random() > 0.5) angular.extend(user, { KeyscanUpdated: (new Date()).getTime(), KeyscanStatus: ['NOTIN', 'IN', 'OUT', 'IN2', 'OUT2', 'IN3', 'OUT3', 'IN4', 'OUT4', 'IN7', 'OUT7'][Math.floor((Math.random() * 10 + 1))] });
                                    var userInit = {
                                        KeyscanFromNow : moment(user.KeyscanUpdated).fromNow(),
                                        KeyscanStamp   : moment(user.KeyscanUpdated).format('llll'),
                                        add            : function() {
                                                            var $this = this;
                                                            $this.stem = ++$scope.stems;
                                                            Site.userPic.get({ UserIDs: $this.UserID }).$promise.then(function(user) {
                                                                $this.PhotoPath = Site.url + user.Entries[0].PhotoPath;
                                                            });
                                                        },
                                        remove         : function() { delete this.stem; }
                                    };
                                    var local = $scope.users[i];
                                    if (local) {
                                        if (local.stem) {
                                            stems++;
                                            if (local.KeyscanUpdated !== user.KeyscanUpdated) {
                                                $.extend(local, user, userInit);
                                                console.table([[local.Name,local.KeyscanStatus,local.KeyscanStamp]]);
                                            }
                                        }
                                    } else $scope.users.push($.extend(user, userInit));
                                });
                                $scope.stems = stems;
                                return users;
                            }

                            /*==========  Get and Update users list  ==========*/
                            (function userGet() {
                                console.debug('get: users');
                                Site.users.get().$promise.then(function(users) {
                                    userTag(users.Entries);
                                    setTimeout(userGet, refreshInterval);
                                });
                            })();
                            return userTag(angular.fromJson(localStorage.users));
                        })(),
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
                                this.user.remove();
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
                            return $resource(site + '/api' + path,
                                params || { ForGrid: true },
                                { get: angular.extend(
                                    typeof actionParams === 'function' ? { transformResponse: actionParams } : (actionParams || {}),
                                    { method: 'JSONP', params: { format: 'json', callback: 'JSON_CALLBACK' } }
                                )}
                            );
                        };

        return {
            url     : site,
            my      : resource('/user/current'),
            users   : resource('/user'),
            userPic : resource('/user/photo', { UserIDs: '@UserIDs' }),
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