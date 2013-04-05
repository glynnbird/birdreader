var favicon = require('./includes/favicon.js');
var feed = require('./includes/feed.js');


var retrofitIcon= function(f, callback) {
  console.log("Checking ",f.htmlUrl);
  favicon.find(f.htmlUrl, function(favicon_url) {
    f.icon = favicon_url;
    feed.update(f,function(err,data) {
      callback(err,data);
    })
  });
}

// retrofit "icon" image urls to each feed
feed.readAll(function(allFeeds) {
  console.log("Finding favicons for ",allFeeds.length," feeds.");
  for(var i in allFeeds) {
    var f = allFeeds[i];
    if(typeof f.icon == "undefined" || f.icon==null) {
      retrofitIcon(f,function(err,data) {
        console.log(err,data);
      });
    }
  }
})

/*
favicon.find("https://cloudant.com/", function(favicon_url) {
  console.log(favicon_url);
});
*/