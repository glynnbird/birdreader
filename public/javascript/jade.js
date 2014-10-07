
jade = (function(exports){
/*!
 * Jade - runtime
 * Copyright(c) 2010 TJ Holowaychuk <tj@vision-media.ca>
 * MIT Licensed
 */

/**
 * Lame Array.isArray() polyfill for now.
 */

if (!Array.isArray) {
  Array.isArray = function(arr){
    return '[object Array]' == Object.prototype.toString.call(arr);
  };
}

/**
 * Lame Object.keys() polyfill for now.
 */

if (!Object.keys) {
  Object.keys = function(obj){
    var arr = [];
    for (var key in obj) {
      if (obj.hasOwnProperty(key)) {
        arr.push(key);
      }
    }
    return arr;
  }
}

/**
 * Merge two attribute objects giving precedence
 * to values in object `b`. Classes are special-cased
 * allowing for arrays and merging/joining appropriately
 * resulting in a string.
 *
 * @param {Object} a
 * @param {Object} b
 * @return {Object} a
 * @api private
 */

exports.merge = function merge(a, b) {
  var ac = a['class'];
  var bc = b['class'];

  if (ac || bc) {
    ac = ac || [];
    bc = bc || [];
    if (!Array.isArray(ac)) ac = [ac];
    if (!Array.isArray(bc)) bc = [bc];
    ac = ac.filter(nulls);
    bc = bc.filter(nulls);
    a['class'] = ac.concat(bc).join(' ');
  }

  for (var key in b) {
    if (key != 'class') {
      a[key] = b[key];
    }
  }

  return a;
};

/**
 * Filter null `val`s.
 *
 * @param {Mixed} val
 * @return {Mixed}
 * @api private
 */

function nulls(val) {
  return val != null;
}

/**
 * Render the given attributes object.
 *
 * @param {Object} obj
 * @param {Object} escaped
 * @return {String}
 * @api private
 */

exports.attrs = function attrs(obj, escaped){
  var buf = []
    , terse = obj.terse;

  delete obj.terse;
  var keys = Object.keys(obj)
    , len = keys.length;

  if (len) {
    buf.push('');
    for (var i = 0; i < len; ++i) {
      var key = keys[i]
        , val = obj[key];

      if ('boolean' == typeof val || null == val) {
        if (val) {
          terse
            ? buf.push(key)
            : buf.push(key + '="' + key + '"');
        }
      } else if (0 == key.indexOf('data') && 'string' != typeof val) {
        buf.push(key + "='" + JSON.stringify(val) + "'");
      } else if ('class' == key && Array.isArray(val)) {
        buf.push(key + '="' + exports.escape(val.join(' ')) + '"');
      } else if (escaped && escaped[key]) {
        buf.push(key + '="' + exports.escape(val) + '"');
      } else {
        buf.push(key + '="' + val + '"');
      }
    }
  }

  return buf.join(' ');
};

/**
 * Escape the given string of `html`.
 *
 * @param {String} html
 * @return {String}
 * @api private
 */

exports.escape = function escape(html){
  return String(html)
    .replace(/&(?!(\w+|\#\d+);)/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
};

/**
 * Re-throw the given `err` in context to the
 * the jade in `filename` at the given `lineno`.
 *
 * @param {Error} err
 * @param {String} filename
 * @param {String} lineno
 * @api private
 */

exports.rethrow = function rethrow(err, filename, lineno){
  if (!filename) throw err;

  var context = 3
    , str = require('fs').readFileSync(filename, 'utf8')
    , lines = str.split('\n')
    , start = Math.max(lineno - context, 0)
    , end = Math.min(lines.length, lineno + context);

  // Error context
  var context = lines.slice(start, end).map(function(line, i){
    var curr = i + start + 1;
    return (curr == lineno ? '  > ' : '    ')
      + curr
      + '| '
      + line;
  }).join('\n');

  // Alter exception message
  err.path = filename;
  err.message = (filename || 'Jade') + ':' + lineno
    + '\n' + context + '\n\n' + err.message;
  throw err;
};

  return exports;

})({});

jade.templates = {};
jade.render = function(node, template, data) {
  var tmp = jade.templates[template](data);
  node.innerHTML = tmp;
};

jade.templates["list"] = function(locals, attrs, escape, rethrow, merge) {
attrs = attrs || jade.attrs; escape = escape || jade.escape; rethrow = rethrow || jade.rethrow; merge = merge || jade.merge;
var buf = [];
with (locals || {}) {
var interp;
buf.push('<nav class="navbar navbar-default"><div class="navbar-header"><a class="navbar-brand">' + escape((interp = title) == null ? '' : interp) + '</a></div><ul class="nav navbar-nav hidden-xs">');
if ( (Object.keys(counts.bytag).length > 0))
{
buf.push('<li class="dropdown"><a data-toggle="dropdown">Filter By Tag<span class="caret"></span></a><ul role="menu" aria-labelledby="dropdownMenu1" class="dropdown-menu"><li role="presentation">');
// iterate counts.bytag
;(function(){
  if ('number' == typeof counts.bytag.length) {
    for (var tag = 0, $$l = counts.bytag.length; tag < $$l; tag++) {
      var count = counts.bytag[tag];

buf.push('<a');
buf.push(attrs({ 'role':('menuitem'), 'tabindex':('-1'), 'href':('#!/'+type+'?tag='+escape(tag)) }, {"role":true,"tabindex":true,"href":true}));
buf.push('>' + escape((interp = tag) == null ? '' : interp) + ' (' + escape((interp = count) == null ? '' : interp) + ')</a>');
    }
  } else {
    for (var tag in counts.bytag) {
      var count = counts.bytag[tag];

buf.push('<a');
buf.push(attrs({ 'role':('menuitem'), 'tabindex':('-1'), 'href':('#!/'+type+'?tag='+escape(tag)) }, {"role":true,"tabindex":true,"href":true}));
buf.push('>' + escape((interp = tag) == null ? '' : interp) + ' (' + escape((interp = count) == null ? '' : interp) + ')</a>');
   }
  }
}).call(this);

buf.push('</li></ul></li>');
}
if ( (Object.keys(counts.byfeed).length > 0 ))
{
buf.push('<li class="dropdown"><a data-toggle="dropdown">Filter By Feed<span class="caret"></span></a><ul role="menu" aria-labelledby="dropdownMenu1" class="dropdown-menu"><li role="presentation">');
// iterate counts.byfeed
;(function(){
  if ('number' == typeof counts.byfeed.length) {
    for (var feed = 0, $$l = counts.byfeed.length; feed < $$l; feed++) {
      var count = counts.byfeed[feed];

buf.push('<a');
buf.push(attrs({ 'role':('menuitem'), 'tabindex':('-1'), 'href':('#!/'+type+'?feed='+escape(feed?feed.replace("/","%2F"):'+')) }, {"role":true,"tabindex":true,"href":true}));
buf.push('>' + escape((interp = feed) == null ? '' : interp) + ' (' + escape((interp = count) == null ? '' : interp) + ')    </a>');
    }
  } else {
    for (var feed in counts.byfeed) {
      var count = counts.byfeed[feed];

buf.push('<a');
buf.push(attrs({ 'role':('menuitem'), 'tabindex':('-1'), 'href':('#!/'+type+'?feed='+escape(feed?feed.replace("/","%2F"):'+')) }, {"role":true,"tabindex":true,"href":true}));
buf.push('>' + escape((interp = feed) == null ? '' : interp) + ' (' + escape((interp = count) == null ? '' : interp) + ')    </a>');
   }
  }
}).call(this);

buf.push('</li></ul></li>');
}
buf.push('</ul></nav>');
// iterate articles
;(function(){
  if ('number' == typeof articles.length) {
    for (var $index = 0, $$l = articles.length; $index < $$l; $index++) {
      var article = articles[$index];

buf.push('<div');
buf.push(attrs({ 'id':(article._id), "class": ('article') }, {"id":true}));
buf.push('><div class="row"><div class="col-md-1">');
if ( article.icon != null)
{
buf.push('<img');
buf.push(attrs({ 'src':(article.icon), "class": ('bigicon') }, {"src":true}));
buf.push('/>');
}
buf.push('</div><div class="col-md-11"><div class="feedName"> <a');
buf.push(attrs({ 'href':("#!/"+type+"?feed="+escape(article.feedName?article.feedName.replace("/","%2F"):"+")), "class": ('feedlink') }, {"href":true}));
buf.push('>@' + escape((interp = article.feedName) == null ? '' : interp) + '</a>');
if ( article.icon != null)
{
buf.push('<img');
buf.push(attrs({ 'src':(article.icon), "class": ('miniicon') }, {"src":true}));
buf.push('/>');
}
buf.push('<span class="tags ml10">');
// iterate article.tags  
;(function(){
  if ('number' == typeof article.tags  .length) {
    for (var $index = 0, $$l = article.tags  .length; $index < $$l; $index++) {
      var tag = article.tags  [$index];

buf.push('<a');
buf.push(attrs({ 'href':("#!/"+type+"?tag="+escape(tag.toLowerCase())) }, {"href":true}));
buf.push('><span class="label label-default mr10">');
var __val__ = tag
buf.push(escape(null == __val__ ? "" : __val__));
buf.push('</span></a>');
    }
  } else {
    for (var $index in article.tags  ) {
      var tag = article.tags  [$index];

buf.push('<a');
buf.push(attrs({ 'href':("#!/"+type+"?tag="+escape(tag.toLowerCase())) }, {"href":true}));
buf.push('><span class="label label-default mr10">');
var __val__ = tag
buf.push(escape(null == __val__ ? "" : __val__));
buf.push('</span></a>');
   }
  }
}).call(this);

buf.push('</span></div><div class="title"><a');
buf.push(attrs({ 'href':("Javascript:readArticle('"+article._id+"')") }, {"href":true}));
buf.push('>');
var __val__ = article.title
buf.push(escape(null == __val__ ? "" : __val__));
buf.push('</a><span class="diff">&nbsp; ' + escape((interp = article.diff) == null ? '' : interp) + '</span><a');
buf.push(attrs({ 'href':("Javascript:removeArticle('"+article._id+"')"), "class": ('close') }, {"href":true}));
buf.push('>&times;</a></div><a');
buf.push(attrs({ 'id':("summary"+article._id), 'href':("Javascript:readArticle('"+article._id+"')"), "class": ('summary') }, {"id":true,"href":true}));
buf.push('>');
var __val__ = article.summary
buf.push(escape(null == __val__ ? "" : __val__));
buf.push('</a><div class="expand"><a');
buf.push(attrs({ 'id':("expand"+article._id), 'href':("Javascript:readArticle('"+article._id+"')"), "class": ('mr10') }, {"id":true,"href":true}));
buf.push('>Expand</a><a');
buf.push(attrs({ 'id':("hide"+article._id), 'href':("Javascript:hideArticle('"+article._id+"')"), "class": ('mr10') + ' ' + ('tobeshown') }, {"id":true,"href":true}));
buf.push('>Hide</a></div></div></div><div class="row"><div class="col-md-12"><div');
buf.push(attrs({ 'id':("body"+article._id), "class": ('showable') + ' ' + ('pb20') }, {"id":true}));
buf.push('><a');
buf.push(attrs({ 'href':(article.link), 'target':('_blank'), "class": ('btn') + ' ' + ('mr5') }, {"href":true,"target":true}));
buf.push('><i class="icon-share"></i></a>');
 if (article.starred)
{
buf.push('<a');
buf.push(attrs({ 'id':("star"+article._id), 'href':("Javascript:unstarArticle('"+article._id+"')"), "class": ('btn-warning') + ' ' + ('btn') + ' ' + ('mr5') }, {"id":true,"href":true}));
buf.push('><i class="glyphicon glyphicon-star"></i></a>');
}
 else
{
buf.push('<a');
buf.push(attrs({ 'id':("star"+article._id), 'href':("Javascript:starArticle('"+article._id+"')"), "class": ('btn') + ' ' + ('mr5') }, {"id":true,"href":true}));
buf.push('><i class="glyphicon glyphicon-star"></i></a>');
}
buf.push('<a');
buf.push(attrs({ 'href':("http://twitter.com/share?url="+article.link), 'target':("_new"), 'rel':("nofollow"), "class": ('btn') + ' ' + ('mr5') }, {"href":true,"target":true,"rel":true}));
buf.push('><i class="icon-twitter"></i></a><a');
buf.push(attrs({ 'href':("http://www.facebook.com/sharer.php?u="+article.link), 'target':("_new"), 'rel':("nofollow"), "class": ('btn') + ' ' + ('mr5') }, {"href":true,"target":true,"rel":true}));
buf.push('><i class="icon-facebook"></i></a><div class="mb10"></div><iframe');
buf.push(attrs({ 'src':("api/" + (article._id) + "/"), 'srcdoc':("" + (article.description) + ""), 'sandbox':("allow-same-origin"), 'seamless':("seamless"), "class": ("article-description") }, {"class":true,"src":true,"srcdoc":true,"sandbox":true,"seamless":true}));
buf.push('></iframe></div><hr/></div></div></div>');
    }
  } else {
    for (var $index in articles) {
      var article = articles[$index];

buf.push('<div');
buf.push(attrs({ 'id':(article._id), "class": ('article') }, {"id":true}));
buf.push('><div class="row"><div class="col-md-1">');
if ( article.icon != null)
{
buf.push('<img');
buf.push(attrs({ 'src':(article.icon), "class": ('bigicon') }, {"src":true}));
buf.push('/>');
}
buf.push('</div><div class="col-md-11"><div class="feedName"> <a');
buf.push(attrs({ 'href':("#!/"+type+"?feed="+escape(article.feedName?article.feedName.replace("/","%2F"):"+")), "class": ('feedlink') }, {"href":true}));
buf.push('>@' + escape((interp = article.feedName) == null ? '' : interp) + '</a>');
if ( article.icon != null)
{
buf.push('<img');
buf.push(attrs({ 'src':(article.icon), "class": ('miniicon') }, {"src":true}));
buf.push('/>');
}
buf.push('<span class="tags ml10">');
// iterate article.tags  
;(function(){
  if ('number' == typeof article.tags  .length) {
    for (var $index = 0, $$l = article.tags  .length; $index < $$l; $index++) {
      var tag = article.tags  [$index];

buf.push('<a');
buf.push(attrs({ 'href':("#!/"+type+"?tag="+escape(tag.toLowerCase())) }, {"href":true}));
buf.push('><span class="label label-default mr10">');
var __val__ = tag
buf.push(escape(null == __val__ ? "" : __val__));
buf.push('</span></a>');
    }
  } else {
    for (var $index in article.tags  ) {
      var tag = article.tags  [$index];

buf.push('<a');
buf.push(attrs({ 'href':("#!/"+type+"?tag="+escape(tag.toLowerCase())) }, {"href":true}));
buf.push('><span class="label label-default mr10">');
var __val__ = tag
buf.push(escape(null == __val__ ? "" : __val__));
buf.push('</span></a>');
   }
  }
}).call(this);

buf.push('</span></div><div class="title"><a');
buf.push(attrs({ 'href':("Javascript:readArticle('"+article._id+"')") }, {"href":true}));
buf.push('>');
var __val__ = article.title
buf.push(escape(null == __val__ ? "" : __val__));
buf.push('</a><span class="diff">&nbsp; ' + escape((interp = article.diff) == null ? '' : interp) + '</span><a');
buf.push(attrs({ 'href':("Javascript:removeArticle('"+article._id+"')"), "class": ('close') }, {"href":true}));
buf.push('>&times;</a></div><a');
buf.push(attrs({ 'id':("summary"+article._id), 'href':("Javascript:readArticle('"+article._id+"')"), "class": ('summary') }, {"id":true,"href":true}));
buf.push('>');
var __val__ = article.summary
buf.push(escape(null == __val__ ? "" : __val__));
buf.push('</a><div class="expand"><a');
buf.push(attrs({ 'id':("expand"+article._id), 'href':("Javascript:readArticle('"+article._id+"')"), "class": ('mr10') }, {"id":true,"href":true}));
buf.push('>Expand</a><a');
buf.push(attrs({ 'id':("hide"+article._id), 'href':("Javascript:hideArticle('"+article._id+"')"), "class": ('mr10') + ' ' + ('tobeshown') }, {"id":true,"href":true}));
buf.push('>Hide</a></div></div></div><div class="row"><div class="col-md-12"><div');
buf.push(attrs({ 'id':("body"+article._id), "class": ('showable') + ' ' + ('pb20') }, {"id":true}));
buf.push('><a');
buf.push(attrs({ 'href':(article.link), 'target':('_blank'), "class": ('btn') + ' ' + ('mr5') }, {"href":true,"target":true}));
buf.push('><i class="icon-share"></i></a>');
 if (article.starred)
{
buf.push('<a');
buf.push(attrs({ 'id':("star"+article._id), 'href':("Javascript:unstarArticle('"+article._id+"')"), "class": ('btn-warning') + ' ' + ('btn') + ' ' + ('mr5') }, {"id":true,"href":true}));
buf.push('><i class="glyphicon glyphicon-star"></i></a>');
}
 else
{
buf.push('<a');
buf.push(attrs({ 'id':("star"+article._id), 'href':("Javascript:starArticle('"+article._id+"')"), "class": ('btn') + ' ' + ('mr5') }, {"id":true,"href":true}));
buf.push('><i class="glyphicon glyphicon-star"></i></a>');
}
buf.push('<a');
buf.push(attrs({ 'href':("http://twitter.com/share?url="+article.link), 'target':("_new"), 'rel':("nofollow"), "class": ('btn') + ' ' + ('mr5') }, {"href":true,"target":true,"rel":true}));
buf.push('><i class="icon-twitter"></i></a><a');
buf.push(attrs({ 'href':("http://www.facebook.com/sharer.php?u="+article.link), 'target':("_new"), 'rel':("nofollow"), "class": ('btn') + ' ' + ('mr5') }, {"href":true,"target":true,"rel":true}));
buf.push('><i class="icon-facebook"></i></a><div class="mb10"></div><iframe');
buf.push(attrs({ 'src':("api/" + (article._id) + "/"), 'srcdoc':("" + (article.description) + ""), 'sandbox':("allow-same-origin"), 'seamless':("seamless"), "class": ("article-description") }, {"class":true,"src":true,"srcdoc":true,"sandbox":true,"seamless":true}));
buf.push('></iframe></div><hr/></div></div></div>');
   }
  }
}).call(this);

}
return buf.join("");
}