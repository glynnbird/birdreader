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
    
  });
  

  module.exports = {
    feeds: feeds,
    articles: articles
  }