var url = require('url'),
  http = require('http');

// get a response code and a potential location
var getHeaders = function(uri, callback) {

  var domain = url.parse(uri);

  switch(domain.protocol) {
    default:
    case "http:":
      var protocol = http;
      break;
    case "https:":
      var protocol = https;
      break;
  }
  
  var method = "HEAD";
  
  var options = {method: method, host: domain.host, port: domain.port, path: domain.path, "User-Agent": "curl/7.30.0"};

  var req = protocol.request(options, function(res) {
      
      var obj = {
        statusCode: res.statusCode, 
        location: (res.headers.location?res.headers.location:false),
        contentType: res.headers["content-type"]
      };

      return callback(null, obj);
    }

  ).on('error', function(e) {
    
    return callback(e, null);

  });

  req.end();

};

module.exports = {
  getHeaders: getHeaders
};