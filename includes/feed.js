var feeds = require('./cloudant.js').feeds;
var articles = require('./cloudant.js').articles;
var async = require('async');
var request = require('request');
var feedparser = require('feedparser');
var moment = require('moment');

// read all the feeds from Cloudant
var readAll = function(callback) {
  feeds.list({include_docs:true},function(err,data) {
    var retval =[]
    if(!err) {
      for(var i in data.rows) {
        retval.push(data.rows[i].doc)
      }     
    }
    callback(retval);
  })
}

var fetchFeed=function(feed,callback) {
  
  // only get articles newer than this feed's newest article
  var newerThan = moment(feed.lastModified);
  var latest = moment(feed.lastModified);
  var headers = {'If-Modified-Since' : newerThan.format('ddd, DD MMM YYYY HH:mm:ss Z')} //, 'If-None-Match': 'etag' };
  var reqObj = {'uri': feed.xmlUrl,
                'headers': headers };
  var articles=[];

  console.log("Actually Fetching feed ",feed.xmlUrl," newer than ",newerThan.format('ddd, DD MMM YYYY HH:mm:ss Z'));

  // parseString()
  request(reqObj, function (err, response, body){
    feedparser.parseString(body)
      .on('article', function(data) {
        var a = {}
        a.feedName=feed.title;
        a.tags=feed.tags;
        a.title=data.title;
        a.description=data.description;
        a.pubDate = data.pubDate;
        a.link = data.link;
        var m = moment(data.pubDate);
        if(m) {
          a.pubDateTS = m.format("X");
          a.read=false;
          a.starred=false;
          if(m.isAfter(newerThan)) {
            articles.push(a);
            if(m.isAfter(latest)) {
              latest = m;
            }
          } 
        }
      })
      .on('end', function() {
        console.log("finished: returning ",articles.length," articles")
        feed.lastModified = latest.format('YYYY-MM-DD HH:mm:ss Z');
        callback(null,articles);
      })
      .on('error', function(error) {
//        console.log('ERROR!');
 //       callback(null,articles);
      })
  });
  
}

var addToSpider = function(feed,functions) {
  functions.push(function(cb) {
    fetchFeed(feed, function(err,data) {
      cb(null,data);
    });
  })
}

// fetch all the articles from all the feeds
var fetchArticles = function(callback) {
  
  // load all articles from Cloudant
  readAll(function(allFeeds) {
    
    // create a fetch function for each one
    var functions=[];
    for(var i in allFeeds) {
      if(allFeeds[i].xmlUrl != 'http://code.google.com/feeds/p/trophyim/updates/basic') {
        addToSpider(allFeeds[i], functions);
      } 
    }
    
    
    // perform fetches in parallel
    async.parallel(functions, function(err, results){
       if(!err) {
         // concat all the results arrays into bigresults
         var bigresults=[]
         for(var r in results) {
           bigresults = bigresults.concat(results[r]);
         }
         // write the articles to the database
         if(bigresults.length>0) {
           articles.bulk({"docs":bigresults},function(err,d) {
             console.log("Written ",bigresults.length," articles");
           })           
         }

         // rewrite the feeds to the database
         feeds.bulk({"docs":allFeeds},function(err,d) {
           console.log("Written ",allFeeds.length," feeds");
         })        
         console.log("********");
         console.log(bigresults);
         console.log("*******");
       } 
       
       callback(err,results);
       

    },25);

  });
}

module.exports = {
  readAll: readAll,
  fetchArticles: fetchArticles
}