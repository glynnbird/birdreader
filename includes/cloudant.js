  var config = require("./config.js").get;
  
  // calculate the urlstub
  var urlstub = config.cloudant.server.replace("//","//"+config.cloudant.username+":"+config.cloudant.password+"@") + ":"+config.cloudant.port;
  
  // start up the nano driver
  var nano = require('nano')(urlstub);
  
  // connections to databases                               
  var feeds = nano.db.use('feeds');
  var articles = nano.db.use('articles');
  
  // create some databases
  nano.db.create('feeds',function(err,body) {
    
  });
  nano.db.create('articles',function(err,body) {
    
    // if this worked, then we need to create views too
    if(!err) {
      
      var views =  [
    		 {
           "_id": "_design/matching",
           "language": "javascript",
           "views": {
    					 "byts":  {
    					   "map": "function(doc) { if(doc.starred) {emit(['starred',doc.pubDateTS],null);} if(doc.read) {emit(['read',doc.pubDateTS],null);} if(!doc.read) {emit(['unread',doc.pubDateTS],null);} }",
    					   "reduce": "_count"
    					 }
           }
        }	
    	];	
      
      console.log("Creating views - first time only");
      for(var i in views) {
        articles.insert(views[i],function(err,data) {
          //console.log(err,data);
        });
      }
    }
  });
  

  module.exports = {
    feeds: feeds,
    articles: articles
  }