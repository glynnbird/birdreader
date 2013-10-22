var assert = require('assert'),
  article = require('../includes/article.js'),
  moment = require('moment'),
  cloudant = require('../includes/cloudant.js');
  
var testDate = moment().subtract('years', 7);

var testArticle =   {
      "_id": "testarticle",
      "feedName": "googlewhack0",
      "tags": ["googlewhack1"],
      "title": "Just testing googlewhack2",
      "description": "This is the body googlewhack3",
      "pubDate": testDate.format(),
      "link": "http://dummydomain.com/1",
      "icon": "http://dummydomain.com/test.png",
      "pubDateTS": testDate.format("X"),
      "read": false,
      "starred": false
  }

describe('article', function(){
  describe('adding an article to the database', function(){
    it('should add the article without error', function(done){
      cloudant.articles.insert(testArticle, function(err,data) {
        assert.equal(err, null);
        assert.ok(data);
        done();
      });

    })
  });
});



describe('article', function(){
  this.timeout(10000);
  describe('fetching a list of unread articles', function(){
    it('should return some articles', function(done){
      article.unreadArticles(function(err,data) {
        assert.equal(err, null);
        assert.ok(data);
        assert.equal(typeof data, "object");
        assert.notEqual(data.length, 0);
        done();            
      });
    });
  });
});

describe('article', function(){
  this.timeout(10000);
  describe('fetching a list of read articles', function(){
    it('should return our some articles', function(done){
      article.readArticles(function(err,data) {
        assert.equal(err, null);
        assert.ok(data);
        assert.equal(typeof data, "object");
        assert.notEqual(data.length, 0);
        done();            
      });
    });
  });
});

describe('article', function(){
  this.timeout(10000);
  describe('fetching a single unread article', function(){
    it('should return our test article', function(done){
      article.singleUnreadArticle(function(err,data) {
        assert.equal(err, null);
        assert.ok(data);
        assert.equal(typeof data, "object");
        assert.equal(data[0]._id, testArticle._id);
        assert.equal(data[0].read, true); // should be marked as read: true
        done();            
      });
    });
  });
});

describe('article', function(){
  this.timeout(10000);
  describe('starring a single article', function(){
    it('should return the article with its starred flag set', function(done){
      article.star(testArticle._id, function(err,data) {
        assert.equal(err, null);
        assert.ok(data);
        assert.equal(typeof data, "object");
        assert.equal(data._id, testArticle._id);
        assert.equal(data.starred, true); // should be marked as starred: true
        done();            
      });
    });
  });
});

describe('article', function(){
  this.timeout(10000);
  describe('unstarring a single article', function(){
    it('should return the article with its starred flag unset', function(done){
      article.unstar(testArticle._id, function(err,data) {
        assert.equal(err, null);
        assert.ok(data);
        assert.equal(typeof data, "object");
        assert.equal(data._id, testArticle._id);
        assert.equal(data.starred, false); // should be marked as starred: false
        done();            
      });
    });
  });
});

describe('article', function(){
  this.timeout(10000);
  describe('fetching by tag', function(){
    it('should return our test article', function(done){
      article.articlesByTag('read', 'googlewhack1', function (err,data) {
        assert.equal(err, null);
        assert.ok(data);
        assert.equal(typeof data, "object");
        assert.notEqual(data.length,0)
        done();            
      });
    });
  });
});

describe('article', function(){
  this.timeout(10000);
  describe('fetching by feed', function(){
    it('should return our test article', function(done){
      article.articlesByFeed('read', 'googlewhack0', function (err,data) {
        assert.equal(err, null);
        assert.ok(data);
        assert.equal(typeof data, "object");
        assert.notEqual(data.length,0)
        done();            
      });
    });
  });
});

describe('article', function(){
  this.timeout(10000);
  describe('searching by title', function(){
    it('should return our test article', function(done){
      article.search('googlewhack2', function (err, data) {
        assert.equal(err, null);
        assert.ok(data);
        assert.equal(typeof data, "object");
        assert.notEqual(data.length,0)
        done();            
      });
    });
  });
});

describe('article', function(){
  this.timeout(10000);
  describe('searching by description', function(){
    it('should return our test article', function(done){
      article.search('googlewhack3', function (err, data) {
        assert.equal(err, null);
        assert.ok(data);
        assert.equal(typeof data, "object");
        assert.notEqual(data.length,0)
        done();            
      });
    });
  });
});

describe('article', function(){
  describe('removing an article from the database', function(){
    it('should remove the article without error', function(done){
      setTimeout(function() {
        cloudant.articles.get(testArticle._id, function(err,data) {
          assert.equal(err, null);
          assert.ok(data);
          cloudant.articles.destroy(data._id, data._rev, function(err, data) {
            assert.equal(err, null);
            assert.ok(data);
            done();
          })

        });
      }, 1000);

    })
  });
});