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
            alerts      : {},
            moment      : moment,

            /*==========  Get My info  ==========*/
            my          : (function() { Site.my.get().$promise.then(function(my) { $scope.my = my.Entries[0]; }); })(),
            /*==========  Get List of Tickets  ==========*/
            tickets     : (function() { Site.tickets.get().$promise.then(function(tickets) { $scope.tickets = tickets.Entries; }); })(),
            /*==========  Get List of Users  ==========*/
            users       : (function() {
                            /*==========  Watch users for changes to sync localStorage  ==========*/
                            $scope.$watch('users', function (newVal, oldVal) {
                                if (newVal !== null && angular.isDefined(newVal) && newVal !== oldVal) {
                                    localStorage.users = angular.toJson(newVal);
                                }
                            }, true);

                            /*==========  Get and Update users list  ==========*/
                            (function userGet() {
                                Site.users.get().$promise.then(function(users) {
                                    users.Entries.forEach(function(user, i) {
                                        var userInit = {
                                            KeyscanMoment : moment(user.KeyscanUpdated).calendar(),
                                            add           : function() { this.stem = true;  },
                                            remove        : function() { this.stem = false; }
                                        };
                                        if ($scope.users[i]) {
                                            if (!angular.equals($scope.users[i], user)) $.extend($scope.users[i], user, userInit);
                                        } else $scope.users.push($.extend(user, userInit));
                                    });
                                    setTimeout(userGet, refreshInterval);
                                });
                            })();
                            return angular.fromJson(localStorage.users || '[]');
                        })(),
            userListType: localStorage.userListType || 'grid',

            /*==========  Event Handlers  ==========*/

            /*==========  Filter user on userQuery  ==========*/
            userFilter  : function(user) {
                            return !user.stem && !!~[user.Name, user.Title || '', user.BusinessUnitName || ''].join().toLowerCase().indexOf($scope.userQuery);
                        },
            /*==========  Select user on users  ==========*/
            userSelect  : function($event, $user) {
                            if (!~[9].indexOf($event.keyCode)) $event.preventDefault();
                            if (!!~[9,13].indexOf($event.keyCode) || $user) $user.add();
                            var user     = $('users[list] > user[selected]'),
                                prevNext = $event.type === 'click' ? $($event.target) : user[!!~[38].indexOf($event.keyCode) ? 'prev' : 'next']('user');
                            user.removeAttr('selected').siblings().removeAttr('selected');
                            prevNext.attr('selected','selected');
                            if (!!~[8,46, undefined].indexOf($event.keyCode)) {
                                user.addClass(prevNext+'-'+$event.type);
                            }
                        },
            /*==========  Remove from userList  ==========*/
            userMove    : function ($event) {
                            var user     = $($event.target).closest('user'),
                                prevNext = !!~[8,37,38].indexOf($event.keyCode) ? 'prev' : 'next';
                            user[prevNext]().focus();
                            if (!!~[8,46, undefined].indexOf($event.keyCode)) {
                                user.addClass(prevNext+'-'+$event.type);
                            }
                        },
            /*==========  Sort userList (sortable config)  ==========*/
            userSort    : { containment: 'parent', cursor: 'move', opacity: 0.75, revert: 250, tolerance: 'pointer' },
        });
    })
    /*==========  User API Interaction  ==========*/
    .factory('Site', function ($resource) {
        var site       = 'http://genome.klick.com',
            resource   = function(path, params) {
                            return $resource(site + '/api' + path,
                                { ForGrid: true },
                                { get: angular.extend(
                                    typeof params === 'function' ? { transformResponse: params } : (params || {}),
                                    { method: 'JSONP', params: { format: 'json', callback: 'JSON_CALLBACK' } }
                                )}
                            );
                        };

        return {
            my      : resource('/user/current'),
            users   : resource('/user'),
            tickets : resource('/ticket'),
        };
    })
    /*==========  Store images offline  ==========*
    .directive('onimageload', function () {
        return {
            restrict :  'A',
            link     :  function (scope, el) {
                            el.bind('load', function () {
                            	el[0].setAttribute('crossOrigin','anonymous');
                                var c    = document.createElement('canvas');
                                var ctx  = c.getContext('2d');
                                ctx.drawImage(el[0], 0, 0);
                                console.log(c.toDataURL());
                                // localStorage.userList.replace(el.attr('src'), dataURI)
                            });
                        }
        };
    })
    /*==========  _  ==========*/
;