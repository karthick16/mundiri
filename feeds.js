var config = require('./config.js');


exports.createRoutes = function(app, database) {

	app.get('/api/feeds', function (req, res) {
		if (!req.session.user)
			return res.send(401, "Loging required");
		database.feed.get(req.session.user, function (err, feeds) {			
			res.send(feeds);
			
		});
		
		console.log("[info ] Getting feeds of user : %s", req.session.user.email);
	});

	app.post('/api/feed', function (req, res) {
		
		/*if (!req.session.user)
			return res.send(401, "Loging required");*/
		var url = req.param('url');
		if (!url || !url.match(config.urlRegex))
			return res.send(400, "Please provide a valid url");
		database.feed.add(req.session.user, url, function (err, feed) {
			if (err == 2)
				return res.send(400, "Feed already added");
			else if (err)
				return res.send(400, "Invalid Feed")
			
				
			consle.log(feed);	
			res.send(feed);
			
			req.session.user._feeds.push(feed._id);
			console.log("[info ] Added feed (%s) to user : %s", url, req.session.user.email);
		});
	});

	app.delete('/api/feed/:id', function (req, res) {
		if (!req.session.user)
			return res.send(401, "Loging required");
		database.feed.delete(req.session.user, req.params.id, function (err, nb) {
			if (err)
				res.send(400, "No feed with this ID");
			else
				res.send("Feed deleted");
			console.log("[info ] Feed %d deleted by user %s", req.params.id, req.session.user.email)
		});
	});

	app.get('/api/feed/:id', function (req, res) {
		if (!req.session.user)
			return res.send(401, "Loging required");
		database.feed.getOne(req.params.id, function (err, data) {
			if (err)
				return res.send(400, err.message);
			res.send(data);
		});
	});
	/**
	 * ***********************************************************************
	 * ELASTIC SEARCH IMPLEMENTATION START
	 * *************************************************************************
	 */
	
	var elasticSearch= require(__dirname + '/database/elasticsearch.js');
	// For storing the product recommendation in elastic search.
	app.post('/admin/products', function (req, res) {			
		var reqObj = {
				'product_url': req.param("product_url"),
				'product_title': req.param("product_title"),
				'product_annotation': req.param("product_annotation"),
				'product_cat': req.param("product_cat"),
				'product_subcat': req.param("product_subcat"),
				};		
		elasticSearch.createProductIndex(reqObj,function(){			
			res.send("success");
		});
		console.log("3");		
	});
	
	// Search for products from the Elastic search.
	app.get('/searchProducts', function (req, res) {		
		elasticSearch.searchProducts(req.param("searchText"),function(products){
			console.log(products);
			res.send(products);			
		});
	});
	
	app.post('/saveContentRecommendation', function (req, res) {			
		console.log(req.param("contentURL"));
		console.log(req.param("products"));	
			var contTemp =new Object();
		  contTemp.products = req.param("products");
		  contTemp.contentURL =req.param("contentURL");
		  contTemp.contentTitle =req.param("contentTitle");
		elasticSearch.createContentRecommendationIndex(contTemp,function(products){			
			res.send(products);			
		});
	});
	
	app.post('/searchProductsByIds', function (req, res) {
		var ids = req.param("ids");
		elasticSearch.searchProductsById(ids,function(products){						
			//When you directly return the prodcuts array to the calling method,it does not work..So making a nasty fix here :)
			var temp = new Object();
			temp.storage = products;			
			res.send(temp);			
		});
	});
	/**
	 * Get all the contents first from the index
	 */
	app.get('/getContents', function (req, res) {		
		elasticSearch.getAllContentRecommendation(function(contents){
			res.send(contents);			
		});
	});
	
	app.post('/getArticleById', function (req, res) {
		var id = req.param("articleId");
		elasticSearch.getFeedById(id,function(content){			
			var temp = new Object();
			temp.storage = content;		
			res.send(temp);			
		});
	});
	//Update product.
	app.post('/updateProduct', function (req, res) {
		var product = req.param("product");
		console.log("update product" , product);
		elasticSearch.updateProductIndex(product,function(content){			
			return "success";			
		});
	});
	
	//Update Content Recommendation. Not yet implemented.
	app.post('/updateArticleRecommendation', function (req, res) {
		var article = req.param("article");		
		elasticSearch.updateFeedIndex(article,function(content){			
			return "success";			
		});
	});
	//Delete Content by the id
	app.post('/deleteContentRecommendation', function (req, res) {
		var contentId = req.param("contentId");		
		elasticSearch.deleteContentRecommendation(contentId,function(content){			
			return "success";			
		});
	});
	
	/**
	 * Seed your feeds 
	 */
	app.get('/feedSeeding',function(req,res){		
		var seedUrls = config.seedFeed;
		//Create feed Index
		elasticSearch.createFeedIndex(seedUrls,function(content){	
			return "success";	
		});
	});
	
	/**
	 * Get all the feeds to show
	 */
	app.get('/getAllFeeds', function (req, res) {		
		elasticSearch.getAllFeeds(function(contents){
			res.send(contents);			
		});
	});
	
	
	/**
	 * Get all the feeds to show
	 */
	app.get('/deleteFeedIndex', function (req, res) {		
		elasticSearch.deleteFeedIndex(function(){
			res.send("success");			
		});
	});
	
}
