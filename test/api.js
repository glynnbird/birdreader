var assert = require('assert'),
  article = require('../includes/article.js'),
  moment = require('moment'),
  request = require('request'),
  should = require('should'),
  cloudant = require('../includes/cloudant.js');
  
var testDate = moment().subtract('years', 7);

var birdreader = require("../birdreader.js");

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
      "starred": true
  }

describe('api', function(){
  describe('adding an article to the database', function(){
    it('should add the article without error', function(done){
      cloudant.articles.insert(testArticle, function(err,data) {
        assert.equal(err, null);
        data.should.be.ok;
        assert.ok(data);
        done();
      });

    })
  });
});

describe('api', function(){
  describe('fetching the home page', function(){
    it('should return some html', function(done){
      request.get("http://localhost:3000/", function(e,r,b) {
        assert.equal(r.headers['content-type'], "text/html; charset=utf-8");
        assert.equal(r.statusCode, 200);
        done();
      });
    });
  });
});

describe('api', function(){
  describe('fetching the unread stream', function(){
    it('should return some data', function(done){
      request.get("http://localhost:3000/api/unread", function(e,r,b) {
        assert.equal(r.headers['content-type'], "application/json; charset=utf-8");
        assert.equal(r.statusCode, 200);
        done();
      });
    });
  });
});

describe('api', function(){
  describe('fetching the next browsable item', function(){
    it('should return our item', function(done){
      request.get("http://localhost:3000/api/html/next", function(e,r,b) {
        assert.equal(r.headers['content-type'], "text/html; charset=utf-8");
        assert.equal(r.statusCode, 200);
        assert.notEqual(b.indexOf('googlewhack2'), -1)
        done();
      });
    });
  });
});

