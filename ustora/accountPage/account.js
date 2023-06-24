var app = angular.module('myAccount', []);

app.controller('AccountController', function($scope, $http, $window){
    $scope.newUser = {};
    $scope.user = {};
    $scope.userinfo = {};

    $scope.createUser = function(newUser){
        $http.post('http://localhost:8080/api/v1/user/create', newUser)
        .then(function(response){
            console.log(response.data);
            $scope.newUser = {};
            $window.location.href= './loginPage.html'
        },
        function(error) {
            $window.alert('Có lỗi xảy ra khi thêm người dùng mới: ' + error.data.message);
            console.log('Error:', error);
        }
        );
    };

    $scope.loginUser = function(user) {
        $http.post('http://localhost:8080/api/v1/user/login', user)
          .then(function(response) {
            var token = response.data;
            $window.localStorage.setItem('token', token.token);
            console.log('Token saved to localStorage:', token);
            $window.location.href = '../index.html';
          })
          .catch(function(error) {
            var errorMessage = error.data && error.data.message ? error.data.message : 'Có lỗi xảy ra khi đăng nhập';
            $window.alert('Lỗi: ' + errorMessage);
            console.log('Error:', error);
          });
      };

      var token = $window.localStorage.getItem('token');
      if(token) {
        $http.get(`http://localhost:8080/api/v1/user/information/${token}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
        .then(function(response) {
          console.log(response.data);
          $scope.userinfo = response.data;
        }, function(errorResponse) {
          console.log('Error:', errorResponse);
        });
      }
      
});
