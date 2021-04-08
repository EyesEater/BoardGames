const app = angular.module('boardgame', ['LocalStorageModule', 'ngDragDrop', 'ui.bootstrap'], $locationProvider => {
    $locationProvider.html5Mode({
        enabled: true,
        requireBase: false,
        rewriteLinks: false
    });
});

app.controller('playController', ($scope, $http, $location, localStorageService, $q, $uibModal) => {

    $http.post(`/play/${$location.path().split('/')[2]}`, {}).then((data, error) => {
        if (error) throw error
        $scope.config = data.data;
        $scope.userDices = {};
        $scope.userDices.dices = data.data.users[`${data.data.user.id}`].des;
        localStorageService.set('LasVegasConfig', data.data);

        $scope.canPlace = (column) => {
            let canPlace = false;
            angular.forEach($scope.userDices.dices, key => {
                if (key.dice === column)
                    canPlace = true;
            });
            return canPlace;
        }
    });

    $scope.column = {};
    $scope.column.goldenNugget = [];
    $scope.column.caesarPalace = [];
    $scope.column.theMirage = [];
    $scope.column.sahara = [];
    $scope.column.luxor = [];
    $scope.column.circusCircus = [];

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
        let colName = '';
        switch (column) {
            case 1:
                colName = 'Golden Nugget';
                break;
            case 2:
                colName = 'Caesar Palace';
                break;
            case 3:
                colName = 'The Mirage';
                break;
            case 4:
                colName = 'Sahara';
                break;
            case 5:
                colName = 'Luxor';
                break;
            case 6:
                colName = 'Circus Circus';
                break;
            default:
                break;
        }
        let modalInstance = $uibModal.open({
            animation: true,
            templateUrl: 'myModalContent.html',
            controller: 'modalController',
            ariaLabelledBy: 'modal-title',
            ariaDescribedBy: 'modal-body',
            size: 'sm'
        });

        modalInstance.result.then(() => {
            if (modalInstance.result)
                angular.forEach($scope.userDices.dices, (key, dice) => {
                    if (key.dice === column) {
                        switch (column) {
                            case 1:
                                $scope.column.goldenNugget.push(key);
                                break;
                            case 2:
                                $scope.column.caesarPalace.push(key);
                                break;
                            case 3:
                                $scope.column.theMirage.push(key);
                                break;
                            case 4:
                                $scope.column.sahara.push(key);
                                break;
                            case 5:
                                $scope.column.luxor.push(key);
                                break;
                            case 6:
                                $scope.column.circusCircus.push(key);
                                break;
                            default:
                                break;
                        }
                        delete $scope.config.users[`${key.user.id}`].des[`${dice}`];
                    }
                });

            $http.post(`/play/${$location.path().split('/')[2]}/update`, {config: $scope.config}).then(data => {
                console.log(data)
            }, error => {
                console.log(error)
            });

        }, () => {
            modalInstance.dismiss('backdrop');
        });
    }
});

app.controller('modalController', ($scope, $uibModalInstance) => {
    $scope.ok = () => {
        $uibModalInstance.close();
    }

    $scope.cancel = () => {
        $uibModalInstance.dismiss('cancel');
    }
})