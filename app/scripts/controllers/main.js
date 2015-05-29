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
                                PhotoPath       : user.PhotoPath ? ~user.PhotoPath.indexOf(Site.url) ? user.PhotoPath : Site.url + user.PhotoPath
                                                : (function() {
                                                    Site.photo.get({ UserIDs: user.UserID }).$promise.then(function(u) {
                                                        user.PhotoPath = Site.url + u[0].PhotoPath;
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
            stemView    : localStorage.stemView || 'grid',
            stemSort    : {
                            containment: 'parent', cursor: 'move', opacity: 0.75, revert: 250, tolerance: 'pointer', 'ui-floating': 'auto',
                            stop: function(e, ui) { ui.item[0].removeAttribute('style'); }
                        }
        });
    })
    /*==========  User API Interaction  ==========*/
    .factory('Site', function ($resource) {
        var site       = 'http://genome.klick.com',
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
            tasks   : resource('/ticket'),
            users   : resource('/user'),
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
        touchStartTime, touchStartElement;
    $.extend(proto, {
        _mouseInit: function() {
            this.element.bind("touchstart." + this.widgetName, $.proxy(this, "_touchStart"));
            _mouseInit.apply(this, arguments);
        },
        _touchStart: function(event) {
            if(
                event.originalEvent.targetTouches.length != 1 ||
                (touchStartTime - (touchStartTime = new Date().getTime())) < -2000 ||
                touchStartElement !== (touchStartElement = event.originalEvent.target)
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