//https://github.com/phillro/node-elasticsearch-client
//https://npmjs.org/package/elastical
//Scrapped for reading the feed.
var async = require('async')
var Scrapper = require(__dirname + '/../scrapper.js');

ElasticSearchClient = require('elasticsearchclient');

var objName = 'product';
//Meant to index the product the admin enters for reference.
var productIndex ='productindex';
//For feed
var feedIndex ='feedindex';
var feedObject = 'feed'
//Meant to index the prodcut recommnedaton for a content..Example.if the admin looks at a content and then associate products to keywords,this index is used.
//Will have reference to productindex
var contentRecommendationIndex ='contentrecommendationindex';

var serverOptions = {
    host: 'localhost',
    port: 9200,
};

var elasticSearchClient = new ElasticSearchClient(serverOptions);

/**
 * For indexing products entered by the user.
 */
exports.createProductIndex = function(product,callback){	
	elasticSearchClient.index(productIndex, objName, product).on('data', function(data) {
		console.log(data);
		data = "success";	
		return callback(data);
	}).exec();	
}
//Update products
exports.updateProductIndex = function(product,callback){	
	console.log("Update Product Index---->" , product);	
	elasticSearchClient.update(productIndex, objName,product._id,{doc:product._source}).on('data', function(data) {
		console.log(data);
		data = "success";	
		return callback(data);
	}).exec();	
}
//Search the product recommendation index for products using key word
exports.searchProducts= function(searchText,callback){
	var qryObj = {"query" : {"wildcard" : { "product_annotation" : searchText +"*"}}};
	elasticSearchClient.search(productIndex, objName, qryObj)
		.on('data', function(data) {
			data = JSON.parse(data);	
			console.log("searchProducts" , data);
			if(null!=data.hits ){
				return callback(data.hits.hits); 
			}
			return callback(null);  
		})
		.exec();
}

//Search the product recommendation index for products using key word
exports.searchProductsById= function(ids,callback){
	console.log("Entering Elastic search client SearchProducsByIds", ids);	
	var qryObj ={"query" : {
		    "ids" : {
		        "type" : objName,
		        "values" : ids
		    }
			}
		};
	elasticSearchClient.search(productIndex, objName, qryObj)
		.on('data', function(data) {
			var data = JSON.parse(data);			
			if(null!=data.hits ){
				return callback(data.hits.hits); 
			}
			return callback(null);  
		})
		.exec();
}

/**
 * For recommending products to a specific content.
 */
exports.createContentRecommendationIndex = function(recommendationObject,callback){	
	elasticSearchClient.index(contentRecommendationIndex, "recommendation", recommendationObject).on('data', function(data) {					
		console.log(data);
		return callback(data);
	}).exec();
	
}
//Update Recommendation index
exports.updateContentRecommendationIndex = function(content,callback){
	elasticSearchClient.update(contentRecommendationIndex, "recommendation",content._id,{doc:content._source}).on('data', function(data) {
		console.log(data);
		data = "success";	
		return callback(data);
	}).exec();	
}
//Remove the content recommendation and the products
exports.deleteContentRecommendation = function(contentId,callback){
	elasticSearchClient.deleteDocument(contentRecommendationIndex, "recommendation",contentId).on('data', function(data) {
		console.log(data);
		data = "success";	
		return callback(data);
	}).exec();	
}
/**
 * Get all the Content recommendation
 */
exports.getAllContentRecommendation = function(callback){	
	var qryObj =  {"query" : {"match_all" : {}}};
	elasticSearchClient.search(contentRecommendationIndex, "recommendation",qryObj).on('data', function(data) {
		var data = JSON.parse(data);
		console.log("getAllContentRecommendation" , data.hits.hits);
		return callback(data.hits.hits);
	}).exec();	
}

/**
 * Retrieve Content recommendation by passing an id
 */
exports.getAllContentRecommendationById = function(id,callback){	
	var qryObj = {"query" : {"term" : { "_id" : id }}};
	elasticSearchClient.search(contentRecommendationIndex, "recommendation", qryObj)
		.on('data', function(data) {
			data = JSON.parse(data);	
			//console.log(data);
			if(null!=data.hits ){
				return callback(data.hits.hits); 
			}
			return callback(null);  
		})
		.exec();
}

