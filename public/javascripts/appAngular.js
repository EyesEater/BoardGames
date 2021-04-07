const app = angular.module('boardgame', ['LocalStorageModule', 'ngDragDrop'], $locationProvider => {
    $locationProvider.html5Mode({
        enabled: true,
        requireBase: false,
        rewriteLinks: false
    });
});

app.directive('backImg', () => {
    return function(scope, element, attrs){
        var url = attrs.backImg;
        element.css({
            'background-image': 'url(' + url +')',
            'background-size' : 'cover'
        });
    };
});

app.controller('playController', ($scope, $http, $location, localStorageService, $q) => {

    $http.post(`/play/${$location.path().split('/')[2]}`).then((data, error) => {
        if (error) throw error
        $scope.config = data.data;
        $scope.userDices = {};
        $scope.userDices.dices = data.data.users[`${data.data.user.id}`].des;
        localStorageService.set('LasVegasConfig', data.data);
    });

    $scope.goldenNugget = [];
    $scope.caesarPalace = [];
    $scope.theMirage = [];
    $scope.sahara = [];
    $scope.luxor = [];
    $scope.circusCircus = [];

    $scope.beforeDrop = (event, ui, column) => {
        let deferred = $q.defer();
        if ($scope.d.dice !== column && $scope.d.dice <= 6) {
            deferred.reject()
        } else {
            deferred.resolve()
        }
        return deferred.promise;
    }

    $scope.onStart = (event, ui, d) => {
        $scope.d = d;
    }

    $scope.putAll = (column) => {
        angular.forEach($scope.userDices.dices, (key, dice) => {
            if (key.dice === column) {
                switch (column) {
                    case 1:
                        $scope.goldenNugget.push(key);
                        break;
                    case 2:
                        $scope.caesarPalace.push(key);
                        break;
                    case 3:
                        $scope.theMirage.push(key);
                        break;
                    case 4:
                        $scope.sahara.push(key);
                        break;
                    case 5:
                        $scope.luxor.push(key);
                        break;
                    case 6:
                        $scope.circusCircus.push(key);
                        break;
                    default:
                        break;
                }
                delete $scope.config.users[`${key.user.id}`].des[`${dice}`];
            }
        });
    }
});