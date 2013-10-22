// load the config
var config = require("./includes/config.js").get;
var cloudant = require("./includes/cloudant.js");

// we need access to the articles  and feeds databases on Cloudant
var article = require('./includes/article.js');
var feed = require('./includes/feed.js');

// moment library
var moment = require('moment');

// we need the express framework
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
io.set('log level', 1); // reduce logging

// rss library
var RSS = require('rss');

// listen on port 3000
server.listen(3000);


// async library
var async = require('async');

// Authenticator
if (config.authentication && config.authentication.on) {
  app.use(express.basicAuth(config.authentication.username, config.authentication.password));
}

// Purge older articles
if (config.purgeArticles && config.purgeArticles.on && config.purgeArticles.purgeBefore > 0) {
  setInterval(function () {
    article.purge(config.purgeArticles.purgeBefore, function (err, data) {
    });
  }, 1000 * 60 * 60 * 24);
}

// fetch articles every 5 minutes
setInterval(function () {
  feed.fetchArticles(function (err, results) {
    console.log("Fetched articles");
    getStats(function (err, data) {   
    });
  });
}, 1000 * 60 * 5);

// fetch articles on start, after db & views are created
cloudant.create(function() {
  feed.fetchArticles(function (err, results) {
    console.log("Fetched articles");
    getStats(function (err, data) {
    });
  });
});

// compact the databases every 24 hours
setInterval(function () {
  cloudant.compact(function (err, data) {
    console.log("database compacted");
  });
}, 1000 * 60 * 60 * 24);

// fire up the jade engine
app.engine('jade', require('jade').__express);

// use compression where appropriate
app.use(express.compress());

// server out our static directory as static files
app.use(express.static(__dirname + '/public'));


// send latest totals to the client via socket.io
var realtimeStatsUpdate = function(stats) {
  io.sockets.emit('news', stats);
}

// fetch the stats, send via socket.io 
var getStats = function (callback) {
  article.stats(function (err, retval) {
    if(!err) {
      var keys = ['unread', 'read', 'starred'];
      for(var i = 0; i < keys.length; i++ ) {
        if(typeof retval[keys[i]] == 'undefined') {
          retval[keys[i]] = 0;
        }
      }
      realtimeStatsUpdate(retval);
      callback(err, retval);
    } else {
      callback(true, {});
    }

  });
};

// get starred articles as RSS feed
app.get('/rss.xml', function (req, res) {
  article.starredArticles(function (err, data) {
    var host = req.headers.host;
    var options = {
      title: host + " -  favourites",
      description: 'The favourite articles of '+host,
      feed_url: host+'/rss.xml',
      site_url: 'http://'+host,
      author: 'BirdReader',
      language: 'en'
    };
    var feed = new RSS();
    for(var i in data) {
      var article = data[i];
      var item = {
        title : article.title,
        description: article.description,
        url: article.link,
        guid: article._id,
        author: article.feedName,
        date: article.pubDate
      }
      feed.item(item);
    }
    res.setHeader('Content-Type', 'application/rss+xml');
    res.send(feed.xml());
  });
});

// home
app.get('/', function (req, res) {

  async.parallel([
    function (callback) {
      getStats(callback);
    }
  ], function (err, results) {
    res.render('browse.jade', { title: "Browse", type: "unread", stats: results[0], articles: [] });
  });

});


// trim sentence to N words
var trimByWord = function (sentence, n) {
  var result = sentence,
    resultArray = result.split(" ");
  if (resultArray.length > n) {
    resultArray = resultArray.slice(0, n);
    result = resultArray.join(" ") + " ";
  }
  result += "...";
  return result;
};