// removing it so we can add it again as unread
describe('article', function(){
  this.timeout(10000);
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

describe('api', function(){
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


describe('api', function() {  
  this.timeout(10000);
  describe('fetching the rss feed', function(){
    it('should return some xml', function(done){
      request.get("http://localhost:3000/rss.xml", function(e,r,b) {
        assert.equal(r.headers['content-type'], "application/rss+xml");
        assert.equal(r.statusCode, 200);
        done();
      });
    });
  });
});

describe('api', function() {
  describe('searching for an unread articles by tag', function(){
    it('should return the test article', function(done){
      request.get("http://localhost:3000/api/unread/bytag/googlewhack1", function(e,r,b) {
        assert.equal(r.headers['content-type'], "application/json; charset=utf-8");
        assert.equal(r.statusCode, 200);
        b = JSON.parse(b);
        assert.equal(b.length, 1);
        assert.equal(b[0]._id, testArticle._id);
        done();
      });
    });
  });
});

describe('api', function() {
  describe('searching for an read articles by tag', function(){
    it('should NOT return the test article', function(done){
      request.get("http://localhost:3000/api/read/bytag/googlewhack1", function(e,r,b) {
        assert.equal(r.headers['content-type'], "application/json; charset=utf-8");
        assert.equal(r.statusCode, 200);
        b = JSON.parse(b);
        assert.equal(b.length, 0);
        done();
      });
    });
  });
});

describe('api', function() {
  describe('searching for an unread articles by feed', function(){
    it('should return the test article', function(done){
      request.get("http://localhost:3000/api/unread/byfeed/googlewhack0", function(e,r,b) {
        assert.equal(r.headers['content-type'], "application/json; charset=utf-8");
        assert.equal(r.statusCode, 200);
        b = JSON.parse(b);
        assert.equal(b.length, 1);
        assert.equal(b[0]._id, testArticle._id);
        done();
      });
    });
  });
});

describe('api', function() {
  describe('searching for an read articles by feed', function(){
    it('should NOT return the test article', function(done){
      request.get("http://localhost:3000/api/read/byfeed/googlewhack0", function(e,r,b) {
        assert.equal(r.headers['content-type'], "application/json; charset=utf-8");
        assert.equal(r.statusCode, 200);
        b = JSON.parse(b);
        assert.equal(b.length, 0);
        done();
      });
    });
  });
});

describe('api', function() {
  describe('marking an article as read', function(){
    it('should work', function(done){
      request.get("http://localhost:3000/api/"+testArticle._id+"/read", function(e,r,b) {
        assert.equal(r.headers['content-type'], "application/json; charset=utf-8");
        assert.equal(r.statusCode, 200);
        b = JSON.parse(b);
        assert.equal(b.read, true);
        setTimeout(function() {
          done();
        }, 1000);
      });
    });
  });
});

describe('api', function() {
  describe('searching for an read articles by feed', function(){
    it('should return the test article', function(done){
      request.get("http://localhost:3000/api/read/byfeed/googlewhack0", function(e,r,b) {
        assert.equal(r.headers['content-type'], "application/json; charset=utf-8");
        assert.equal(r.statusCode, 200);
        b = JSON.parse(b);
        assert.equal(b.length, 1);
        assert.equal(b[0]._id, testArticle._id);
        done();
      });
    });
  });
});

describe('api', function() {
  describe('searching for an unread articles by feed', function(){
    it('should NOT return the test article', function(done){
      request.get("http://localhost:3000/api/unread/byfeed/googlewhack0", function(e,r,b) {
        assert.equal(r.headers['content-type'], "application/json; charset=utf-8");
        assert.equal(r.statusCode, 200);
        b = JSON.parse(b);
        assert.equal(b.length, 0);
        done();
      });
    });
  });
});

describe('api', function() {
  describe('searching for an read articles by tag', function(){
    it('should return the test article', function(done){
      request.get("http://localhost:3000/api/read/bytag/googlewhack1", function(e,r,b) {
        assert.equal(r.headers['content-type'], "application/json; charset=utf-8");
        assert.equal(r.statusCode, 200);
        b = JSON.parse(b);
        assert.equal(b.length, 1);
        assert.equal(b[0]._id, testArticle._id);
        done();
      });
    });
  });
});

describe('api', function() {
  describe('searching for an unread articles by tag', function(){
    it('should NOT return the test article', function(done){
      request.get("http://localhost:3000/api/unread/bytag/googlewhack1", function(e,r,b) {
        assert.equal(r.headers['content-type'], "application/json; charset=utf-8");
        assert.equal(r.statusCode, 200);
        b = JSON.parse(b);
        assert.equal(b.length, 0);
        done();
      });
    });
  });
});

describe('api', function() {
  describe('marking an article as unstarred', function(){
    it('should work', function(done){
      request.get("http://localhost:3000/api/"+testArticle._id+"/unstar", function(e,r,b) {
        assert.equal(r.headers['content-type'], "application/json; charset=utf-8");
        assert.equal(r.statusCode, 200);
        b = JSON.parse(b);
        assert.equal(b.starred, false);
        setTimeout(function() {
          done();
        }, 1000);
      });
    });
  });
});


describe('api', function() {
  describe('searching for an starred articles by feed', function(){
    it('should NOT return the test article', function(done){
      request.get("http://localhost:3000/api/starred/byfeed/googlewhack0", function(e,r,b) {
        assert.equal(r.headers['content-type'], "application/json; charset=utf-8");
        assert.equal(r.statusCode, 200);
        b = JSON.parse(b);
        assert.equal(b.length, 0);
        done();
      });
    });
  });
});

describe('api', function() {
  describe('searching for an starred articles by tag', function(){
    it('should NOT return the test article', function(done){
      request.get("http://localhost:3000/api/starred/bytag/googlewhack1", function(e,r,b) {
        assert.equal(r.headers['content-type'], "application/json; charset=utf-8");
        assert.equal(r.statusCode, 200);
        b = JSON.parse(b);
        assert.equal(b.length, 0);
        done();
      });
    });
  });
});

describe('api', function() {
  describe('marking an article as starred', function(){
    it('should work', function(done){
      request.get("http://localhost:3000/api/"+testArticle._id+"/star", function(e,r,b) {
        assert.equal(r.headers['content-type'], "application/json; charset=utf-8");
        assert.equal(r.statusCode, 200);
        b = JSON.parse(b);
        assert.equal(b.starred, true);
        setTimeout(function() {
          done();
        }, 1000);
      });
    });
  });
});

describe('api', function() {
  describe('searching for an starred articles by feed', function(){
    it('should return the test article', function(done){
      request.get("http://localhost:3000/api/starred/byfeed/googlewhack0", function(e,r,b) {
        assert.equal(r.headers['content-type'], "application/json; charset=utf-8");
        assert.equal(r.statusCode, 200);
        b = JSON.parse(b);
        assert.equal(b.length, 1);
        assert.equal(b[0]._id, testArticle._id);
        done();
      });
    });
  });
});

describe('api', function() {
  describe('searching for an starred articles by tag', function(){
    it('should return the test article', function(done){
      request.get("http://localhost:3000/api/starred/bytag/googlewhack1", function(e,r,b) {
        assert.equal(r.headers['content-type'], "application/json; charset=utf-8");
        assert.equal(r.statusCode, 200);
        b = JSON.parse(b);
        assert.equal(b.length, 1);
        assert.equal(b[0]._id, testArticle._id);
        done();
      });
    });
  });
});

describe('api', function() {
  describe('searching for an article', function(){
    it('should work', function(done){
      request.get("http://localhost:3000/api/search?keywords=googlewhack2", function(e,r,b) {
        assert.equal(r.headers['content-type'], "application/json; charset=utf-8");
        assert.equal(r.statusCode, 200);
        b = JSON.parse(b);
        assert.equal(b.length, 1);
        assert.equal(b[0]._id, testArticle._id);
        done();
      });
    });
  });
});

describe('api', function() {
  describe('performing a search', function(){
    it('should return our test article', function(done){
      request.get("http://localhost:3000/api/html/search?keywords=googlewhack2", function(e,r,b) {
        assert.equal(r.headers['content-type'], "text/html; charset=utf-8");
        assert.equal(r.statusCode, 200);
        assert.notEqual(b.indexOf('googlewhack2'), -1)
        done();
      });
    });
  });
});

describe('article', function(){
  this.timeout(10000);
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

describe('api', function() {
  describe('fetching the add feed form', function(){
    it('should work', function(done){
      request.get("http://localhost:3000/api/html/add", function(e,r,b) {
        assert.equal(r.headers['content-type'], "text/html; charset=utf-8");
        assert.equal(r.statusCode, 200);
        done();
      });
    });
  });
});

