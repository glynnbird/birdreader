var feeds = require('./cloudant.js').feeds;
var articles = require('./cloudant.js').articles;
var async = require('async');
var request = require('request');
var feedparser = require('feedparser');
var moment = require('moment');
var extractor = require('extractor');
var favicon = require('./favicon.js');
var crypto = require('crypto');

// read all the feeds from Cloudant
var readAll = function (callback) {
  var retval = [],
    i = 0;

  feeds.list({include_docs: true}, function (err, data) {
    retval = [];
    if (!err) {
      for (i = 0; i < data.rows.length; i++) {
        retval.push(data.rows[i].doc);
      }
    }
    callback(retval);
  });
};

var fetchFeed = function (feed, callback) {

  // only get articles newer than this feed's newest article
  var newerThan = moment(feed.lastModified),
    latest = moment(feed.lastModified),
    headers = {'If-Modified-Since' : newerThan.format('ddd, DD MMM YYYY HH:mm:ss Z')},
    reqObj = { 'uri': feed.xmlUrl,
                 'headers': headers,
                 'timeout': 5000 },
    articles = [],
    a = {},
    shasum = null,
    m = null;

  // parseString()
  request(reqObj, function (err, response, body) {
    feedparser.parseString(body)
      .on('article', function (data) {
        a = {};
        // use a hash of the articles's url as the document id - to prevent duplicates
        if (typeof data.link === 'string') {
          shasum = crypto.createHash('sha1');
          shasum.update(data.link);
          a._id = shasum.digest('hex');
          a.feedName = feed.title;
          a.tags = feed.tags;
          a.title = data.title;
          a.description = data.description;
          a.pubDate = data.pubDate;
          a.link = data.link;
          if (typeof feed.icon !== "undefined") {
            a.icon = feed.icon;
          } else {
            a.icon = null;
          }
          m = moment(data.pubDate);
          if (m) {
            a.pubDateTS = m.format("X");
            a.read = false;
            a.starred = false;
            if (m.isAfter(newerThan)) {
              articles.push(a);
              if (m.isAfter(latest)) {
                latest = m;
              }
            }
          }
        }

      })
      .on('end', function () {
        feed.lastModified = latest.format('YYYY-MM-DD HH:mm:ss Z');
        callback(null, articles);
      })
      .on('error', function (error) {
      });
  });

};

var addToSpider = function (feed, functions) {
  functions.push(function (cb) {
    fetchFeed(feed, function (err, data) {
      cb(null, data);
    });
  });
};

// fetch all the articles from all the feeds
var fetchArticles = function (callback) {
  // create a fetch function for each one
  var functions = [],
    i = 0,
    r = 0,
    bigresults = [];

  // load all articles from Cloudant
  readAll(function (allFeeds) {

    for (i = 0; i < allFeeds.length; i++) {
      addToSpider(allFeeds[i], functions);
    }

    // perform fetches in parallel
    async.parallel(functions, function (err, results) {
      if (!err) {
        // concat all the results arrays into bigresults
        bigresults = [];
        for (r = 0; r < results.length; r++) {
          bigresults = bigresults.concat(results[r]);
        }

        // write the articles to the database
        if (bigresults.length > 0) {
          articles.bulk({"docs": bigresults}, function (err, d) {
            console.log("Written ", bigresults.length, " articles");
            console.log(bigresults);
          });
        }

        // rewrite the feeds to the database
        feeds.bulk({"docs": allFeeds}, function (err, d) {
        //           console.log("Written ",allFeeds.length," feeds");
        });
      }

      callback(err, results);

    }, 25);

  });
};

// add a feed for this url
var add = function (url, callback) {

  var retval = null,
    feed = null,
    i = null,
    selector = {
      'title': 'title',
      'links': 'link',
      'metadescription': 'meta[name=description]'
    };

  extractor.scrape(url, selector, function (err, data, env) {
    if (err) {
      retval = { success: false, message: "Could not fetch" + url};
      return callback(false, retval);
    }

    feed = {};
    feed.text = data.title[0].text;
    feed.title = data.title[0].text;
    feed.type = null;
    feed.description = data.metadescription;
    feed.xmlUrl = null;
    feed.htmlUrl = url;
    feed.tags = [];
    feed.lastModified = moment().format('YYYY-MM-DD HH:mm:ss Z');

    // look for matching link tags
    for (i = 0; i < data.links.length; i++) {
      if (typeof data.links[i].type !== "undefined") {
        if (data.links[i].type === "application/rss+xml") {
          feed.xmlUrl = data.links[i].href;
          feed.type = 'rss';
          break;
        }
        if (data.links[i].type === "application/atom+xml") {
          feed.xmlUrl = data.links[i].href;
          feed.type = 'rss';
          break;
        }
        if (data.links[i].type === "application/rdf+xml") {
          feed.xmlUrl = data.links[i].href;
          feed.type = 'rss';
          break;
        }
      }
    }

    // if we have found a feed
    if (feed.xmlUrl) {

      // see if we can find a favicon
      favicon.find(feed.htmlUrl, function (faviconUrl) {

        // add icon to feed
        feed.icon = faviconUrl;

        // add it to the database
        feeds.insert(feed, function (err, data) {
//          console.log(err,data);
        });
        retval = { success: true, message: "Added feed for " + url};
        callback(true, retval);

      });


    } else {
      retval = { success: false, message: "Could not add feed for " + url};
      callback(false, retval);
    }
  });

};

// fetch a single feed
var get = function (id, callback) {
  feeds.get(id, callback);
};

// add a tag to an existing feed
var addTag = function (id, tag, callback) {
  tag = tag.replace(/^ +/, "").replace(/ +$/, "");
  feeds.get(id, function (err, data) {
    if (!err) {
      data.tags.push(tag);
      feeds.insert(data, function (err, data) {
        callback(true, data);
      });
    }
  });
};

// remove a tag to an existing feed
var removeTag = function (id, tag, callback) {
  var i = 0;
  feeds.get(id, function (err, data) {
    if (!err) {
      for (i = 0; i < data.tags.length; i++) {
        if (data.tags[i] === tag) {
          data.tags.splice(i, 1);
        }
      }
      feeds.insert(data, function (err, data) {
        callback(true, data);
      });
    }
  });
};

// remove a feed
var remove = function (id, callback) {
  feeds.get(id, function (err, data) {
    if (!err) {
      feeds.destroy(id, data._rev, function (err, data) {
        callback(true, data);
      });
    }
  });
};

// update a feed
var update = function (feed, callback) {
  feeds.insert(feed, function (err, data) {
    callback(err, data);
  });
};

module.exports = {
  readAll: readAll,
  fetchArticles: fetchArticles,
  add: add,
  get: get,
  addTag: addTag,
  removeTag: removeTag,
  remove: remove,
  update: update
};