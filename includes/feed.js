var feeds = require('./cloudant.js').feeds;
var articles = require('./cloudant.js').articles;
var async = require('async');
var request = require('request');
var FeedParser = require('feedparser');
var moment = require('moment');
var extractor = require('extractor');
var favicon = require('./favicon.js');
var crypto = require('crypto');
var u = require('url');
var url_details = require('./url_details.js');

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
    callback(err, retval);
  });
};

// fetch 'feed' and callback when done, passing (err, articles)
var fetchFeed = function (feed, callback) {

  // check that the feed is valid before fetching
  var parsed = u.parse(feed.xmlUrl);
  if (parsed.protocol != "http:" && parsed.protocol != "https:" ) {
    return callback(true, []);
  }

  // only get articles newer than this feed's newest article
  var newerThan = moment(feed.lastModified),
    latest = moment(feed.lastModified),
    headers = {'If-Modified-Since' : newerThan.format('ddd, DD MMM YYYY HH:mm:ss Z')},
    reqObj = { 'uri': feed.xmlUrl,
                 'headers': headers,
                 'timeout': 30000,
                 'strictSSL': false },
    articles = [],
    a = {},
    shasum = null,
    m = null,
    stream = null,
    data = null;

  // use request to fetch the feed and pipe the stream to FeedParser
  request(reqObj)
    .on('error',function(e){
       // this is an error from request e.g. DNS error
       console.log("Failed to connect to ",reqObj.uri);
       return callback(e,articles);
    })
    .pipe(new FeedParser({}))
    .on('error', function(err) {
      // this is an error from FeedParser e.g. parse error
      //console.log("parse error", reqObj.uri)
    })
    .on('readable', function () {
      // we have one or more articles to parse
      stream = this;
      data = null;
      while (data = stream.read()) {
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
      }

    })
    .on('end', function() {

      // update last modified date of the feed and return the found articles
      feed.lastModified = latest.format('YYYY-MM-DD HH:mm:ss Z');
      return callback(null, articles);
      
    });
    
};

// fetch all the articles from all the feeds
var fetchArticles = function (callback) {
  // create a fetch function for each one
  var functions = [],
    i = 0,
    r = 0,
    bigresults = [],
    feedsToSave = [];

  // load all feeds from Cloudant
  readAll(function (err, allFeeds) {
    
    // for each feed
    for (i = 0; i < allFeeds.length; i++) {
      
      // create a closure to feed to create a functions array of work to do in parallel
      (function (feed) {
        functions.push(function (cb) {
          var before_ts = feed.lastModified;
          fetchFeed(feed, function (err, data) {
            // if the feed has a new timestamp, put it in an array to write back to the database
            if (feed.lastModified > before_ts) {
              feedsToSave.push(feed);
            }
            cb(null, data);
          });
        });
      })(allFeeds[i]);
      
    }

    // perform fetches in parallel
    async.parallelLimit(functions, 25, function (err, results) {
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
            //console.log(bigresults);
          });
        }

        // rewrite the feeds to the database
        if (feedsToSave.length > 0) {
          feeds.bulk({"docs": feedsToSave}, function (err, d) {
            console.log("Written ",feedsToSave.length," feeds");
          });
        }

        callback(err, results);
      }
      

    });

  });
};

var addFeed = function(xmlurl, htmlurl, type, title, description, callback) {
  feed = {};
  feed.text = title;
  feed.title = title;
  feed.type = type;
  feed.description = description;
  feed.xmlUrl = xmlurl;
  feed.htmlUrl = htmlurl;
  feed.tags = [];
  feed.lastModified = moment().format('YYYY-MM-DD HH:mm:ss Z');


  // if we have found a feed
  if (feed.xmlUrl) {
    
    // see if we can find a favicon
    favicon.find(feed.htmlUrl, function (faviconUrl) {

      // add icon to feed
      feed.icon = faviconUrl;

      // add it to the database
      feeds.insert(feed, function (err, data) {
          //console.log(err,data);
          retval = { success: true, message: "Added feed for " + xmlurl, data:data};
          callback(null, retval);
      });
    });
  } else {
    callback(true, null);
  }

};

// add a feed for this url
var add = function (url, callback) {

  var mimeTypes = ["text/xml", "application/rss+xml", "application/rdf+xml", "application/atom+xml", "application/xml"];

  url_details.getHeaders(url, function(err, details) {
    
    // if this is an XML feed, then add it
    if (mimeTypes.indexOf(details.contentType)>-1)  {
      addFeed(url, url, "rss", url, url, function(err, data) {
        callback(false,  { success: true, message: "Successfully added feed"});
      })
    } else {
      
      
      // scrape the url looking for link tags
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
          return callback(true, retval);
        }

        if (!data.links) {
          return callback(true, { success: false, message: "Could not add feed for " + url});
        }

        // look for matching link tags
        var xmlurl = null;
        var htmlurl = url;
        var type = null;
        var description = data.metadescription;
        var title = data.title[0].text;
        for (i = 0; i < data.links.length; i++) {
          if (typeof data.links[i].type !== "undefined") {
            if (data.links[i].type === "application/rss+xml") {
              xmlurl = data.links[i].href;
              type = 'rss';
              break;
            }
            if (data.links[i].type === "application/atom+xml") {
              xmlUrl = data.links[i].href;
              type = 'rss';
              break;
            }
            if (data.links[i].type === "application/rdf+xml") {
              xmlUrl = data.links[i].href;
              type = 'rss';
              break;
            }
          }
        }
    
        if(xmlUrl) {
    
          // turn relative urls into absolute urls
          xmlUrl = u.resolve(url, xmlUrl);

          //console.log(feed.xmlUrl);
          addFeed(xmlUrl, htmlurl, type, title, description, function(err, data) {
            callback(false,  { success: true, message: "Successfully added feed"});
          });
        } else {
          retval = { success: false, message: "Could not add feed for " + url};
          callback(true, retval);
        }
      });
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
        callback(null, data);
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
        callback(null, data);
      });
    }
  });
};

// remove a feed
var remove = function (id, callback) {
  feeds.get(id, function (err, data) {
    if (!err) {
      feeds.destroy(id, data._rev, function (err, data) {
        callback(null, data);
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
  fetchFeed: fetchFeed,
  add: add,
  get: get,
  addTag: addTag,
  removeTag: removeTag,
  remove: remove,
  update: update
};