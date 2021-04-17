const app = angular.module('boardgame', ['LocalStorageModule', 'ngDragDrop', 'ui.bootstrap'], $locationProvider => {
    $locationProvider.html5Mode({
        enabled: true,
        requireBase: false,
        rewriteLinks: false
    });
});

app.factory('socket', () => {
    return io('http://127.0.0.1:3001');
});

updateColumnsPlacement = ($scope) => {
    for (let column=0; column<6; column++) {
        $scope.canPlace = (column) => {
            let canPlace = false;
            if ($scope.config.playerTurn.id === $scope.user.id)
                angular.forEach($scope.userDices.dices, key => {
                    if (key.dice === column)
                        canPlace = true;
                });
            return canPlace;
        }
    }
};

app.controller('playController', ($scope, $http, $location, localStorageService, $q, $uibModal, socket) => {

    $scope.orderByLength = (item) => {
        console.log(item)
    };

    socket.on("configChanged", (config) => {
        $scope.config = config;
        $scope.userDices.dices = $scope.config.users[`${$scope.user.id}`].des;
        if ($scope.config.playerTurn.id === $scope.user.id) {
            let modalInstance = $uibModal.open({
                animation: true,
                templateUrl: 'yourTurn.html',
                controller: 'yourTurnController',
                ariaLabelledBy: 'modal-title',
                ariaDescribedBy: 'modal-body',
                size: 'sm'
            });

            modalInstance.result.then((code) => {
                console.log(code)
            }, () => {
                modalInstance.dismiss('backdrop');
            });
        }

        $scope.$apply();
        updateColumnsPlacement($scope);
    });

    $http.post(`/play/${$location.path().split('/')[2]}`, {}).then((data, error) => {
        if (error) throw error
        $scope.config = data.data.config;
        $scope.userDices = {};
        $scope.user = data.data.user;
        $scope.userDices.dices = data.data.config.users[`${$scope.user.id}`].des;
        localStorageService.set('LasVegasConfig', $scope.config);

        socket.emit("joinParticipate", $scope.config.participateId);

        updateColumnsPlacement($scope);
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

            socket.emit("gameChange", $scope.config);

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
});

app.controller('yourTurnController', ($scope, $uibModalInstance) => {
    $scope.ok = () => {
        $uibModalInstance.close();
    }
});