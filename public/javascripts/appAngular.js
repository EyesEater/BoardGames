const app = angular.module('boardgame', ['LocalStorageModule', 'ngDragDrop', 'ui.bootstrap', 'luegg.directives'], $locationProvider => {
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
            if (!$scope.gameOver && $scope.config.playerTurn && $scope.config.playerTurn.id === $scope.user.id)
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

        if ($scope.config.mancheOver) {
            let user = $scope.user;
            let config = $scope.config;
            let modalInstance = $uibModal.open({
                animation: true,
                templateUrl: 'nextManche.html',
                ariaLabelledBy: 'modal-title',
                ariaDescribedBy: 'modal-body',
                backdrop: 'static',
                size: 'lg',
                controller: ($scope, socket, $uibModalInstance) => {
                    $scope.user = user;
                    $scope.users = config.users;

                    socket.on("someoneReady", (data) => {
                        let user = data.user;
                        let everyoneReady = data.everyoneReady;

                        for (let key in $scope.users) {
                            if ($scope.users.hasOwnProperty(key) && user.id === $scope.users[key].user.id)
                                $scope.users[key].isReady = true;
                        }

                        if (everyoneReady)
                            $uibModalInstance.close();

                        $scope.$apply();
                    });

                    $scope.ready = (user) => {
                        for (let key in $scope.users) {
                            if ($scope.users.hasOwnProperty(key) && user.id === $scope.users[key].user.id)
                                $scope.users[key].isReady = true;
                        }

                        socket.emit("someoneReady", {user: user, config: config});
                    };
                }
            });

            modalInstance.result.then((code) => {
                $scope.$apply();
            }, () => {
                modalInstance.dismiss('backdrop');
            });
        }

        if ($scope.config.playerTurn && $scope.config.playerTurn.id === $scope.user.id) {
            let modalInstance = $uibModal.open({
                animation: true,
                templateUrl: 'yourTurn.html',
                controller: 'yourTurnController',
                ariaLabelledBy: 'modal-title',
                ariaDescribedBy: 'modal-body',
                size: 'sm'
            });

            modalInstance.result.then((code) => {
                $scope.$apply();
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

        let user = $scope.user;
        let config = data.data.config;

        if (config.mancheOver) {

            let modalInstance = $uibModal.open({
                animation: true,
                templateUrl: 'nextManche.html',
                ariaLabelledBy: 'modal-title',
                ariaDescribedBy: 'modal-body',
                backdrop: 'static',
                size: 'lg',
                controller: ($scope, socket, $uibModalInstance) => {
                    $scope.user = user;
                    $scope.users = config.users;

                    socket.on("someoneReady", (data) => {
                        let user = data.user;
                        let everyoneReady = data.everyoneReady;

                        for (let key in $scope.users) {
                            if ($scope.users.hasOwnProperty(key) && user.id === $scope.users[key].user.id)
                                $scope.users[key].isReady = true;
                        }

                        if (everyoneReady)
                            $uibModalInstance.close();

                        $scope.$apply();
                    });

                    $scope.ready = (user) => {
                        for (let key in $scope.users) {
                            if ($scope.users.hasOwnProperty(key) && user.id === $scope.users[key].user.id)
                                $scope.users[key].isReady = true;
                        }

                        socket.emit("someoneReady", {user: user, config: config});
                    };
                }
            });

            modalInstance.result.then((code) => {
                console.log(code)
            }, () => {
                modalInstance.dismiss('backdrop');
            });

        }

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
            if (modalInstance.result) {
                let tmp = [];
                angular.forEach($scope.userDices.dices, (key, dice) => {
                    if (key.dice === column) {
                        tmp.push(key);
                        $scope.config.columns[column - 1].dices.push(key);
                        delete $scope.config.users[`${key.user.id}`].des[`${dice}`];
                    }
                });

                if (!$scope.config.logs)
                    $scope.logs = [];
                $scope.config.logs.push(tmp);
            }

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