//Create an index to hold all the Feed and the items from that feed
//Dump all the incoming Feeds into this one.
//But check if the Feed URL is already available..If available, dont update.
exports.createFeedIndex = function(feed,callback){
	
		//First create an index
	
		 elasticSearchClient.index(feedIndex, feedObject,"dummy").on('data', function(data) {
	   		//console.log(data);
	   		data = "success";	
	   		//return callback(data);
	   	  }).exec(); 
	
		for (var i = 0; i < feed.length; i++) { 
			console.log("&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&--> " , feed[i].url);
			//Scrap the feed.
			Scrapper.scrap(feed[i], function (err, rss) {  
				if (err){
					return callback(err); 
				}
	              //Now index the feed into the elastic search
	              //for(var k in rss.items){
	            	  async.each(rss.items,function(article){
	            		  //Get Feed by URL
	            		  getFeedByURL(article,function(data){
	            			  if(data != null && data[0] != null && data[0]._source.link != null){
		            			  console.log("URL Is available ...So Dont index");
		            		  }else{
		            			  console.log("LINK NOT AVAILABLE..UPDATE THE INDEX" ,article.title);
		            			  elasticSearchClient.index(feedIndex, feedObject,article).on('data', function(data) {
					          		//console.log(data);
					          		data = "success";	
					          		//return callback(data);
					          	}).exec();
		            		  }
	            		  });
	            	  }); 
	            		  
	            	  /**
	            	   * First check if we already have the URL in the feed index
	            	   */
	            	  //console.log("Before calling getFeedByURL" ,rss.items[index].title);
	            	  /*getFeedByURL(rss.items[k],function(data){	
	            		  console.log("Inside" ,rss.items[k].title);
	            		  //Data is available in the index..So dont index
	            		  if(data != null && data[0] != null && data[0]._source.link != null){
	            			  console.log("URL Is available ...So Dont index");
	            		  }else{
	            			  console.log("LINK NOT AVAILABLE..UPDATE THE INDEX" ,rss.items[k].title);
	            			  elasticSearchClient.index(feedIndex, feedObject,rss.items[k]).on('data', function(data) {
				          		//console.log(data);
				          		data = "success";	
				          		//return callback(data);
				          	}).exec();
	            		  }
	            		 // return callback(data);
	            	  });*/
	            	  
	            	  
	              	
			});
		}
	}

/**
 * Remove an index
 */
exports.deleteFeedIndex = function(callback){
	 elasticSearchClient.deleteIndex(feedIndex).on('data', function(data) {
			data = JSON.parse(data);	
			//console.log(data); 			
			return callback(data);
		})
		.exec();
}
     
/**
 * Retrieve all the feed stored in ES from the FeedIndex.
 * 
 */
exports.getAllFeeds = function(callback){	 	
	var qryObj = {
				"from" : 0, "size" : 40,
				"query" : {"match_all" : {}}};
	elasticSearchClient.search(feedIndex, feedObject,qryObj).on('data', function(data) {
		var data = JSON.parse(data);	
		if(null!=data.hits )
			return callback(data.hits.hits);
		
		return callback(null);  
	}).exec();	
}


/**
 * Retrieve Content recommendation by passing an id
 */
exports.getFeedById = function(id,callback){	
	var qryObj = {"query" : {"term" : { "_id" : id }}};
	elasticSearchClient.search(feedIndex, feedObject, qryObj)
		.on('data', function(data) {
			data = JSON.parse(data);	
			//console.log(data);
			if(null!=data.hits ){
				return callback(data.hits.hits); 
			}
			return callback(null);  
		})
		.exec();
}

/**
 * TODO As of now we are searching by title..Might need to change for URL
 * Retrieve Content recommendation by passing an id
 */
getFeedByURL = function(article,callback){	
	console.log("Feed URL-->" , article.link);	
	var qryObj = {"query" : {"match" : { "title" : article.title}}};
	elasticSearchClient.search(feedIndex, feedObject, qryObj)
		.on('data', function(data) {
			data = JSON.parse(data);
			console.log("Data----->" ,data);
			if(null!=data.hits ){				
				return callback(data.hits.hits); 
			}
			return callback(null);  
		})
		.exec();
}

//Update the feed Index either by adding products
exports.updateFeedIndex = function(article,callback){
	console.log(article);
	elasticSearchClient.update(feedIndex,feedObject,article._id,{doc:article._source}).on('data', function(data) {
		console.log(data);
		data = "success";	
		return callback(data);
	}).exec();	
}