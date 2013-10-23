var articles = require('./cloudant.js').articles;

var moment = require('moment');
var async = require('async');
var mc = require('./mc.js');

// fetch unread articles from couchdb
var singleUnreadArticle = function (callback) {
  var retval = [],
    i = 0,
    doc = {};

  // equivalent of CouchDB https://<server>:<port>/articles/_design/matching/_view/byts?limit=1
  // ---&reduce=false&include_docs=true&descending=true&startkey=["unreadz"]&endkey=["unread"]
  // N.B. when doing doing descending=true with startkey/endkey,
  // you must also swap startkey/endkey(!)
  articles.view('matching', 'byts', { limit: 1,
                                      reduce: false,
                                      include_docs: true,
                                      descending: false,
                                      startkey: ["unread"],
                                      endkey: ["unread" + "z"]
                                    }, function (err, data) {
    if (!err) {
      retval = [];
      for (i = 0; i < data.rows.length; i++) {
        retval.push(data.rows[i].doc);

        // write it back with read=true
        doc = data.rows[i].doc;
        doc.read = true;
        articles.insert(doc, function (err, data) {

        });
      }
    }

    callback(err, retval);
  });
};

// fetch unread articles from couchdb
var unreadArticles = function (callback) {
  var retval = [],
    i = 0;

  // equivalent of CouchDB https://<server>:<port>/articles/_design/matching/_view/byts?limit=20
  // ----&reduce=false&include_docs=true&descending=true&startkey=["unreadz"]&endkey=["unread"]
  // N.B. when doing doing descending=true with startkey/endkey, you must
  // also swap startkey/endkey(!)
  articles.view('matching', 'byts', { limit: 20,
                                      reduce: false,
                                      include_docs: true,
                                      descending: true,
                                      startkey: ["unread" + "z"],
                                      endkey: ["unread"]
                                    }, function (err, data) {
    if (!err) {
      retval = [];
      for (i = 0; i < data.rows.length; i++) {
        retval.push(data.rows[i].doc);
      }
    }

    callback(err, retval);
  });
};

// fetch read articles from couchdb
var readArticles = function (callback) {
  var retval = [],
    i = 0;

  // equivalent of CouchDB https://<server>:<port>/articles/_design/matching/_view/byts?limit=20
  // ---&reduce=false&include_docs=true&descending=true&startkey=["readz"]&endkey=["read"]
  // N.B. when doing doing descending=true with startkey/endkey, you must also
  // swap startkey/endkey(!)
  articles.view('matching', 'byts', { limit: 20,
                                      reduce: false,
                                      include_docs: true,
                                      descending: true,
                                      startkey: ["read" + "z"],
                                      endkey: ["read"]
                                    }, function (err, data) {
    if (!err) {
      retval = [];
      for (i = 0; i < data.rows.length; i++) {
        retval.push(data.rows[i].doc);
      }
    }

    callback(err, retval);
  });
};

// fetch starred articles from couchdb
var starredArticles = function (callback) {
  var retval = [],
    i = 0;

  // equivalent of CouchDB https://<server>:<port>/articles/_design/matching/_view/byts?limit=20
  // ---&reduce=false&include_docs=true&descending=true&startkey=["starredz"]&endkey=["starred"]
  // N.B. when doing doing descending=true with startkey/endkey, you must also
  // swap startkey/endkey(!)
  articles.view('matching', 'byts', { limit: 20,
                                      reduce: false,
                                      include_docs: true,
                                      descending: true,
                                      startkey: ["starred" + "z"],
                                      endkey: ["starred"]
                                    }, function (err, data) {
    if (!err) {
      retval = [];
      for (i = 0; i < data.rows.length; i++) {
        retval.push(data.rows[i].doc);
      }
    }

    callback(err, retval);
  });
};

// get counts of read/unread/starred articles
var stats = function (callback) {
  var retval = {},
    i = 0;

  // equivalent of CouchDB /articles/_design/matching/_view/byts?group_level=1
  articles.view('matching', 'byts', { group_level: 1}, function (err, data) {
    retval = {};
    if (!err) {
      for (i = 0; i < data.rows.length; i++) {
        retval[data.rows[i].key[0]] = data.rows[i].value;
      }
    }
    callback(err, retval);
  });
};

// fetch the article counts
var counts = function (type, callback) {
  var val = mc.get(type);
  if(val) {
    return callback(null, val);
  }
  async.parallel([
      function(callback) {
        var params = { group_level: 2, stale:"ok", startkey:[type], endkey:[type+"z"]};
        articles.view('matching', 'bytag', params, function (err, data) {
          var retval = {};
          if (!err) {
            for (i = 0; i < data.rows.length; i++) {
              retval[data.rows[i].key[1]] = data.rows[i].value;
            }
          }
          callback(null, retval);
        });
      },
      function(callback) {
        var params = { group_level: 2, stale:"ok", startkey:[type], endkey:[type+"z"]};
        articles.view('matching', 'byfeed', params, function (err, data) {
          var retval = {};
          if (!err) {
            for (i = 0; i < data.rows.length; i++) {
              retval[data.rows[i].key[1]] = data.rows[i].value;
            }
          }
          callback(null, retval);
        });
      }
    ], function(err, results) {
      var retval = { "bytag": results[0], "byfeed": results[1]};
      mc.set(type, retval);
      callback(null, retval);
    });

};

