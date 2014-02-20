var article = require('./includes/article.js');

article.purge(30, function (err, data) {
  console.log("Purged",data);
  process.exit();
});