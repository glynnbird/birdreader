// load the config
var config = require("./includes/config.js").get;

// we need access to the articles  and feeds databases on Cloudant
var article = require('./includes/article.js');
var feed = require('./includes/feed.js');

// we need the express framework
var express = require('express');
var app = express();

// async library
var async = require('async');

// Authenticator
if(config.authentication && config.authentication.on) {
  app.use(express.basicAuth( config.authentication.username, config.authentication.password));
}


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

// home
app.get('/', function(req, res) {
  res.statusCode = 302;
  res.setHeader('Location', '/unread');
  res.end('This page has moved');
});

// unread articles
app.get('/unread', function(req, res) {
  
  async.parallel([
    function(callback) {
      article.stats(callback);
    },
    function(callback) {
      article.unreadArticles(callback);
    }
  ], function(err,results) {
    res.render('index.jade', { title: "Unread", stats:results[0], articles: results[1] } );
  });

});

// read articles
app.get('/read', function(req, res) {
  
  async.parallel([
    function(callback) {
      article.stats(callback);
    },
    function(callback) {
      article.readArticles(callback);
    }
  ], function(err,results) {
      res.render('index.jade', {title:'Read', stats:results[0], articles: results[1]} );
  });

});

// starred articles
app.get('/starred', function(req, res) {
  
  async.parallel([
    function(callback) {
      article.stats(callback);
    },
    function(callback) {
      article.starredArticles(callback);
    }
  ], function(err,results) {
      res.render('index.jade', {title: 'Starred', stats:results[0], articles: results[1]} );
  });

});

// mark an article read
app.get('/api/:id/read', function(req,res) {
  
  // mark the supplied article as read
  article.markRead(req.params.id,function(data) { 
      res.send(data)
  });
})

// star an article 
app.get('/api/:id/star', function(req,res) {
  
  // mark the supplied article as starred
  article.star(req.params.id,function(data) { 
      res.send(data)
  });
})

// unstar an article 
app.get('/api/:id/unstar', function(req,res) {
  
  // mark the supplied article as un-starred
  article.unstar(req.params.id,function(data) { 
      res.send(data)
  });
})

// add a new feed api call, expects 'url' get parameter
app.get('/api/feed/add', function(req,res) {
  
  // Add the new feed to the database
  feed.add(req.query.url,function(err,data){
    res.send(data);
  })
})

// add form articles
app.get('/add', function(req, res) {
  
  // fetch the article stats
  article.stats(function(err,stats) {
    
    // render the page
    res.render('addform.jade', {title: 'Add', stats: stats});
  });

});

// feeds list
app.get('/feeds', function(req, res) {
  
  // fetch the article stats
  article.stats(function(err,stats) {
    // fetch the article stats
    feed.readAll(function(feeds) {
    
      // render the page
      res.render('feeds.jade', {title: 'Feeds', feeds: feeds, stats: stats});
    });
  });

});

// individual feed
app.get('/feed/:id', function(req, res) {
  
  async.parallel([
    function(callback) {
      article.stats(callback);
    },
    function(callback) {
      feed.get(req.params.id, function(err,data) {
        callback(err,data);
      });
    }
  ], function(err,results) {
      res.render('feed.jade', {title: 'Feed', feed: results[1], stats: results[0], id: req.params.id});
  });

});

// add a tag to a feed
app.get('/api/feed/:id/tag/add', function(req, res) {
  
  feed.addTag(req.params.id,req.query.tag,function(err,data) {
    res.send({ success: !err, data: data});
  })
  
});

// remove a tag from a feed
app.get('/api/feed/:id/tag/remove', function(req, res) {
  
  feed.removeTag(req.params.id,req.query.tag,function(err,data) {
    res.send({ success: !err, data: data});
  })
  
});

// remove a feed
app.get('/api/feed/:id/remove', function(req, res) {
  
  feed.remove(req.params.id,function(err,data) {
    res.send({ success: !err, data: data});
  })
  
});

// listen on port 3000
app.listen(3000);
console.log('Listening on port 3000');


