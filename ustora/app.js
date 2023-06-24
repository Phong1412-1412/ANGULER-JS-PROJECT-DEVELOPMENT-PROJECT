
var myApp = angular.module('myApp', ['ngRoute']);

// myApp.controller('CategoryController', function($scope, $http) {
//     $scope.categories = [];

//     $http.get('http://localhost:8080/api/v1/category/getAll')
//     .then(function(response) {
//       $scope.categories = response.data;
//     }, function(error) {
//       console.log('Error:', error);
//     });
// });

myApp.filter('formatCurrencyVND', function() {
  return function(number) {
    return number.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
  };
});

myApp.filter('formatDateTime', function() {
  return function(dateTime) {
    var formattedDateTime = new Date(dateTime).toLocaleString('vi-VN');
    return formattedDateTime;
  };
});

myApp.controller('HeaderController',  function($scope, $http, $window) {
  $scope.acctions = "";
  var token = $window.localStorage.getItem('token');
  if(!token) {
    $scope.acctions = "Đăng nhập";
  }
  else {
    $scope.acctions = "Đăng xuất";
  }

  $scope.logout = function() {
    $http.delete('http://localhost:8080/api/v1/user/logout')
    .then(function(response) {
      $window.localStorage.removeItem('token');
      $window.location.href = "./accountPage/loginPage.html";
      $scope.acctions = "login";
    }, function(errorResponse) {
      console.log('Error:', errorResponse);
    });
  };
});


myApp.controller('ProductController', function($scope, $http, $window, CartService) {
    $scope.products = [];
    $http.get('http://localhost:8080/api/v1/product/getAll')
    .then(function(response) {
      $scope.products = response.data;
    }, function(error) {
      console.log('Error:', error);
    });

    $scope.handleAddToCart = function(product, quantity) {
      var cartItem = {
       productId: product.id,
       name: product.name,
       price: product.price,
       quantity: quantity,
       image: product.image,
       totalPrice: product.price * quantity
      };
 
      CartService.addToCart(cartItem);
 
      $window.alert("Cart added successfully");
    }
});

myApp.controller('SingleProductController', function($scope, $http, $window, CartService) {
  var url = new URL(window.location.href);
  var id = url.searchParams.get('id');
  var productName = url.searchParams.get('productName');
  $scope.product = {}; // Sửa tên biến thành 'product'
  if(id) {
    $http.get(`http://localhost:8080/api/v1/product/get/${id}`)
   .then(function(response) {
     $scope.product = response.data;

     if (Object.keys($scope.product).length === 0) {
       console.log('Dữ liệu sản phẩm không tồn tại.');
    } else {
       console.log('Dữ liệu sản phẩm:', $scope.product);
    }
   }, function(error) {
     console.log('Error:', error);
   });
  } else {
    $http.get(`http://localhost:8080/api/v1/product/find?productName=${productName}`)
    .then(function(response) {
      $scope.product = response.data;
    }, function(error) {
      $window.alert("ERROR: "+ error);
    });
  }
  
   $scope.handleAddToCart = function(product, quantity) {
     var cartItem = {
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: quantity,
      image: product.image,
      totalPrice: product.price * quantity
     };

     CartService.addToCart(cartItem);

     $window.alert("Cart added successfully");
   }
});

