  var config = require("./config.js").get;
  
  // calculate the urlstub
  var urlstub = config.cloudant.server.replace("//","//"+config.cloudant.username+":"+config.cloudant.password+"@") + ":"+config.cloudant.port;
  
  // start up the nano driver
  var nano = require('nano')(urlstub);
  
  // connections to databases                               
  var feeds = nano.db.use('feeds');
  var articles = nano.db.use('articles');
  
  // async library
  var async = require('async');
  
  // create the feeds database
  var createFeeds = function(callback) {
    console.log("Checking feeds database");
    // create some databases
    nano.db.create('feeds',function(err,body) {
      callback()
    });
  }
  
  // create the articles database
  var createArticles = function(callback) {
    console.log("Checking articles database");
    // create some databases
    nano.db.create('articles',function(err,body) {
      callback()
    });
  }
  
  // create any required views
  var createViews = function(callback) {
    
    var views =  [
  		 {
         "_id": "_design/matching",
         "language": "javascript",
         "views": {
  					 "byts":  {
  					   "map": "function(doc) { if(doc.starred) {emit(['starred',doc.pubDateTS],null);} if(doc.read) {emit(['read',doc.pubDateTS],null);} if(!doc.read) {emit(['unread',doc.pubDateTS],null);} }",
  					   "reduce": "_count"
  					 },
  					 "bytag":  {
  					   "map": "function(doc) { for(var i in doc.tags) { var tag=doc.tags[i].toLowerCase(); if(doc.starred) {emit(['starred',tag, doc.pubDateTS],null);} if(doc.read) {emit(['read',tag, doc.pubDateTS],null);} if(!doc.read) {emit(['unread',tag, doc.pubDateTS],null);} } }",
  					   "reduce": "_count"
  					 }
         }
      }
  	];	
    
    console.log("Checking views");
    for(var i in views) {
      var v = views[i];
      articles.get(v._id,function(err,data) {
        if(!data) {
          data= {};
          var rev=null;
        } else {
          var rev = data._rev;
          delete data._rev;
        }

        if(JSON.stringify(data) != JSON.stringify(v)) {
          if(rev) {
            v._rev=rev
          }
          articles.insert(v,function(err,data) {
          });
        }
        
      })
    }
    callback();
  }
  
  // create some databases
  async.series( [ createFeeds, createArticles, createViews] );

  module.exports = {
    feeds: feeds,
    articles: articles,
    createViews: createViews
  }