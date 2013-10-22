var assert = require('assert'),
  feed = require('../includes/feed.js'),
  cloudant = require('../includes/cloudant.js')

var test_id = null;
  
var removeFeed = function (id, rev, callback) {
  cloudant.feeds.destroy(id, rev, function (err, data) {
    if(typeof callback == 'function') {
      callback(null, data);
    }
  });
}

describe('feed', function(){
  describe('adding an invalid url', function(){
    it('should produce an error', function(done){
      feed.add('http://madeupdomainname.clom/rss.xml', function(err, data){
        if(err == null && data.data.id && data.data.rev) {
          removeFeed(data.data.id, data.data.rev);
        }
        assert.equal(err, true);
        assert.equal(data.success, false);

        done();
      });
    })
  });
});

describe('feed', function(){
  this.timeout(10000);
  describe('adding a valid url', function(){
    it('should add a new feed', function(done){
      feed.add('http://www.bbc.co.uk/news/', function(err, data){
        assert.equal(err, null);
        assert.equal(data.success, true);
        assert.ok(data.data.id);
        assert.ok(data.data.rev);
        test_id = data.data.id;
        done();
      });
    })
  });
});

describe('feed', function(){
  this.timeout(10000);
  describe('adding a tag', function(){
    it('should result in the tag being saved', function(done){
      feed.addTag(test_id, "bbc", function(err, data) {
        assert.equal(err, null);
        assert.ok(data.id);
        assert.ok(data.rev);
        feed.get(test_id, function(success, data) {
          assert.ok(data.tags);
          assert.equal(data.tags.length, 1);
          done();
        });
      });
    })
  });
});

describe('feed', function(){
  this.timeout(10000);
  describe('removing a tag', function(){
    it('should result in the tag being removed', function(done){
      feed.removeTag(test_id, "bbc", function(err, data) {
        assert.equal(err, null);
        assert.ok(data.id);
        assert.ok(data.rev);
        feed.get(test_id, function(success, data) {
          assert.equal(data.tags.length, 0);
          done();
        });
      });
    })
  });
});

describe('feed', function(){
  describe('fetching a feed by its id', function(){
    it('should result in the feed document being retreived', function(done){
      feed.get(test_id, function(err, data) {
        assert.equal(err, null);
        assert.ok(data._id);
        assert.ok(data._rev);
        assert.ok(data.text);
        assert.ok(data.title);
        assert.equal(data.type, 'rss');
        assert.ok(data.xmlUrl);
        assert.ok(data.htmlUrl);
        assert.ok(data.lastModified);
        assert.ok(data.icon);
        done();
      });
    })
  });
});

describe('feed', function() {
  describe('fetching the feed RSS with a lastModified date', function () {
    it('should result in no articles being fetched', function(done) {
      feed.get(test_id, function(err, data) {
        assert.equal(err, null);
        assert.ok(data);
        feed.fetchFeed(data, function(err, data) {
          assert.equal(err, null);
          assert.ok(data);
          assert.equal(data.length,0);
          done();
        });
      });
    });
  });
});

describe('feed', function() {
  describe('fetching the feed RSS with an old lastModified date', function () {
    it('should result in some articles being fetched', function(done) {
      feed.get(test_id, function(err, data) {
        assert.equal(err, null);
        assert.ok(data);
        data.lastModified = '1970-01-01 00:00:00';
        feed.fetchFeed(data, function(err, data) {
          assert.equal(err, null);
          assert.ok(data);
          assert.notEqual(data.length,0);
          done();
        });
      });
    });
  });
});

describe('feed', function() {
  describe('reading all the rss feeds', function () {
    it('should result in more than 0 feeds being fetched', function(done) {
      feed.readAll( function(err, data) {
        assert.equal(err, null);
        assert.ok(data);
        assert.notEqual(data.length,0);
        done();
      });
    });
  });
});

describe('feed', function(){
  describe('removing a feed', function () {
    it('should remove the document', function(done){
      
      feed.remove(test_id, function (err, data) {
          done();
      });
      
    });
  });
});
