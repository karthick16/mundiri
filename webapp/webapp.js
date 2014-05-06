angular.module('backend', ['ngResource']).
    factory('User', function($resource) {
      var User = $resource('/api/user');
      console.log(User);
      return User;
    }).
    factory('Products', function($resource) {        
      }).
      factory('ContentList', function($resource) {        
      }).
      factory('feedList', function($resource) {        
      })
    ;

// all for listing all the contents
// /welcome for seeing the content along with the recommendations.

/*angular.module('Freader', ['backend'])
	.config(function ($routeProvider) {   
		$routeProvider.
			when("/", {controller: loginCtrl, template: document.getElementById('loginView').text}).
			when("/feeds", {controller: feedsCtrl, template: document.getElementById('feedsView').text}).
			when("/addProducts", {controller: addProductsAdminCtrl, template: document.getElementById('adminView_product').text}).
			when("/addContent", {controller: addContentCtrl,template: document.getElementById('contentRecommendationView').text}).
			when("/all", {controller: allContentPageCtrl,template: document.getElementById('allContents').text}).
			otherwise({redirectTo:'/'});
	});*/


angular.module('Freader', ['backend'])
.config(function ($routeProvider) {
	$routeProvider.
		when("/", {controller: loginCtrl,  template: document.getElementById('loginView').text}).
		when("/feeds", {controller: feedsCtrl, templateUrl:  'feedList.html'}).
		when("/addProducts", {controller: addProductsAdminCtrl, templateUrl : 'product/addProducts.html'}).
		when("/editProducts/:productId", {controller: editProductsAdminCtrl, templateUrl : 'product/editProducts.html'}).
		when("/addContent", {controller: addContentCtrl,templateUrl: 'content/addContent.html'}).
		when("/editContent/:contentId", {controller: editContentCtrl,templateUrl: 'content/editContent.html'}).
		when("/all", {controller: allContentPageCtrl,templateUrl : 'home1.html'}).
		when("/details/:articleId", {controller: detailPageCtrl,templateUrl : 'details1.html'}).
		when("/seed", {controller: seedFeedCtrl,templateUrl : 'feedList.html'}).
		when("/deleteFeedIndex", {controller: deleteFeedIndex,templateUrl : 'details1.html'}).
		otherwise({redirectTo:'/'});
	
});

/**
 * 
 * TODO IMPORTANT TO HIDE THIS.
 * Delete the feed index to clean up the data.
 * @param $scope
 * @param $resource
 * @param $location
 */
function deleteFeedIndex($scope,$resource, $location) {
	$resource('/deleteFeedIndex').query();
	$location.path("/all");
}

function seedFeedCtrl($scope,$resource, $location) {	
	$resource('/feedSeeding').query();
	//$location.path("/all");
}  


/**
 * For the detailed page when the user clicks a content from home page.
 */
function detailPageCtrl($scope,$resource, $location,$routeParams) {	
	//search products to be added to content recommendation
	searchProductCommonCode($scope, $resource, $location);
	
	//If the user is not loggedin
	console.log(connected);
	if (connected){
		$scope.allowEdit = true;  
	}else{
		$scope.allowEdit = false;
	}	
		
	
	$resource('/getArticleById').save({articleId: $routeParams.articleId},function(data){		
		$scope.article = data.storage[0];	
		console.log("article --> " , $scope.article);
		
		//If annotated prodcuts is null,means if this is the first time admin is addding products to the article	
		if($scope.article._source.annotatedProducts == null )
			$scope.article._source.annotatedProducts = new Array();	
		
		
		var productIds = [];
		//Get products ids from the content object to show.		
		angular.forEach($scope.article._source.annotatedProducts, function(product){			
			productIds.push(product.id);
		});
		console.log("Products--->" , productIds);
		//Once we get the article,we can get the product details from this restful all.
		//WE DONT NEED THIS CALL AS OF NOW SINCE WE STORE THE PRODUCT INFO INTO THE FEED INDEX
		/*$resource('/searchProductsByIds').save({ids:productIds},function(data){			
			$scope.article._source.annotatedProducts = data.storage;			
			if($scope.article._source.annotatedProducts ==null )
				$scope.article._source.annotatedProducts = new Array();	
			
		});	*/	
	});	
	
	$scope.removeArticle = function(index){
		$scope.article._source.annotatedProducts.splice(index, 1);
	}
	
	//Add a product to the article.
	$scope.addProduct = function(product){		
		var temp = new Object();		
		temp.id= product._id;
		temp.product_url= product._source.product_url;
		temp.annotation= "";
		temp.product_title= product._source.product_title;
		temp.seed_annotation= product._source.product_annotation;		
	    $scope.article._source.annotatedProducts.push(temp);	    
	}
	
	//Save article Recommendation
	$scope.updateArticleRecommendation = function(){
		console.log("Update Article" , $scope.article);
		$resource('/updateArticleRecommendation').save({'article': $scope.article},  function () {
				console.log("Successfully indexed *******************");
		});
	}
	
	
	//Update the article when the admin adds a product
	$scope.updateArticle = function(){
		  //console.log("Update Recommendation---------->" ,$scope.article);
		  $resource('/updateArticleRecommendation').save({'article':$scope.article},  function () {
			  console.log("Article update successful");
		  });
	}
}

