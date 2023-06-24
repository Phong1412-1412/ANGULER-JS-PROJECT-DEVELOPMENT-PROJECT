var app = angular.module('myAccount', []);
app.controller('AccountController', function($scope, $http, $window){
    $scope.user = {};
    $scope.userinfo = {};
    
    function getUserInfo(token) {
      return new Promise(function(resolve, reject) {
        $http.get(`http://localhost:8080/api/v1/user/information/${token}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
        .then(function(response) {
          $scope.userinfo = response.data;
          resolve();
        })
        .catch(function(errorResponse) {
          console.log('Error:', errorResponse);
          reject(errorResponse);
        });
      });
    }

    $scope.loginUser = function(user) {
        $http.post('http://localhost:8080/api/v1/user/login', user)
          .then(function(response) {
            var token = response.data.token;
            $window.localStorage.setItem('token', token);
            if (token) {
              getUserInfo(token)
                .then(function() {
                  console.log($scope.userinfo);
                  if ($scope.userinfo && $scope.userinfo.userRole.includes('ROLE_ADMIN')) {
                    // Chuyển đến trang index
                    $window.location.href = '../tables.html';
                  } else {
                    // Thông báo đăng nhập lại
                    $window.alert('Bạn không có quyền truy cập vào trang index');
                    // Xóa token khỏi localStorage
                    $window.localStorage.removeItem('token');
                  }
                })
                .catch(function(error) {
                  console.log('Error:', error);
                });
            }
          })
          .catch(function(error) {
            var errorMessage = error.data ? error.data : 'Tài khoản hoặc mật khẩu không chính xác';
            $window.alert('Lỗi: ' + errorMessage);
            console.log('Error:', error);
          });
    }; 
});