myApp.factory('AuthInterceptor', function($q, $window) {
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
          alert("Vui lòng đăng nhập trước khi thực hiện hành động trên!");
          $window.location.href = './accountPage/loginPage.html';
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

myApp.config(function($httpProvider) {
  // Đăng ký interceptor
  $httpProvider.interceptors.push('AuthInterceptor');
});


myApp.factory('CartService', function() {
  var cartItems = JSON.parse(localStorage.getItem('cart')) || [];

  function savedCartItems() {
    localStorage.setItem('cart', JSON.stringify(cartItems));
  }
  return {
    getCartItems: function() { return cartItems; },
    addToCart: function(item) {
      var existingItem = cartItems.find((product) => product.productId === item.productId);
      if(existingItem) {
        existingItem.quantity += item.quantity;
        existingItem.totalPrice += item.totalPrice;
        console.log(existingItem);  
      }
      else {
        cartItems.push(item); 
      }
       savedCartItems();
      },
      updateCartItems: function(items) {
        cartItems = angular.forEach(items, function(item) {
          item.totalPrice = item.quantity * item.price;
        });
        savedCartItems();
      },
      deleteToCart: function(deleteItem) {
        var index = cartItems.findIndex((item) => item.productId === deleteItem.productId);
        if(index != -1) { 
          cartItems.splice(index, 1);
          savedCartItems();
        }
      },
    clearCart: function() { cartItems = []; savedCartItems(); }  
  }
});

myApp.controller('CartController', function($scope, $http, $window, CartService) {
  $scope.totalOrder = 0;
  $scope.cartItems = CartService.getCartItems();
  $scope.userinfo = {};

  // The $watch function will monitor changes to cartItems
  $scope.$watch(function() {
    return CartService.getCartItems();
  }, function(newCartItems) {
    $scope.cartItems = newCartItems;
    $scope.calculateTotalOrder();
  }, true);

  $scope.calculateTotalOrder = function() {
    $scope.totalOrder = 0;
    angular.forEach($scope.cartItems, function(item) {
      $scope.totalOrder += item.totalPrice;
    });
  };

  $scope.handleDeleteCartItem = function(item) {
    CartService.deleteToCart(item);
    $scope.calculateTotalOrder();
  }

  $scope.decreaseQuantity = function(item, cartItems) {
    if (item.quantity > 0) {
        item.quantity--;
        CartService.updateCartItems(cartItems);
        $scope.calculateTotalOrder();
    }
};

  $scope.increaseQuantity = function(item, cartItems) {
      item.quantity++;
      CartService.updateCartItems(cartItems);
      $scope.calculateTotalOrder();
  }; 

  $scope.handleDeleteCart = function() {
    if(confirm("Bạn có chắc chắn muốn xóa giỏ hàng?")) {
      CartService.clearCart();
    }
  }

  var token = $window.localStorage.getItem('token');
      if(token) {
        $http.get(`http://localhost:8080/api/v1/user/information/${token}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
        .then(function(response) {
          $scope.userinfo = response.data;
        }, function(errorResponse) {
          console.log('Error:', errorResponse);
        });
      }

  $scope.handlePayment = function() {
    $scope.orderResponse = {};
    var orderRequest = JSON.stringify($scope.cartItems)
    $http.post(`http://localhost:8080/api/v1/order/create/${$scope.userinfo.id}`, orderRequest)
    .then(function(response) {
      console.log(response.data);
      CartService.clearCart();
      $window.alert("Đã đặt hàng thành công.");
      $('#addProductModal').modal('show');
      
      $http.get(`http://localhost:8080/api/v1/order/${$scope.userinfo.id}/${response.data.id}`)
      .then(function(response) {
        $scope.orderResponse.order = response.data.order;
        $scope.orderResponse.orderDetailResponses = response.data.orderDetailResponses;
      })
      .catch(function(error) {
        console.log("Error: " + error);
      });
    })
    .catch(function(error) {
      var errorMessage = error.data && error.data.message ? error.data.message : 'Có lỗi xảy ra khi thêm mới order';
      $window.alert('Lỗi: ' + errorMessage);
      console.log('Error:', error);
    });
  }

});

myApp.value('orderStatus', 'PREPARE');


myApp.config(function($routeProvider) {
  $routeProvider
    .when('/', {
      templateUrl: 'index.html'
    })
    .when('/orderPerpare', {
      templateUrl: './OrderLayout/orderPerpare.html',
      controller: 'MyOrderController',
      resolve: {
        orderStatus: function() {
          return 'PREPARE';
        }
      }
    })
    .when('/orderOngoing', {
      templateUrl: './OrderLayout/orderOngoing.html',
      controller: 'MyOrderController',
      resolve: {
        orderStatus: function() {
          return 'ONGOING';
        }
      }
    })
    .when('/orderComplete', {
      templateUrl: './OrderLayout/orderComplete.html',
      controller: 'MyOrderController',
      resolve: {
        orderStatus: function() {
          return 'COMPLETE';
        }
      }
    })
});

myApp.controller('MyOrderController', function($scope, $http, $window, orderStatus) {
  $scope.userinfo = {};
  $scope.orders = [];
  $scope.orderDetails = {};
  var token = $window.localStorage.getItem('token');
  if(token) {
    $http.get(`http://localhost:8080/api/v1/user/information/${token}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    .then(function(response) {
      $scope.userinfo = response.data;
      return $http.get(`http://localhost:8080/api/v1/order/get/${$scope.userinfo.id}/${orderStatus}`);

    })
    .then(function(response) {
      $scope.orders = response.data;
    })
    .catch(function(errorResponse) {
      console.log('Error:', errorResponse);
    });

    $scope.handleOpenOrderDetail = function(order) {
      $('#addProductModal').modal('show');
      $scope.orderDetails = order;
      console.log( $scope.orderDetails);
    }
  }



  $http.get(`http://localhost:8080/api/v1/orderDetail/user/all`)
  .then(function(response) {
    $scope.orderDetails = response.data;
    console.log(response.data);
  }, function(error) {
    console.log('Error:', error);
  });



});

myApp.controller('SearchController', function($scope, $http, $window) {
  $scope.searchItem = '';
  $scope.handleSearchProduct = function() {
   var searchUrl = 'single-product.html?productName=' + $scope.searchItem;
   $http.get(`http://localhost:8080/api/v1/product/find?productName=${$scope.searchItem}`)
   .then(function(response) {
    $window.location.href = searchUrl;
   })
   .catch(function(error){
    $window.alert("Error: Không tìm thấy sản phẩm có tên: "+$scope.searchItem);
   });
  }
});