// calculate diff string for list of articles
var processArticles = function (articles) {

  if(typeof articles == 'undefined') {
    return [];
  }
  
  var now = moment(),
    i = 0,
    a = null,
    then = null,
    diff = 0,
    val = null,
    units = null;

  for (i = 0; i < articles.length; i++) {

    // calculate diff string
    a = articles[i];
    then = moment(a.pubDate);
    diff = now.diff(then, 'minutes');
    val = null;
    units = null;
    if (diff > 60 * 24) {
      val = parseInt(diff / (60 * 24), 10);
      units = "day";
    } else if (diff > 60) {
      val = parseInt(diff / 60, 10);
      units = "hour";
    } else {
      val = parseInt(diff, 10);
      units = "minute";
    }
    if (val === 1) {
      a.diff = "1 " + units + " ago";
    } else {
      a.diff = val + " " + units + "s ago";
    }

    // calculate summary block
    if (typeof a.description === "string") {
      a.summary = trimByWord(a.description.replace(new RegExp('<\/?[^<>]*>', 'gi'), ''), 20);
    } else {
      a.summary = a.description = "";
    }

    articles[i] = a;
  }
  return articles;
};




// get raw unread articles
app.get('/api/unread', function (req, res) {

  article.unreadArticles(function (err, data) {
    res.send(data);
  });

});

// get raw read articles
app.get('/api/read', function (req, res) {

  article.readArticles(function (err, data) {
    res.send(data);
  });

});

// get raw starred articles
app.get('/api/starred', function (req, res) {

  article.starredArticles(function (err, data) {
    res.send(data);
  });

});

// get raw search results
app.get('/api/search', function (req, res) {

  article.search(req.query.keywords, function (err, data) {
    res.send(data);
  });

});

// mark an article read
app.get('/api/:id/read', function (req, res) {

  // mark the supplied article as read
  article.markRead(req.params.id, function (data) {
    res.send(data);
    getStats(function (err, data) {
    });
  });

});

// star an article
app.get('/api/:id/star', function (req, res) {

  // mark the supplied article as starred
  article.star(req.params.id, function (data) {
    res.send(data);
  });

});

// unstar an article
app.get('/api/:id/unstar', function (req, res) {

  // mark the supplied article as un-starred
  article.unstar(req.params.id, function (data) {
    res.send(data);
  });

});

// add a new feed api call, expects 'url' get parameter
app.get('/api/feed/add', function (req, res) {

  // Add the new feed to the database
  feed.add(req.query.url, function (err, data) {
    res.send(data);
  });

});


var byTagApi = function (type, req, res) {
  var tag = req.params.tag.toLowerCase();

  article.articlesByTag(type, tag, function (err, data) {
    res.send(data);
  });

};

app.get("/api/read/bytag/:tag", function (req, res) {
  byTagApi("read", req, res);
});

app.get("/api/unread/bytag/:tag", function (req, res) {
  byTagApi("unread", req, res);
});

app.get("/api/starred/bytag/:tag", function (req, res) {
  byTagApi("starred", req, res);
});


var byFeedApi = function (type, req, res) {
  var feed = req.params.feed.toLowerCase();

  article.articlesByFeed(type, feed, function (err, data) {
    res.send(data);
  });

};

app.get("/api/read/byfeed/:feed", function (req, res) {
  byFeedApi("read", req, res);
});

app.get("/api/unread/byfeed/:feed", function (req, res) {
  byFeedApi("unread", req, res);
});

app.get("/api/starred/byfeed/:feed", function (req, res) {
  byFeedApi("starred", req, res);
});

app.get("/api/html/next", function (req, res) {
  var articles = [],
    a = null;
    
  article.singleUnreadArticle( function (err, data) {
    articles = processArticles(data);
    a = {};
    if (articles.length > 0) {
      a = articles[0];
    }
    res.render('browsesingle.jade', { type: "unread",
                                      article: a
      });
    getStats(function(err,data) {
    }); 
  });

});

app.get("/api/html/feeds", function (req, res) {
  
  // fetch the article stats
  feed.readAll(function (err, feeds) {
    res.render('feeds.jade', {title: 'Feeds', feeds: feeds});
  });
});

