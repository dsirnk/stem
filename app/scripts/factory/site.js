'use strict';

angular
    .module('stemApp')
    /*==========  User API Interaction  ==========*/
    .factory('Site', function ($resource) {
        var site = 'http://genome.klick.com',
            siteAPI = site + '/api',
            siteParams = { method: 'JSONP', params: { format: 'json', callback: 'JSON_CALLBACK' } };

        return {
            You     : $resource(siteAPI + '/User/Current',
                        { ForAutocompleter: true, ForGrid: true },
                        { get: angular.extend({ transformResponse: function (r) {
                                return r.Entries[0];
                            }
                        }, siteParams)}
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