// mark an article as read
var markRead = function (id, callback) {

  // fetch the article
  articles.get(id, function (err, doc) {
    if (!err) {
      // mark its read flag as true
      if (typeof doc.read === "undefined" || doc.read === false) {

        doc.read = true;

        // write it back
        articles.insert(doc, function (err, data) {

        });

        callback(doc);
      } else {
        callback(doc);
      }
    } else {
      callback(false);
    }
  });
};

// mark an article as starred
var star = function (id, callback) {

  // fetch the article
  articles.get(id, function (err, doc) {
    if (!err) {
      // mark its star flag as true
      if (typeof doc.starred === "undefined" || doc.starred === false) {

        doc.starred = true;

        // write it back
        articles.insert(doc, function (err, data) {

        });

        callback(null, doc);
      } else {
        callback(null, doc);
      }

    } else {
      callback(false);
    }
  });
};

// mark an article as read
var unstar = function (id, callback) {

  // fetch the article
  articles.get(id, function (err, doc) {
    if (!err) {
      // mark its star flag as true
      if (typeof doc.starred === "undefined" || doc.starred === true) {

        doc.starred = false;

        // write it back
        articles.insert(doc, function (err, data) {

        });
        callback(null, doc);
      } else {
        callback(null, doc);
      }

    } else {
      callback(false);
    }
  });
};

// get articles, filtered by tag
var articlesByTag = function (type, tag, callback) {
  var retval = [],
    i = 0;

  // equivalent of CouchDB https://<server>:<port>/articles/_design/matching/_view/bytag?limit=20
  // --- &reduce=false&include_docs=true&descending=true&startkey=["starred","applez"]
  // ----&endkey=["starred","apple"]
  // N.B. when doing doing descending=true with startkey/endkey, you must also
  // swap startkey/endkey(!)
  articles.view('matching', 'bytag', { limit: 20,
                                       reduce: false,
                                       include_docs: true,
                                       descending: true,
                                       startkey: [type, tag + "z"],
                                       endkey: [type, tag]
                                      }, function (err, data) {
    if (!err) {
      retval = [];
      for (i = 0; i < data.rows.length; i++) {
        retval.push(data.rows[i].doc);
      }
    }

    callback(err, retval);
  });
};

// get articles, filtered by feed
var articlesByFeed = function (type, feed, callback) {
  var retval = [],
    i = 0;

  // equivalent of CouchDB https://<server>:<port>/articles/_design/matching/_view/bytag?
  // ---- limit=20&reduce=false&include_docs=true&descending=true
  // ----- &startkey=["starred","applez"]&endkey=["starred","apple"]
  // N.B. when doing doing descending=true with startkey/endkey, you must also 
  // swap startkey/endkey(!)
  articles.view('matching', 'byfeed', { limit: 20,
                                        reduce: false,
                                        include_docs: true,
                                        descending: true,
                                        startkey: [type, feed + "z"],
                                        endkey: [type, feed]
                                      }, function (err, data) {
    if (!err) {
      retval = [];
      for (i = 0; i < data.rows.length;  i++) {
        retval.push(data.rows[i].doc);
      }
    }

    callback(err, retval);
  });
};

// full text search for 'keywords
var search = function (keywords, callback) {
  var query = "description:" + keywords + " OR title:" + keywords,
    retval = [],
    i = 0;

  articles.search('search', 'ft', { q: query,
                                    limit: 20,
                                    include_docs: true,
                                    sort: "\"-pubDateTS\""
                                  }, function (err, data) {
    if (!err) {
      retval = [];
      for (i = 0; i < data.rows.length; i++) {
        retval.push(data.rows[i].doc);
      }
    }

    callback(err, retval);
  });
};

// remove articles older than a purgeBefore days
var purge = function (purgeBefore, callback) {

  // calculate timestamp of "purgeBefore" days ago
  var ts = moment().day(-1 * purgeBefore).format("X"),
    toDelete = [],
    i = 0,
    row = {},
    article = {};

  // fetch oldest read articles older than "purgeBefore" days old
  articles.view('matching', 'byts', { limit: 5000,
                                      reduce: false,
                                      startkey: ["read", "0"],
                                      endkey: ["read", ts]
                                    }, function (err, data) {
    if (!err && data.rows.length > 0) {
      console.log("Purging " + data.rows.length +
                  " articles older than " + purgeBefore + " days old");
      toDelete = [];
      for (i = 0; i < data.rows.length; i++) {
        row = data.rows[i];
        article = {};
        article._id = row.id;
        article._rev = row.value;
        article._deleted = true;
        toDelete.push(article);
      }

      articles.bulk({"docs": toDelete}, function (err, d) {
        console.log("Deleted ", toDelete.length, " articles");
      });
    }
    callback(err, data);
  });
};

module.exports = {
  singleUnreadArticle: singleUnreadArticle,
  unreadArticles: unreadArticles,
  readArticles: readArticles,
  starredArticles: starredArticles,
  markRead: markRead,
  star: star,
  unstar: unstar,
  stats: stats,
  counts: counts,
  articlesByTag: articlesByTag,
  articlesByFeed: articlesByFeed,
  search: search,
  purge: purge
};
