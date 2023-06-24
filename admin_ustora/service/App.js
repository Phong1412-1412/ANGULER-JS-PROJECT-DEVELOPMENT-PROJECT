var myTable = angular.module('myTable', ['ngRoute']);

myTable.config(function($routeProvider) {
  $routeProvider
  .when("/user", {
    templateUrl: "../tableLayout/user.html"
  })
  .when("/category", {
    templateUrl: "../tableLayout/category.html"
  })
  .when("/product", {
    templateUrl: "../tableLayout/product.html",
    controller: "ProductController"
  })
  .when("/order", {
    templateUrl: "../tableLayout/order.html"
  });
});

myTable.filter('formatCurrencyVND', function() {
  return function(number) {
    return number.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
  };
});

myTable.filter('formatDateTime', function() {
  return function(dateTime) {
    var formattedDateTime = new Date(dateTime).toLocaleString('vi-VN');
    return formattedDateTime;
  };
});

myTable.controller('ProductController', function($scope, $http, $window) {
    $scope.products = [];
    $scope.newProduct = {};
    $scope.isEditMode = false;

    $scope.handleCloseForm = function() {
      $('#addProductModal').modal('hide');
      $('#addProductModal').on('hidden.bs.modal', function() {
      $scope.isEditMode = false;
      $scope.newProduct= {};
    });};

    $http.get('http://localhost:8080/api/v1/product/getAll')
    .then((response) => {$scope.products = response.data;}
    , function(error) {
        console.log('Error:', error);
      }
    )

    function uploadImage(imageData, callback) {
      var formData = new FormData();
      formData.append('image', imageData);
  
      $http.post('http://localhost:8080/api/v1/product/upload', formData, {
          transformRequest: angular.identity,
          headers: { 'Content-Type': undefined }
      })
      .then(function(response) {
          // Hình ảnh đã được tải lên thành công
          // Gọi hàm callback và truyền tên hình ảnh trả về từ server
          callback(response.data.imageName);
      }, function(error) {
          $window.alert('Có lỗi xảy ra khi tải lên hình ảnh: ' + error.data.message);
          console.log('Error:', error);
      });
  }  

    $('#addProductModal').on('hidden.bs.modal', function() {
      $scope.isEditMode = false;
      $scope.newProduct= {};
    });

    $scope.previewImage = function(input) {
      if(input.files && input.files[0]) {
        var reader = new FileReader();

        reader.onload = function(e) {
          $scope.$apply( function() {
            $scope.newProduct.image = e.target.result;
          });
        };
        reader.readAsDataURL(input.files[0]);
      }
    };

    // Hàm chuyển đổi chuỗi hình ảnh thành đối tượng File
    function dataURLtoFile(dataURL, fileName) {
      var arr = dataURL.split(','), mime = arr[0].match(/:(.*?);/)[1],
          bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      return new File([u8arr], fileName, { type: mime });
    }
      
    $scope.addProduct = function(newProduct) {
      if ($scope.isEditMode === false) {
        // Chuyển đổi chuỗi hình ảnh thành đối tượng File
        var imageFile = dataURLtoFile(newProduct.image, "product-image"); 

          // Đẩy hình ảnh lên server
          uploadImage(imageFile, function(imageName) {
              newProduct.image = imageName;
  
              // Gửi yêu cầu thêm sản phẩm với thông tin đã cập nhật
              $http.post('http://localhost:8080/api/v1/product/create', newProduct)
                  .then(function(response) {
                      // Thêm sản phẩm thành công
                      // Cập nhật danh sách sản phẩm
                      $scope.products.push(response.data);
  
                      // Xóa dữ liệu trong form
                      $scope.newProduct = {};
                      // Đóng modal
                      $('#addProductModal').modal('hide');
                  }, function(error) {
                      $window.alert('Có lỗi xảy ra khi thêm sản phẩm: ' + error.data.message);
                      console.log('Error:', error);
                  });
          });
      }
        else {
            var confirmation = confirm('Bạn có chắc chắn muốn cập nhật sản phẩm này?');
            if(confirmation) {
              var imageFile = dataURLtoFile(newProduct.image, "product-image"); 

              // Đẩy hình ảnh lên server
              uploadImage(imageFile, function(imageName) {
              newProduct.image = imageName;
                $http.put('http://localhost:8080/api/v1/product/update', newProduct)
                .then(function(response) {
    
                    var index = $scope.products.findIndex(function(product) {
                        return product.id === newProduct.id;
                    });
                    if(index !== -1) {
                        $scope.products[index] = response.data;
                    }
    
                    $scope.newProduct = {};
                    // Đóng modal
                    $scope.isEditMode = false;
                    $('#addProductModal').modal('hide');
                }, function(error) {
                    
                    $window.alert('Có lỗi xảy ra khi thêm sản phẩm: ' + error.data.message);
        
                    console.log('Error:', error);
                });
              });
            }
        }
    }

    $scope.deleteProduct = function(productId) {
        var confirmation = confirm('Bạn có chắc muốn xóa sản phẩm này không?');
        if(confirmation) {
            $http.delete(`http://localhost:8080/api/v1/product/delete/${productId}`)
            .then(function(response) {
                // Xóa sản phẩm thành công
                // Cập nhật danh sách sản phẩm
                var index = $scope.products.findIndex(function(product) {
                    return product.id === productId;
                });
                if (index !== -1) {
                    $scope.products.splice(index, 1);
                }
            }, function(error) {
                 $window.alert('Có lỗi xảy ra khi xóa sản phẩm: ' + error.data.message);
                 console.log('Error:', error);
            });
        }
     }  

     $scope.editProduct = function(product) {
        $scope.newProduct = {
            id: product.id,
            name: product.name,
            price: product.price,
            description: product.description,
            image: `./img/`+product.image,
            categoryId: product.category.id
        };
        $scope.previewImage(document.getElementById('productImage'));
        $('#addProductModal').modal('show');
        $scope.isEditMode = true;
        console.log($scope.newProduct.image);
        // hidden.bs.modal là một sự kiện được kích hoạt khi
        // modal đóng lại. Khi sự kiện này xảy ra, resetNewProduct
        $('#addProductModal').on('hidden.bs.modal', function() {
            $scope.isEditMode = false;
            $scope.newProduct= {};
        });
    };
});