function loginCtrl($scope, $resource, $location) {
	if (connected)
		return $location.path("/feeds");
	$scope.email="karthik1@smarthires.com";
	$scope.password="desikan12";
	var action = "login";
	var loginText = {
		action: "Login",
		changeAction: "No account ? Register here"
	};
	var registerText = {
		action: "Register",
		changeAction: "Already have an account ? Login here"
	};

	$scope.text = (action == "login") ? loginText : registerText;

	$scope.changeAction = function() {
		action = (action == "login") ? "register" : "login";
		$scope.text = (action == "login") ? loginText : registerText;
	};

	$scope.action = function() {
		delete $scope.errorMsg;
		var infos = {
			email: $scope.email,
			password: $scope.password
		}
		if (action == "login")
			$resource('/api/login').get(infos, actionSuccess, actionFail);
		else
			$resource('/api/user').save(infos, actionSuccess, actionFail);
	}

	actionSuccess = function() {
		connected = true;
		$location.path("/all");
	}
	actionFail = function (response) {
		if (action == "login" && response.status == 401)
			$scope.errorMsg = "Wrong email or password";
		else if (action == "register" && response.status == 409)
			$scope.errorMsg = "Email already registered";
		else
			$scope.errorMsg = "Can't connect to server";
		console.log('Fail !');
	}
}

function feedsCtrl($scope, $resource, $location) {
	

	
	if (!connected)
		return $location.path("/");


	$scope.disconnect = function() {
		$resource('/api/login').delete({}, function () {
			connected = false;
			$location.path("/");
		});
	}

	$scope.feeds = $resource('/api/feeds').query();

	$scope.addFeed = function() {
		$scope.addFeedLoading = true;
		console.log("Add feed------->");
		var newFeed = $resource('/api/feed').save({url: $scope.newFeedUrl}, function () {
			console.log("Feed added !");
			delete $scope.addErrorText;
			$scope.feeds.push(newFeed);
			$scope.showNewFeed = false;
			$scope.newFeedUrl = "";
			$scope.addFeedLoading = false;
		}, function (response) {
			if (response.status == 400)
				$scope.addErrorText = response.data;
			else
				$scope.addErrorText = "Cannot connect to server";
			$scope.addFeedLoading = false;
		});
		return true;
	}

	$scope.deleteFeed = function(feed) {
		$resource('/api/feed/' + feed._id).delete({}, function() {
			var indexof = $scope.feeds.indexOf(feed);
			$scope.feeds.splice(indexof, 1);
		});
	}
}
/*
 * Edit Products for a given id.
 */
function editProductsAdminCtrl($scope, $resource, $location,$routeParams){
	console.log($routeParams.productId);
	console.log($Products);
	angular.forEach($Products, function(product){
		if(product._id == $routeParams.productId){			
			$scope.product = product;
		}
	});
	//For updating the products when the user edits it.
	$scope.updateProduct = function() {
		console.log("Update product" , $scope.product);
		$resource('/updateProduct').save({'product': $scope.product},function(){
			
		});
	}
	
}

//For Admin control to save to Elastic search.
function addProductsAdminCtrl($scope, $resource, $location){
	
	//When the user wants to add a new product by clicking the plus sign in product page.
	$scope.newProduct = function() {
		$scope.showProductFlag = true;
	}
	
	//Build the product Database by adding a new product here.
	$scope.addProductRecommendation = function() {
		var recommendationObject =new Object();
		recommendationObject.product_title = $scope.product_title;
		recommendationObject.product_url = $scope.product_url;
		recommendationObject.product_annotation = $scope.product_annotation;
		recommendationObject.product_cat = $scope.product_cat;
		recommendationObject.product_subcat = $scope.product_subcat;
		console.log(recommendationObject);		
		
		var productRecommendation =$resource('/admin/products').save(recommendationObject,  function () {
			console.log("Successfully indexed *******************");
			//Clear off the old values
			$scope.product_title="";
			$scope.product_url="";
			$scope.product_annotation="";
			$scope.product_cat="";
			$scope.product_subcat="";
			$scope.addProductSuccess = true;
			//Hide the product fi
			$scope.showProductFlag = false;
		});
	}
	console.log("Search Products");
	searchProductCommonCode($scope,$resource);
	
/*	console.log("addProductsAdminCtrl");
	var productRecommendation =$resource('/admin').save("String", "", "");	
	console.log(productRecommendation);*/
}

