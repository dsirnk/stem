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
                            /*==========  Watch users for changes to sync with localStorage  ==========*/
                            $scope.$watch('users', function (newVal, oldVal) {
                                if (newVal !== null && angular.isDefined(newVal) && newVal !== oldVal) {
                                    localStorage.users = angular.toJson(newVal);
                                }
                            }, true);

                            /*==========  Tag users with additional info / tools  ==========*/
                            function userTag(users) {
                                users = users || [];
                                $scope.users = $scope.users || [];
                                users.forEach(function(user, i) {
                                    var userInit = {
                                        KeyscanMoment : moment(user.KeyscanUpdated).calendar(),
                                        add           : function() {
                                                            var $this = this;
                                                            $this.stem = true;
                                                            Site.userPic.get({ UserIDs: $this.UserID }).$promise.then(function(user) {
                                                                $this.PhotoPath = Site.url + user.Entries[0].PhotoPath;
                                                            });
                                                        },
                                        remove        : function() { this.stem = false; }
                                    };
                                    if ($scope.users[i]) {
                                        if ($scope.users[i].KeyscanUpdated !== user.KeyscanUpdated) {
                                            $.extend($scope.users[i], user, userInit);
                                            console.log('updated:', user.Name);
                                        }
                                    } else $scope.users.push($.extend(user, userInit));
                                });
                                return users;
                            }

                            /*==========  Get and Update users list  ==========*/
                            (function userGet() {
                                Site.users.get().$promise.then(function(users) {
                                    userTag(users.Entries);
                                    setTimeout(userGet, refreshInterval);
                                });
                            })();
                            return userTag(angular.fromJson(localStorage.users));
                        })(),
            userListType: localStorage.userListType || 'grid',

            /*==========  Event Handlers  ==========*/

            /*==========  Select user on users  ==========*/
            userSelect  : function($event, $user) {
                            if ($user) $user.add();
                            var user     = $('users[list] > user[selected]'),
                                prevNext = $event.type === 'click' ? $($event.target) : (function() {
                                    if (!~[9].indexOf($event.keyCode)) $event.preventDefault();
                                    // if (!!~[9,13].indexOf($event.keyCode)) $user.add();
                                    return user[!!~[38].indexOf($event.keyCode) ? 'prev' : 'next']('user');
                                })()
                            user.removeAttr('selected').siblings().removeAttr('selected');
                            prevNext.attr('selected','selected');
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
                                console.log(c.toDataURL());
                                // localStorage.userList.replace(el.attr('src'), dataURI)
                            });
                        }
        };
    })
    /*==========  _  ==========*/
;