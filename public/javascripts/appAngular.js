const app = angular.module('boardgame', ['LocalStorageModule', 'ngDragDrop'], $locationProvider => {
    $locationProvider.html5Mode({
        enabled: true,
        requireBase: false
    });
});

app.controller('playController', ($scope, $http, $location, localStorageService) => {
    localStorageService.remove('LasVegasConfig');
    if (!localStorageService.get('LasVegasConfig'))
        $http.post(`/play/${$location.path().split('/')[2]}`).then((data, error) => {
            if (error) throw error
            $scope.config = data.data;
            localStorageService.set('LasVegasConfig', data.data);
        });
    else
        $scope.config = localStorageService.get('LasVegasConfig');
});