myTable.controller('getAllCategory', function($scope, $http){
    $scope.categories = [];

    $http.get('http://localhost:8080/api/v1/category/getAll')
      .then(function(response) {
        $scope.categories = response.data;
      }, function(error) {
        console.log('Error:', error);
      });
});


myTable.factory('AuthInterceptor', function($q, $window) {
    return {
      request: function(config) {
        // Thêm tiêu đề Authorization vào mỗi yêu cầu HTTP
        config.headers = config.headers || {};
        var token = $window.localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = 'Bearer ' + token;
        }
        return config;
      },
      responseError: function(rejection) {
        // Xử lý lỗi xác thực, ví dụ: chuyển hướng đến trang đăng nhập hoặc trang thông báo lỗi
        if (rejection.status === 401 || rejection.status === 403) {
          // Kiểm tra nếu lỗi là do chưa đăng nhập (chưa có token trong localStorage)
          var token = $window.localStorage.getItem('token');
          if (!token) {
            // Do something khi người dùng chưa đăng nhập
            // Ví dụ: Hiển thị thông báo cần phải đăng nhập
            alert("Vui lòng đăng nhập tài khoản admin trước khi thực hiện hành động trên!");
            $window.location.href = '../index.html';
          } else {
            // Do something khi token hết hạn hoặc không hợp lệ
            // Ví dụ: Chuyển hướng đến trang thông báo lỗi xác thực
            $window.location.href = '/auth-error';
          }
        }
        return $q.reject(rejection);
      }
    };
  });
  
myTable.config(function($httpProvider) {
    // Đăng ký interceptor
    $httpProvider.interceptors.push('AuthInterceptor');
});

myTable.controller('logoutController', function($scope, $http){
  $scope.handleLogout = function() {
    $http.delete('http://localhost:8080/api/v1/user/logout')
    .then(function(response) {
      $window.localStorage.removeItem('token');
      $window.location.href = "../index.html";
    }, function(errorResponse) {
      console.log('Error:', errorResponse);
    });
  };
});