var renderListPage = function (title, type, data, res) {
  var articles = processArticles(data);
  res.render('index.jade', { title: title,
                             type: type,
                             articles: articles
    });
  getStats(function(err,data) {
  });
}

app.get("/api/html/unread", function (req, res) {
  var qs = req.query,
    articles = null;
    
  if (typeof qs.tag != 'undefined') {
    article.articlesByTag('unread', qs.tag.toLowerCase(), function (err, data) {
      renderListPage('Unread by tag - '+qs.tag, 'unread', data, res);
    });
  } else if (typeof qs.feed != 'undefined') {
    article.articlesByFeed('unread', qs.feed.toLowerCase(), function (err, data) {
      renderListPage('Unread by feed - ' + qs.feed, 'unread', data, res);
    });
  } else {
    article.unreadArticles( function (err, data) {
      renderListPage('Unread', 'unread', data, res)
    });
  }
  

});

app.get("/api/html/readed", function (req, res) {
  var qs = req.query,
    articles = null;
    
  if (typeof qs.tag != 'undefined') {
    article.articlesByTag('read', qs.tag.toLowerCase(), function (err, data) {
      renderListPage('Read by tag - ' + qs.tag, 'read', data, res)
    });
  } else if (typeof qs.feed != 'undefined') {
      article.articlesByFeed('read', qs.feed.toLowerCase(), function (err, data) {
        renderListPage('Read by feed - ' + qs.feed, 'read', data, res);
      });
  } else {
    article.readArticles( function (err, data) {
      renderListPage('Read', 'read', data, res); 
    });
  }
});

app.get("/api/html/starred", function (req, res) {
  var qs = req.query,
    articles = null;
    
  if (typeof qs.tag != 'undefined') {
    article.articlesByTag('starred', qs.tag.toLowerCase(), function (err, data) {
      renderListPage('Starred by tag - '+qs.tag, 'starred', data, res)
    });
  } else if (typeof qs.feed != 'undefined') {
    article.articlesByFeed('starred', qs.feed.toLowerCase(), function (err, data) {
      renderListPage('Starred by feed - ' + qs.feed, 'starred', data, res);
    });
  } else {
    article.starredArticles( function (err, data) {
      renderListPage('Starred', 'starred', data, res); 
    });
  }
});

// search
app.get('/api/html/search', function (req, res) {
  article.search(req.query.keywords, function (err, data) {
    renderListPage('Search "' + req.query.keywords + '"', 'search', data, res); 
  });
});

// add form articles
app.get('/api/html/add', function (req, res) {

  // render the page
  res.render('addform.jade', {title: 'Add'});
});


// individual feed
app.get('/api/html/feed', function (req, res) {
  feed.get(req.query.feed_id, function (err, data)  {
    res.render('feed.jade', { title: 'Feed',
                              feed: data,
                              id: req.query.feed_id
      });
  });
});

app.get('/api/feeds', function (req, res) {
  feed.readAll(function (err, data) {
    res.send(data);
  });
});

app.get('/api/feed/:id', function (req, res) {
  feed.get(req.params.id, function (err, data) {
    res.send(data);
  });
});

// add a tag to a feed
app.get('/api/feed/:id/tag/add', function (req, res) {

  feed.addTag(req.params.id, req.query.tag, function (err, data) {
    res.send({ success: !err, data: data});
  });

});

// remove a tag from a feed
app.get('/api/feed/:id/tag/remove', function (req, res) {

  feed.removeTag(req.params.id, req.query.tag, function (err, data) {
    res.send({ success: !err, data: data});
  });

});

// remove a feed
app.get('/api/feed/:id/remove', function (req, res) {

  feed.remove(req.params.id, function (err, data) {
    res.send({ success: !err, data: data});
  });

});

io.sockets.on('connection', function (socket) {

  // send latest stats on connection
  getStats(function(err,data) {
  });
  
});

console.log('Listening on port 3000');


