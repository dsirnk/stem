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
            site        : Site.url,
            my          : (function() { Site.my.get().$promise.then(function(my) { $scope.my = (my || [])[0]; }); })(),
            tasks       : (function() { Site.tasks.get().$promise.then(function(tasks) { $scope.tasks = tasks; }); })(),
            users       : (function() { Site.users.get().$promise.then(function(users) { $scope.users = users; }); })(),
            stems       : (function() {
                            /*==========  Watch users for changes to sync with localStorage  ==========*/
                            $scope.$watch('stems', function (newVal, oldVal) {
                                if (newVal !== null && angular.isDefined(newVal) && newVal !== oldVal) {
                                    localStorage.stems = angular.toJson(newVal);
                                }
                            }, true);

                            $scope.stems = angular.fromJson(localStorage.stems || []);
                            (function updateStems() {
                                if ($scope.stems.length)
                                    Site.stems.get({ UserIDs: $scope.stems.reduce(function(a, b) { return { UserID : [a.UserID, b.UserID].join(',')}; }).UserID })
                                        .$promise.then(function(stems) {
                                            (stems || []).forEach(function(userUpdate) {
                                                $scope.stems.forEach(function(user) {
                                                    if (user.UserID === userUpdate.UserID) $.extend(user, $scope.stemInit(userUpdate));
                                                });
                                            });
                                        });
                                setTimeout(updateStems, refreshInterval);
                            })();
                            return $scope.stems;
                        })(),
            stemInit    : function(user) {
                            return $.extend(user, {
                                KeyscanFromNow  : moment(user.KeyscanUpdated).fromNow(),
                                KeyscanStamp    : moment(user.KeyscanUpdated).format('llll'),
                                PhotoPath       : user.PhotoPath ? ~user.PhotoPath.indexOf($scope.site) ? user.PhotoPath : $scope.site + user.PhotoPath.replace('_sq.','.')
                                                : (function() {
                                                    Site.photo.get({ UserIDs: user.UserID }).$promise.then(function(u) {
                                                        user.PhotoPath = $scope.site + u[0].PhotoPath.replace('_sq.','.');
                                                    });
                                                })()
                            });
                        },
            stemAdd     : function(user) { if (!$filter('filter')($scope.stems, { UserID: user.UserID }).length) $scope.stems.push($scope.stemInit(user)); },
            stemRemove  : function(user) { $scope.stems.splice(user, 1); },
            stemUpdate  : function (e) {
                            e.preventDefault();
                            var user     = $(e.target).closest('user'),
                                prevNext = !!~[8,37,38].indexOf(e.keyCode) ? 'prev' : 'next';
                            user[prevNext]().focus();
                            if (!!~[8,46, undefined].indexOf(e.keyCode)) {
                                $scope.stemRemove(user.index());
                                user.addClass(prevNext+'-'+e.type);
                            }
                        },
            stemReset   : function () { $scope.stems.length = 0; },
            storage     : localStorage,
            isCards     : localStorage.stemCards == 'true',
            stemSort    : {
                            containment: 'parent', cursor: 'move', opacity: 0.75, revert: 250, tolerance: 'pointer', 'ui-floating': 'auto',
                            stop: function(e, ui) { ui.item[0].removeAttribute('style'); }
                        }
        });
    })
    /*==========  User API Interaction  ==========*/
    .factory('Site', function ($resource) {
        var site       = 'https://genome.klick.com',
            resource   = function(url, params, actions) {
                            return $resource(
                                site + '/api' + url,
                                params || { ForGrid: true },
                                {
                                    get: angular.extend(typeof actions === 'function' ? { transformResponse: actions } : (actions || {}),
                                        {
                                            method: 'JSONP',
                                            params: { format: 'json', callback: 'JSON_CALLBACK' },
                                            interceptor: {
                                                response: function(r) { return r.data.Entries; },
                                                responseError: function(e) { if (~[0, 401, 403].indexOf(e.status)) location.href = site + "login/?t=" + encodeURIComponent(location.href); }
                                            }
                                        })
                                }
                            );
                        };

        return {
            url     : site,
            my      : resource('/user/current'),
            tasks   : resource('/ticket', { ForAutocompleter: true }),
            users   : resource('/user/search'),
            stems   : resource('/user', { UserIDs: '@UserIDs' }),
            photo   : resource('/user/photo', { UserIDs: '@UserIDs' })
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

/*==========  Touch support for jQuery UI  ==========*/
if (('ontouchstart' in window) || (navigator.MaxTouchPoints > 0) || (navigator.msMaxTouchPoints > 0)) {
    var proto = $.ui.mouse.prototype,
        _mouseInit = proto._mouseInit,
        tapTime, tapEl;
    $.extend(proto, {
        _mouseInit: function() {
            this.element.bind("touchstart." + this.widgetName, $.proxy(this, "_touchStart"));
            _mouseInit.apply(this, arguments);
        },
        _touchStart: function(event) {
            if(
                tapEl !== (tapEl = event.originalEvent.target) ||
                (tapTime - (tapTime = new Date().getTime())) < -1000 ||
                event.originalEvent.targetTouches.length != 1
            ) return;
            this.element.bind("touchmove." + this.widgetName, $.proxy(this, "_touchMove"))
                        .bind("touchend." + this.widgetName, $.proxy(this, "_touchEnd"));
            this._modifyEvent(event);
            $(document).trigger($.Event("mouseup")); //reset mouseHandled flag in ui.mouse
            this._mouseDown(event);
            return false;
        },
        _touchMove: function(event) {
            this._modifyEvent(event);
            this._mouseMove(event);
        },
        _touchEnd: function(event) {
            this.element.unbind("touchmove." + this.widgetName)
                        .unbind("touchend." + this.widgetName);
            this._mouseUp(event);
        },
        _modifyEvent: function(event) {
            event.which = 1;
            var target = event.originalEvent.targetTouches[0];
            event.pageX = target.pageX;
            event.pageY = target.pageY;
        }
    });
}
