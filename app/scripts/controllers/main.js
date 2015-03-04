/*global $:false*/
'use strict';

/**
 * @ngdoc function
 * @name stemApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the stemApp
 */
var site = 'http://genome.klick.com',
    siteAPI = site + '/api',
    siteParams = { method: 'JSONP', params: { format: 'json', callback: 'JSON_CALLBACK' } },
    refreshInterval = 1000 * 60 * 6/60;

angular
    .module('stemApp')
    .controller('MainCtrl', function ($scope, $filter, Site) {
        angular.extend($scope, {
            /*==========  Initialize scope variables  ==========*/
            alerts      : {},

            /*==========  Get List of Users  ==========*/
            you         : Site.You.get(),
            users       : Site.Users.get(),
            // users    : ComboUsersData,
            userList    : angular.fromJson(localStorage.userList || '[]'),

            /*==========  Event Handlers  ==========*/

            /*==========  Add user on userSelect  ==========*/
            userAdd     : function(user) { $scope.userList.push(user); },
            /*==========  Update user  ==========*/
            userUpdate  : function (user, r) { if(!angular.equals(user, r)) { angular.extend(user, r); } },
            /*==========  On userSelect  ==========*/
            userSelected: function ($item) {
                            var user = { UserID: $item.UserID };
                            /*==========  Avoid Duplicate Entires in userList  ==========*/
                            if (!$filter('filter')($scope.userList, user).length) {
                                Site.User
                                    .get(user)
                                    .$promise.then($scope.userAdd, $scope.userError);
                            }
                            $scope.userSelect = null;
                        },
            /*==========  Remove from userList  ==========*/
            userMove    : function ($event, $item) {
                            $event.preventDefault();
                            var user     = $($event.target).closest('.user'),
                                prevNext = !!~[8,37,38].indexOf($event.keyCode) ? 'prev' : 'next';
                            user[prevNext]().focus();
                            if (!!~[8,46, undefined].indexOf($event.keyCode)) {
                                user.addClass(prevNext+'-'+$event.type);
                                $scope.userList.splice($item, 1);
                            }
                        },
            /*==========  Error on userGet  ==========*/
            userError: function(e) {
                            console.log(e);
                            $scope.alerts.user = {
                                type : 'danger',
                                msg  : 'Couldn\'t connect to the API.\n' +
                                        'Please ensure you are connected to the internet and' +
                                        'Logged into http://geome.klick.com'
                            };
                        },
            /*==========  Update userList  ==========*/
            userGet     : setInterval(function () {
                            angular.forEach($scope.userList, function (user) {
                                Site.User
                                    .get({ UserID: user.UserID })
                                    .$promise.then(function (r) { $scope.userUpdate(user, r); }, $scope.userError);
                            });
                        }, refreshInterval),
            /*==========  Sort userList (sortable config)  ==========*/
            userSort    : { containment: 'parent', cursor: 'move', opacity: 0.75, revert: 250, tolerance: 'pointer' },
            /*==========  Get List of Tickets  ==========*/
            // ticket      : Site.Tickets.get()
        });

        /*==========  Watch userList for changes to sync localStorage  ==========*/
        $scope.$watch('userList', function (newVal, oldVal) {
            if (newVal !== null && angular.isDefined(newVal) && newVal !== oldVal) {
                localStorage.userList = angular.toJson(newVal);
            }
        }, true);
    })
    /*==========  User API Interaction  ==========*/
    .factory('Site', function ($resource) {
        return {
            You     : $resource(siteAPI + '/User/Current',
                        { ForAutocompleter: true, ForGrid: true },
                        { get: siteParams }
                    ),
            Users   : $resource(siteAPI + '/User',
                        { ForAutocompleter: true, ForGrid: true },
                        { get: siteParams }
                    ),
            User    : $resource(siteAPI + '/User',
                        { UserID: '@UserID' },
                        { get: angular.extend({ transformResponse: function (r) {
                                r.Entries[0].KeyscanUpdated    = parseFloat(r.Entries[0].KeyscanUpdated.substr(6));
                                // r.Entries[0].KeyscanUpdated    = (new Date()).getTime();
                                // r.Entries[0].KeyscanStatus     = ['NOTIN', 'IN', 'OUT', 'IN2', 'OUT2', 'IN3', 'OUT3', 'IN4', 'OUT4', 'IN7', 'OUT7'][Math.floor((Math.random() * 10 + 1))]
                                r.Entries[0].PhotoPath         = site + r.Entries[0].PhotoPath;
                                return r.Entries[0];
                            }
                        }, siteParams)}
                    ),
            Tickets : $resource(siteAPI + '/Ticket',
                        { ForAutocompleter: true, ForGrid: true },
                        { get: siteParams }
                    ),
            Ticket  : $resource(siteAPI + '/Ticket',
                        { TicketID: '@TicketID' },
                        { get: siteParams }
                    ),
        };
    });
    /*==========  Store images offline  ==========*
    angular.directive('onimageload', function () {
        return {
            restrict : 'A',
            link     : function (scope, el) {
                el.bind('load', function () {
                    var c    = document.createElement('canvas');
                    var ctx  = c.getContext('2d');
                    c.width  = el.width;
                    c.height = el.height;
                    ctx.drawImage(el, 0, 0);
                    console.log(c.toDataURL());
                    // localStorage.userList.replace(el.attr('src'), dataURI)
                });
            }
        };
    });
    /*==========  _  ==========*/
