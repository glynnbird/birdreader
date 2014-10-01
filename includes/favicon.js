var url = require('url');
var extractor = require('extractor');
var request = require('request');

// find a favicon url for the specified pageurl
var find = function (pageurl, callback) {

  // select all link tags
  var selector = { 'links': 'link' },
    parsedUrl = null,
    iconurl = null,
    guessurl = null,
    i = 0;

  // scrapte the page
  extractor.scrape(pageurl, selector, function (err, data, env) {
    if (err) {
      return callback(null);
    }

    // parse urls
    parsedUrl = url.parse(pageurl);

    // look for matching link tags
    iconurl = null;
    if(typeof data.links == "object") {
      for (i = 0; i < data.links.length; i++) {
        if (typeof data.links[i].rel !== "undefined") {
          if (data.links[i].rel === "icon" || data.links[i].rel === "shortcut icon") {
            iconurl =  data.links[i].href;
          }
        }
      }
    }


    if (iconurl) {
      // if this is not an absolute url
      if (!iconurl.match(/^http/) && !iconurl.match(/^\/\//)) {
        // construct an absolute url
        if (!iconurl.match(/^\//)) {
          iconurl = "/" + iconurl;
        }
        iconurl = parsedUrl.protocol + "//" + parsedUrl.host + iconurl;
      }
    }

    if (iconurl === null) {
      // check for favicon at root of website
      guessurl = parsedUrl.protocol + "//" + parsedUrl.host + "/favicon.ico";

      // see if there is an favicon.ico file there
      request(guessurl, function (error, response, body) {
        if (!error && response.statusCode === 200 && response.headers['content-length'] > 0) {
          iconurl = guessurl;
        }
        callback(iconurl);
      });

    } else {
      callback(iconurl);
    }

  });
};

module.exports = {
  find: find
};