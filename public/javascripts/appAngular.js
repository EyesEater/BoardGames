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
            if ($scope.config.playerTurn.id === $scope.config.user.id)
                angular.forEach($scope.userDices.dices, key => {
                    if (key.dice === column)
                        canPlace = true;
                });
            return canPlace;
        }
    });

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
                        $scope.config.columns[column-1].dices.push(key);
                        delete $scope.config.users[`${key.user.id}`].des[`${dice}`];
                    }
                });

            $http.post(`/play/${$location.path().split('/')[2]}/update`, {config: $scope.config}).then(data => {
                console.log(data.data)
                $scope.config = data.data;
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