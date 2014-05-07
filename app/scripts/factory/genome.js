'use strict';

var genome = 'http://genome.klick.com',
    genomeAPI = genome + '/api',
    genomeParams = { method: 'JSONP', params: { format: 'json', callback: 'JSON_CALLBACK' } };

angular
  /*==========  User API Interaction  ==========*/
  .factory('Genome', function ($resource) {
    return {
      Users: $resource(
        genomeAPI + '/User',
        { ForAutocompleter: true, ForGrid: true },
        { get: genomeParams }
      ),
      User: $resource(
        genomeAPI + '/User',
        { UserID: '@UserID' },
        { get: angular.extend({ transformResponse: function (r) {
            r.Entries[0].PhotoPath = genome + r.Entries[0].PhotoPath;
            return r.Entries[0];
          }},
          genomeParams
        )}
      ),
      Tickets: $resource(
        genomeAPI + '/Ticket',
        { ForAutocompleter: true, ForGrid: true },
        { get: genomeParams }
      ),
      Ticket: $resource(
        genomeAPI + '/Ticket',
        { TicketID: '@TicketID' },
        { get: genomeParams }
      ),
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