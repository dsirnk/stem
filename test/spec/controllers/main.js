'use strict';

describe('Controller: MainCtrl', function () {

  // load the controller's module
  beforeEach(module('stemApp'));

  var MainCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    MainCtrl = $controller('MainCtrl', {
      $scope: scope
    });
  }));

  it('should have a input accepting First Name or Last Name', function () {
    expect(scope.userSelected.length).toBe(0);
  });
});