myTable.controller('UserController', function($scope, $http, $window) {
  $scope.users = [];
  $scope.newUser = {};
  $scope.isEditMode = false;
  $http.get('http://localhost:8080/api/v1/user/getAll')
  .then((response) => {$scope.users = response.data;}
  , function(error) {
      console.log('Error:', error);
    }
  )
    

  $scope.addUser = function(newUser) {
      if($scope.isEditMode === false) {
          $http.post('http://localhost:8080/api/v1/user/create', newUser)
          .then(function(response) {
              // Thêm sản phẩm thành công
              // Cập nhật danh sách sản phẩm
              $scope.users.push(response.data);
              
              // Xóa dữ liệu trong form
              $scope.newUser = {};
              
              // Đóng modal
              $('#addProductModal').modal('hide');
          }, function(error) {
              
              $window.alert('Có lỗi xảy ra khi thêm người dùng: ' + error.data.message);
  
              console.log('Error:', error);
          });
      }
      else {
          var confirmation = confirm('Bạn có chắc chắn muốn cập nhật người dùng này?');
          console.log(newUser);
          if(confirmation) {
              $http.put(`http://localhost:8080/api/v1/user/update?userId=${newUser.id}`, newUser)
              .then(function(response) {
  
                  var index = $scope.users.findIndex(function(user) {
                      return user.id === newUser.id;
                  });
                  if(index !== -1) {
                      $scope.users[index] = response.data;
                  }
  
                  $scope.newUser = {};
                  // Đóng modal
                  $scope.isEditMode = false;
                  $('#addProductModal').modal('hide');
              }, function(error) {
                  
                  $window.alert('Có lỗi xảy ra khi cập nhật người dùng: ' + error.data);
      
                  console.log('Error:', error);
              });
          }
      }
  }

  $scope.deleteUser = function(userId) {
      var confirmation = confirm('Bạn có chắc muốn xóa người dùng này không?');
      if(confirmation) {
          $http.delete(`http://localhost:8080/api/v1/user/delete?userId=${userId}`)
          .then(function(response) {
              // Xóa sản phẩm thành công
              // Cập nhật danh sách sản phẩm
              var index = $scope.users.findIndex((user) => user.id === userId);
              if (index !== -1) {
                  $scope.users.splice(index, 1);
              }
          }, function(error) {
               $window.alert('Có lỗi xảy ra khi xóa sản phẩm: ' + error.data);
               console.log('Error:', error);
          });
      }
   }  

   $scope.editUser = function(user) {
      $scope.newUser = {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          password: user.password,
          avatar: user.image,
          userRole: user.userRole
      };
      $('#addProductModal').modal('show');
      $scope.isEditMode = true;
      console.log($scope.newUser);
      // hidden.bs.modal là một sự kiện được kích hoạt khi
      // modal đóng lại. Khi sự kiện này xảy ra, resetNewProduct
      $('#addProductModal').on('hidden.bs.modal', function() {
          $scope.isEditMode = false;
          $scope.newUser= {};
      });
  };
});


myTable.controller('CategoryController', function($scope, $http, $window) {
  $scope.categories = [];
  $scope.newUser = {};
  $scope.isEditMode = false;
  $http.get('http://localhost:8080/api/v1/category/getAll')
  .then((response) => {$scope.categories = response.data;}
  , function(error) {
      console.log('Error:', error);
    }
  )
});

myTable.controller('OrderController', function($scope, $http) {
  $scope.orders = [];
  $scope.status = '';
  $scope.orderUpdate = {};
  $scope.orderResponse = {};
  $scope.isEditMode = false;

  $http.get('http://localhost:8080/api/v1/order/getAll')
  .then(function(response) {
    $scope.orders = response.data;
  })
  .catch(function(error) {
    console.log('Error:', error);
  });

  // Hàm để lấy danh sách đơn hàng dựa trên trạng thái đã chọn
  $scope.getOrdersByStatus = function(status) {
    if(status === '') {
      $http.get('http://localhost:8080/api/v1/order/getAll')
        .then(function(response) {
          $scope.orders = response.data;
        })
        .catch(function(error) {
          console.log('Error:', error);
        });
    }
    else {
      var url = 'http://localhost:8080/api/v1/order/get/status/' + status;
      $http.get(url)
        .then(function(response) {
          $scope.orders = response.data;
        })
        .catch(function(error) {
          console.log('Error:', error);
        });
    }
  };

  $scope.onStatusChange = function() {
    var selectedStatus = $scope.status;
    $scope.getOrdersByStatus(selectedStatus);
  };

  $scope.cancel = function() {
    $('#addProductModal').modal('hide');
  };

  $scope.handleOpenOrderDetail = function(userId, orderId) {
    $scope.isEditMode = true;
    $('#addProductModal').modal('show');
    $('#addProductModal').on('hidden.bs.modal', function() {
      $scope.isEditMode = false;
      $scope.orderResponse = {};
    });

    $http.get(`http://localhost:8080/api/v1/order/${userId}/${orderId}`)
      .then(function(response) {
        $scope.orderResponse.order = response.data.order;
        $scope.orderResponse.orderDetailResponses = response.data.orderDetailResponses;
      })
      .catch(function(error) {
        console.log("Error: " + error);
      });
  };

  $scope.updateOrder = function(orderId, orderStatus) {
    $scope.orderUpdate = {
      orderId: orderId,
      orderStatus: orderStatus
    };
    $http.put('http://localhost:8080/api/v1/order/update', $scope.orderUpdate)
    .then(function(response) {
      console.log(response.data.id);
      var index = $scope.orders.findIndex((order) => order.id === response.data.id);
      if(index !== -1) {
        $scope.orders[index] = response.data;
      }
      $('#addProductModal').modal('hide');
    })
    .catch((err) => {console.log(err);});
  };

  
  $scope.deleteOrder = function(orderId) {
    var confirmation = confirm('are you sure delete this order?');
    if(confirmation) {
      $http.delete(`http://localhost:8080/api/v1/order/delete?orderId=${orderId}`)
      .then(function(response) {
        alert('Delete Order Successful');
        $('#addProductModal').modal('hide');
        var index = $scope.orders.findIndex((order) => order.id === orderId);
        if(index !== -1) {
          $scope.orders.splice(index, 1);
        }
      });
    }
    }
});

