var articles = require('./cloudant.js').articles;

// fetch unread articles from couchdb
var unreadArticles = function(callback) {
  
  // equivalent of CouchDB https://<server>:<port>/articles/_design/matching/_view/unreadbyts?limit=100&reduce=false&include_docs=true&descending=true
  articles.view('matching','unreadbyts', { limit: 100, reduce: false, include_docs: true, descending:true}, function(err,data) {
    if(!err) {
      var retval=[];
      for(var i in data.rows) {
        retval.push(data.rows[i].doc);
      }
    }

    callback(err,retval);
  })
}

// mark an article as read
var markRead = function(id, callback) {
  
  // fetch the article
  articles.get(id, function(err, doc) {
    if (!err) {
      // mark its read flag as true
      doc.read=true;
      
      // write it back
      articles.insert(doc,function(err,data) {
        callback(err?false:true);
      });
    } else {
      callback(false)
    }

  });
}

module.exports = {
  unreadArticles: unreadArticles,
  markRead: markRead
}
