var opml = require('./includes/opml.js');
var argv = require('optimist').argv;
var feeds = require('./includes/cloudant.js').feeds;

// check command-line arguements
if (!argv._[0] ) {
  console.log('Proper usage is: node import_opml.js <source_file>');
  process.exit();
}

// parse a Google Reader OPML file
opml.parse(argv._[0], function(err,data) {
  if(err) {
    console.log("Could not parse the file");
  } else {
    feeds.bulk({"docs":data},function(err,d) {
      console.log("Written ",data.length," feeds");
    })
  }
});