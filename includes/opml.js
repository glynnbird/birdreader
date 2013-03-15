// parse OPML XML files - see http://en.wikipedia.org/wiki/OPML

// load require modules
var sax = require('sax');
var fs = require('fs');
var moment = require('moment');


// parse Google's OPML XML file which contains things like this:
// <outline title="Apple" text="Apple">
//     <outline text="Apple News" title="Apple News" type="rss"
//         xmlUrl="http://images.apple.com/uk/main/rss/hotnews/hotnews.rss" htmlUrl="http://www.apple.com/uk/hotnews/"/>
//     <outline text="AppleInsider" title="AppleInsider" type="rss"
//         xmlUrl="http://www.appleinsider.com/appleinsider.rss" htmlUrl="http://appleinsider.com"/>
//     <outline text="Mac Rumors" title="Mac Rumors" type="rss"
//         xmlUrl="http://www.macrumors.com/macrumors.xml" htmlUrl="http://www.macrumors.com"/>
// </outline>
//
// the outer 'outline' tags is grouping mechanism e.g. Apple related feeds
// the inner 'outline' tags are the feeds themselves
//
// This function returns a Javascript array of feeds with the groupings expressed as tags e.g.
//
// [
//  { text: 'Apple News',
//    title: 'Apple News',
//    type: 'rss',
//    xmlUrl: 'http://images.apple.com/uk/main/rss/hotnews/hotnews.rss',
//    htmlUrl: 'http://www.apple.com/uk/hotnews/',
//    tags: [ 'Apple' ] },
//  { text: 'AppleInsider',
//    title: 'AppleInsider',
//    type: 'rss',
//    xmlUrl: 'http://www.appleinsider.com/appleinsider.rss',
//    htmlUrl: 'http://appleinsider.com',
//    tags: [ 'Apple' ] },
//  { text: 'Mac Rumors',
//    title: 'Mac Rumors',
//    type: 'rss',
//    xmlUrl: 'http://www.macrumors.com/macrumors.xml',
//    htmlUrl: 'http://www.macrumors.com',
//    tags: [ 'Apple' ] }
//  ]
var parse = function(filename,callback) {
  fs.readFile(filename, function (err, data) {
    if (err) throw err;
    var xmlparser = sax.parser(true);

    var parsed=[];
    var tag = "";
    var now = moment.utc().format("YYYY-MM-DD HH:mm:ss Z");
    
    // process every open tag we find
    xmlparser.onopentag = function (node) {
      console.log(node);
      // opened a tag.  node has "name" and "attributes"
      if(typeof node.name != 'undefined' && node.name == 'outline') {
        if(typeof node.attributes.xmlUrl != 'undefined') {
          var tags=[];
          tags.push(tag);
          node.attributes.tags = tags;
          node.attributes.lastModified=now;
          node.attributes.etag='';
          parsed.push(node.attributes);
        } else {
          tag=node.attributes.title;
        }
      }
    };
    
    // process errors
    xmlparser.onerror = function (e) {
      callback(e,null);
    };
    
    // process the end of file
    xmlparser.onend = function() {
      callback(null,parsed);
    }
    
    // throw the data into the XML parser
    xmlparser.write(data.toString('utf8')).close();
  });
}

module.exports= {
  parse:parse
}