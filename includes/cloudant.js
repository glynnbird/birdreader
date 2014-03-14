var config = require("./config.js").get;

// calculate the urlstub
var auth = "//" + config.cloudant.username + ":" + config.cloudant.password + "@";
var urlstub = config.cloudant.server.replace("//", auth) + ":" + config.cloudant.port;

// start up the nano driver
var nano = require('nano')(urlstub);

// connections to databases
var feeds = nano.db.use('feeds');
var articles = nano.db.use('articles');

// async library
var async = require('async');

// set http max connections
var http = require('http');
http.globalAgent.maxSockets = 25;

// set https max connections
var https = require('https');
https.globalAgent.maxSockets = 25;

// create the feeds database
var createFeeds = function (callback) {
  console.log("Checking feeds database");
  // create some databases
  nano.db.create('feeds', function (err, body) {
    if(!err || (err && typeof(err.status_code) !='undefined' && err.status_code == 412)) {
      callback(null, body);
    } else {
      callback(err.reason, body);
    }
  });
};

// create the articles database
var createArticles = function (callback) {
  console.log("Checking articles database");
  // create some databases
  nano.db.create('articles', function (err, body) {
    if(!err || (err && typeof(err.status_code) !='undefined' && err.status_code == 412)) {
      callback(null, body);
    } else {
      callback(err.reason, body);
    }
  });
};

// check to see if view "id" has contains "content"; if not replace it
var checkView = function (id, content, callback) {
  var rev = null;

  // fetch the view
  articles.get(id, function (err, data) {

    // if there's no existing data
    if (!data) {
      data = {};
      rev = null;
    } else {
      rev = data._rev;
      delete data._rev;
    }

    // if comparison  of stringified versions are different
    if (JSON.stringify(data) !== JSON.stringify(content)) {
      if (rev) {
        content._rev = rev;
      }

      // update the saved version
      articles.insert(content, function (err, data) {
        callback(null, true);
      });
    } else {
      callback(null, false);
    }

  });
};

// create any required views
var createViews = function (callback) {

  var views = [],
	  i = 0,
	  v = {};

  // load the views from file
  views = require("./views.json");

  console.log("Checking views");
  for (i = 0; i < views.length; i++) {
    v = views[i];
    checkView(views[i]._id, views[i], function (err, data) {
    });
  }
  callback();
};

// compact the databases
var compact = function (callback) {

  nano.db.compact("feeds", function (err, data) {
  });

  nano.db.compact("articles", function (err, data) {
  });
  callback(null, {});

};

// create some databases and their views
var create = function (cb) {
  async.series([createFeeds, createArticles, createViews], function(err, results) {
    cb(err, null);
  });
};

module.exports = {
  feeds: feeds,
  articles: articles,
  createViews: createViews,
  compact: compact,
  create: create
};