//For Admin control to save to Elastic search.
function addContentCtrl($scope, $resource, $location){	
	//Get all the contents here to remove or edit.
	getAllContentsCommonCode($scope,$resource,$location);
	
	$scope.items = [];
	
	$scope.addProduct = function(product){
		console.log("Add Product" , product);
		var temp = new Object();
		temp.id= product._id;
		temp.product_url= product._source.product_url;
		temp.annotation= "";
	    $scope.items.push(temp);
	    $scope.newItem = null;
	  }

	  $scope.removeItem = function(index){
	    $scope.items.splice(index, 1);
	  }
	  
	  //Save recommendations entered for a content
	  $scope.saveContentRecommendation = function saveContentRecommendation(){		 
		  /**
		   * For saving recommendations for a content,
		   * we need to gather the content url and the recommendation being added.
		   */		  
		  var contTemp =new Object();
		  contTemp.products = $scope.items;
		  contTemp.contentURL = $scope.contentURL;
		  contTemp.contentTitle = $scope.contentTitle;
		  console.log("content temp --------> ",contTemp);
		 $resource('/saveContentRecommendation').save(contTemp,  function () {
				console.log("Successfully indexed *******************");
				$scope.items = [];
				$scope.contentURL = "";
			});	
	  }
	  //Search products common code since used in many places
	  searchProductCommonCode($scope,$resource);
}
/*
 * Edit Products for a given id.
 */
function editContentCtrl($scope, $resource, $location,$routeParams){	
	//search products to be added to content recommendation
	searchProductCommonCode($scope, $resource, $location);
	
	angular.forEach($ContentList, function(content){
		if(content._id == $routeParams.contentId){
			$scope.content = content;
			console.log("editContentCtrl" , $scope.content);			
		}
	});
	//Update the recommendation with some new products or some chnags.
	$scope.updateRecommendation = function(){
		  console.log("Update Recommendation---------->" ,$scope.content);
		  $resource('/updateContentRecommendation').save({'content':$scope.content},  function () {
			  
		  });
	}
	//Remove recommendation.
	$scope.removeRecommendation = function(){
		$resource('/deleteContentRecommendation').save({'contentId':$scope.content._id},  function () {
			  
		  });	
	}
	//Remove a specific product from content.
	$scope.removeProductFromContent = function(product){
		var products = $scope.content._source.products;
		products.splice(product._id, 1);
		//Now update the product with the new value.
		$scope.content._source.products = products;
	}
	//Remove a specific product from content.
	$scope.addProduct = function(product){
		var temp = new Object();
		temp.product_url = product._source.product_url;
		temp.annotation = "";
		temp.id = product._id;
		console.log("Add prodcut lkdnflkndnlkfnlkdnf" , product);
		$scope.content._source.products.push(temp);
	}
}


/**
 * Return all the contents from the elastic search
 * @param $scope
 * @param $resource
 */
function allContentPageCtrl($scope,$resource,$location){
	getAllFeedsCommonCode($scope,$resource,$location);
	//getAllContentsCommonCode($scope,$resource,$location);
	//When the user clicks a link , we should take the user to detailed page for reading the content
	$scope.openContent = function(article){			
		return $location.path("/details/" + article._id);		
	}	
}

function getAllFeedsCommonCode($scope,$resource,$location){
	$scope.feedList = [];
	//We could retreive based on dates.
	$resource('/getAllFeeds').query(function(data){				
		angular.forEach(data, function(feed){		
			$scope.feedList.push(feed);			
		});
		console.log($scope.feedList);
		//searchProductsByIdsCtrl($scope,$resource,$location,ids);
		//Assign it to the factory variable to be reused in other places or pages.
		$feedList = $scope.feedList;
	});		
}
/*
 * Common code to get all the contents.
 */
function getAllContentsCommonCode($scope,$resource,$location){
	$scope.contentList = [];
	//We could retreive based on dates.
	$resource('/getContents').query(function(data){		
		//Get the product ids from the content result and get the product details from product index.
		var ids = [];		
		angular.forEach(data, function(content){		
			$scope.contentList.push(content);
			//TODO got to remove this from here.
			angular.forEach(content._source.products, function(product){
				ids.push(product.id);
			});
		});
		console.log($scope.contentList);
		//searchProductsByIdsCtrl($scope,$resource,$location,ids);
		//Assign it to the factory variable to be reused in other places or pages.
		$ContentList = $scope.contentList;
	});		
	/**
	 * Remove content from the Elastic search
	 */
	$scope.removeContent = function(content){
		
		$resource("/deleteContentRecommendation").save({'contentId':content._id},function(){
			//$scope.contentList.remove(content);
			$scope.contentList.splice(content._id, 1);
		});
	}
}  

/**
 * Search Products by Ids Ctrl
 * @param $scope
 * @param $resource
 * @param $location
 */
function searchProductsByIdsCtrl($scope,$resource,$location,ids){
	//Now search the products with the ids taken from the content
	$resource('/searchProductsByIds').save({ids:ids},function(data){
		$scope.products = data._storage;
	}); 
	
}


//Common code for search products.
function searchProductCommonCode($scope,$resource){
	console.log($scope.$parent.searchText);
	//Search for new products
	$scope.searchProducts = function() {	
		console.log($scope.searchText);
		var searchParam = {
				searchText: $scope.searchText,				
			}				
		$scope.products =$resource('/searchProducts').query(searchParam);
		//Global scope.
		$Products = $scope.products;
		
	}
}