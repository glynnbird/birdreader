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
  });
}, 1000 * 60 * 5);

// fetch articles on start, after db & views are created
cloudant.create(function() {
  feed.fetchArticles(function (err, results) {
    console.log("Fetched articles");
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

// home
app.get('/', function (req, res) {

  async.parallel([
    function (callback) {
      article.stats(callback);
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

// unread articles
app.get('/unread', function (req, res) {
  var articles = [];

  async.parallel([
    function (callback) {
      article.stats(callback);
    },
    function (callback) {
      article.unreadArticles(callback);
    }
  ], function (err, results) {
    articles = processArticles(results[1]);
    res.render('index.jade', { title: "Unread",
                               type: "unread",
                               stats: results[0],
                               articles: articles
      });
  });

});

// read articles
app.get('/read', function (req, res) {
  var articles = [];

  async.parallel([
    function (callback) {
      article.stats(callback);
    },
    function (callback) {
      article.readArticles(callback);
    }
  ], function (err, results) {
    articles = processArticles(results[1]);
    res.render('index.jade', { title: 'Read',
                               type: "read",
                               stats: results[0],
                               articles: articles
      });
  });

});

// starred articles
app.get('/starred', function (req, res) {
  var articles = [];
  async.parallel([
    function (callback) {
      article.stats(callback);
    },
    function (callback) {
      article.starredArticles(callback);
    }
  ], function (err, results) {
    articles = processArticles(results[1]);
    res.render('index.jade', { title: 'Starred',
                               type: "starred",
                               stats: results[0],
                               articles: articles
      });
  });
});

// search
app.get('/search', function (req, res) {
  var articles = [];
  async.parallel([
    function (callback) {
      article.stats(callback);
    },
    function (callback) {
      article.search(req.query.keywords, callback);
    }
  ], function (err, results) {
    articles = processArticles(results[1]);
    res.render('index.jade', {title: 'Search "' + req.query.keywords + '"',
                              type: "search",
                              stats: results[0],
                              articles: articles
      });
  });
});

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

  async.parallel([
    function (callback) {
      article.stats(callback);
    },
    function (callback) {
      article.singleUnreadArticle(callback);
    }
  ], function (err, results) {
    articles = processArticles(results[1]);
    a = {};
    if (articles.length > 0) {
      a = articles[0];
    }
    res.render('browsesingle.jade', { type: "unread",
                                      stats: results[0],
                                      article: a
      });
  });

});


// add form articles
app.get('/add', function (req, res) {

  // fetch the article stats
  article.stats(function (err, stats) {

    // render the page
    res.render('addform.jade', {title: 'Add', stats: stats});
  });

});

// feeds list
app.get('/feeds', function (req, res) {

  // fetch the article stats
  article.stats(function (err, stats) {
    // fetch the article stats
    feed.readAll(function (feeds) {

      // render the page
      res.render('feeds.jade', {title: 'Feeds', feeds: feeds, stats: stats});
    });
  });

});

// individual feed
app.get('/feed/:id', function (req, res) {

  async.parallel([
    function (callback) {
      article.stats(callback);
    },
    function (callback) {
      feed.get(req.params.id, function (err, data) {
        callback(err, data);
      });
    }
  ], function (err, results) {
    res.render('feed.jade', { title: 'Feed',
                              base: '../',
                              feed: results[1],
                              stats: results[0],
                              id: req.params.id
      });
  });

});

app.get('/api/feeds', function (req, res) {
  feed.readAll(function (data) {
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

var byTag = function (type, req, res) {
  var tag = req.params.tag.toLowerCase(),
    articles = [];

  async.parallel([
    function (callback) {
      article.stats(callback);
    },
    function (callback) {
      article.articlesByTag(type, tag, callback);
    }
  ], function (err, results) {
    articles = processArticles(results[1]);
    res.render('index.jade', { title: type + ' by tag ' + tag,
                               base: '../../',
                               type: type,
                               stats: results[0],
                               articles: articles
      });
  });
};

app.get("/read/bytag/:tag", function (req, res) {
  byTag("read", req, res);
});

app.get("/unread/bytag/:tag", function (req, res) {
  byTag("unread", req, res);
});

app.get("/starred/bytag/:tag", function (req, res) {
  byTag("starred", req, res);
});

var byFeed = function (type, req, res) {
  var feed = req.params.feed.toLowerCase(),
    articles = [];

  async.parallel([
    function (callback) {
      article.stats(callback);
    },
    function (callback) {
      article.articlesByFeed(type, feed, callback);
    }
  ], function (err, results) {
    articles = processArticles(results[1]);
    res.render('index.jade', { title: type + ' by feed ' + feed,
                               base: '../../',
                               type: type,
                               stats: results[0],
                               articles: articles
      });
  });
};

app.get("/read/byfeed/:feed", function (req, res) {
  byFeed("read", req, res);
});

app.get("/unread/byfeed/:feed", function (req, res) {
  byFeed("unread", req, res);
});

app.get("/starred/byfeed/:feed", function (req, res) {
  byFeed("starred", req, res);
});

// listen on port 3000
app.listen(3000);
console.log('Listening on port 3000');


