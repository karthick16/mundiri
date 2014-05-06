// Replace here with your MongoDB server address
exports.database = "mongodb://localhost";
exports.port = 8080;
exports.cookieSecret = "9a62df3075e2ab7bb554c2e2607af0dd";

exports.urlRegex = new RegExp("^(http[s]?:\\/\\/(www\\.)?|ftp:\\/\\/(www\\.)?|www\\.){1}([0-9A-Za-z-\\.@:%_\+~#=]+)+((\\.[a-zA-Z]{2,3})+)(/(.)*)?(\\?(.)*)?");
exports.emailRegex = new RegExp("^[a-z0-9]+([_|\.|-]{1}[a-z0-9]+)*@[a-z0-9]+([_|\.|-]{1}[a-z0-9]+)*[\.]{1}[a-z]{2,6}$");

exports.cacheTime = 60 * 60 * 1000; // 1 hour in milliseconds
exports.maxItems = 5;

//{url:"http://feeds.inc.com/home/updates",tag:'startups , technology' , src : "www.inc.com",isES:true},
//{url:"http://www.inc.com/rss/blog/staff-blog.xml",tag:'startups , technology' , src : "www.inc.com",isES:true}


//TECH CRUNCH
//{url:"http://feeds.feedburner.com/TechCrunch/startups",tag:'startups , technology , blog' , src : "www.techcrunch.com",isES:true}
//http://feeds.feedburner.com/TechCrunchTV/Founder-Stories

//Mom blog

//http://www.topmomblogger.com/feed/

//Mashable  
//http://feeds.mashable.com/Mashable

//Business atlantic
//http://feeds.feedburner.com/AtlanticScienceAndTechnology


//yahoo
//{url:"http://www.yahoo.com/tech/tagged/the-pogue-review/rss",tag:'startups , technology' , src : "www.yahoo.com",isES:true}

//http://www.vcpost.com/

exports.seedFeed = [{url:"http://feeds.inc.com/home/updates",tag:'startups , technology' , src : "www.inc.com",isES:true},
                  {url:"http://www.inc.com/rss/blog/staff-blog.xml",tag:'startups , technology' , src : "www.inc.com",isES:true}]
