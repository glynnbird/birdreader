
// we need access to the articles  and feeds databases on Cloudant
var article = require('./includes/article.js');
var feed = require('./includes/feed.js');

// we need the express framework
var express = require('express');
var app = express();

// need "node-schedule" to fetch feeds every so oftern
var schedule = require('node-schedule');
var rule = new schedule.RecurrenceRule();
rule.minute = 15;

// fetch RSS every 15 mins
var j = schedule.scheduleJob(rule, function(){
  feed.fetchArticles(function(err,results) {
    console.log("Got "+results.length+" new articles");
  })
});

// fire up the jade engine
app.engine('jade', require('jade').__express);

// use compression where appropriate
app.use(express.compress());

// server out our static directory as static files
app.use(express.static(__dirname+'/public'));

// page titles etc.
var page = { title: "",
             tagline: "RSS aggregator - a replacement for Google Reader"
            };


// home
app.get('/', function(req, res) {
  res.statusCode = 302;
  res.setHeader('Location', '/unread');
  res.end('This page has moved');
});

// unread articles
app.get('/unread', function(req, res) {
  
  // fetch the unread articles
  article.unreadArticles(function(err,data) {
    
    // add the articles to our data array
    page.articles = data;
    
    // render the page
    res.render('index.jade', page);
  })

});

// read articles
app.get('/read', function(req, res) {
  
  // fetch the unread articles
  article.readArticles(function(err,data) {
    
    // add the articles to our data array
    page.articles = data;
    
    // render the page
    res.render('index.jade', page);
  })

});

// starred articles
app.get('/starred', function(req, res) {
  
  // fetch the unread articles
  article.starredArticles(function(err,data) {
    
    // add the articles to our data array
    page.articles = data;
    
    // render the page
    res.render('index.jade', page);
  })

});

// mark an article read
app.get('/api/:id/read', function(req,res) {
  // mark the supplied article as read
  article.markRead(req.params.id,function(data) { 
      res.send(data)
  });
})

// start an article 
app.get('/api/:id/star', function(req,res) {
  // mark the supplied article as starred
  article.star(req.params.id,function(data) { 
      res.send(data)
  });
})

// listen on port 3000
app.listen(3000);
console.log('Listening on port 3000');


