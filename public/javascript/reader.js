
/****************************************/
/* POUCH DB */
var db = new PouchDB("articles");
var remoteCouch = 'http://127.0.0.1:5984/articles';
var opts = {live: true};
var timeout = null;
var latestCounts = {};
db.sync(remoteCouch, opts)
.on('change', function (info) {
  console.log("CHANGE",info);
  
  // when a change arrives, update the counts, but no more frequently thatn once every 0.5 s
  if (timeout==null) {
    timeout = setTimeout(function() {
      fetchStats(function() {
        
      });
      timeout=null;
    }, 500);
  }
  // handle change
}).on('complete', function (info) {
    console.log("COMPLETE",info);
  // handle complete
}).on('uptodate', function (info) {
    console.log("UPTODATE",info);
  // handle up-to-date
}).on('error', function (err) {
    console.log("ERROR",info);
  // handle error
});

var docify = function(arr) {
  var retval = [ ];
  for(var i in arr.rows) {
    retval.push(arr.rows[i].doc);
  }
  return retval;
}
// get counts of read/unread/starred articles
var stats = function (callback) {
  var retval = {},
    i = 0;

  var options = {
    group: true,
    group_level: 1    
  };

  // equivalent of CouchDB /articles/_design/matching/_view/byts?group_level=1
  db.query("matching/byts", options, function (err, data) {
    
    console.log("QUERY",data);
    retval = {};
    if (!err) {
      for (i = 0; i < data.rows.length; i++) {
        retval[data.rows[i].key[0]] = data.rows[i].value;
      }
    }
    latestCounts = retval;
    callback(err, retval);
  });
};

// fetch the stats and present as totals on the UI
var fetchStats = function(callback) {
  stats(function(err,data) {
    if(!err) {
      data.unread = (data.unread)?data.unread:"";
      data.read = (data.read)? data.read:"";
      data.starred = (data.starred)? data.starred:"";
      latest_unread = data.unread;
      $('#browsecount').html(data.unread);
      $('#unreadcount').html(data.unread);
      $('#readcount').html(data.read); 
      $('#starredcount').html(data.starred); 
      if($('#browsemodecount')) {
        $('#browsemodecount').html(data.unread);
      }
    }
    callback();
  })
}


var doUnread = function() {
  $("#target").html("<h1>...</h1>");
  var bits = window.location.href.split("?");
  var data = "";
  if(bits.length > 0) {
    data = bits[1];
  }
  
  var opts = {
    limit: 20,
    reduce: false,
    include_docs: true,
    startkey: ["unread"],
    endkey: ["unread" + "z"]
  }
  db.query("matching/byts", opts , function(err,data) { 
    console.log("UNREAD",err,data); 
    var articles = docify(data);
   // $('#target').html("<pre>" + JSON.stringify(articles,null," ") + "</pre>")
   latestCounts.bytag = { };
   latestCounts.byfeed = { };
   
    jade.render(document.getElementById('target'), 'list', { type: "unread", title: "Unread", counts: latestCounts ,articles: articles});
    autosizeIframes($("#target").find(".article-description"));
    $(".nbc").collapse('hide');
  });
};


var doRead = function() {
  $("#target").html("<h1>...</h1>");
  var bits = window.location.href.split("?");
  var data = "";
  if(bits.length > 0) {
    data = bits[1];
  }
  
  var opts = {
    limit: 20,
    reduce: false,
    include_docs: true,
    startkey: ["read"],
    endkey: ["read" + "z"]
  }
  db.query("matching/byts", opts , function(err,data) { 
    console.log("READ",err,data); 
    var articles = docify(data);
   // $('#target').html("<pre>" + JSON.stringify(articles,null," ") + "</pre>")
   latestCounts.bytag = { };
   latestCounts.byfeed = { };
   
    jade.render(document.getElementById('target'), 'list', { type: "read", title: "Unread", counts: latestCounts ,articles: articles});
    autosizeIframes($("#target").find(".article-description"));
    $(".nbc").collapse('hide');
  });
}


var markAsRead = function(id) {
  db.get(id, function(err, thedoc) {
    if (thedoc.read == false) {
      thedoc.read = true;
      db.put(thedoc, id, thedoc._rev, function(err, response) {
        console.log("marked as read", id, thedoc)
      });
    }
  });
}

var readArticle = function(id) {
  $('#body'+id).show();
  $('#hide'+id).show();
  $('#expand'+id).hide();
  $('#summary'+id).hide();
  markAsRead(id);
}

var starArticle = function(id) {
  db.get(id, function(err, thedoc) {
    if (thedoc.starred == false) {
      thedoc.starred = true;
      db.put(thedoc, id, thedoc._rev, function(err, response) {
        console.log("marked as starred", id, thedoc)
      });
    }
    $('#star'+id).addClass('btn-warning');
  });
}

var unstarArticle = function(id) {
  db.get(id, function(err, thedoc) {
    if (thedoc.starred == true) {
      thedoc.starred = false;
      db.put(thedoc, id, thedoc._rev, function(err, response) {
        console.log("marked as unstarred", id, thedoc)
      });
    }
    $('#star'+id).removeClass('btn-warning');
  });

}

var removeArticle = function(id) {
  $('#'+id).hide();
  markAsRead(id);
}

/* ***************************************** */



/*
var apiMarkAsRead=function(id) {
  $.getJSON("api/"+id+"/read", function(data) {
     $('img').addClass('img-responsive');
     $('img').addClass('iframe-responsive');
  });
}

var apiStar=function(id) {
  $.getJSON("api/"+id+"/star", function(data) {
    
  })
}
*/
/*
var apiUnstar=function(id) {
  $.getJSON("api/"+id+"/unstar", function() {
    
  })
}
*/





var hideArticle = function(id) {
  $('#body'+id).hide();
  $('#hide'+id).hide();
  $('#summary'+id).show();
  $('#expand'+id).show();
}


var readAll = function() {
  $('.showable').show(1);
}

var addFeed = function() {
  var data = {url : $('#url').val()}
  $.getJSON("api/feed/add", data,  function(retval) {
    $('#addfeedback').html("<div class='well'>"+retval.message+"</div>");
  })
  return false;
}

var addTag = function(feedid) {

  var data = {tag : $('#tagName').val()}
  $.getJSON("api/feed/"+feedid+"/tag/add", data,  function(retval) {
    location.reload();
  })
  return false;
}

var removeTag = function(feedid, tag) {
  var data = {tag : tag}
  $.getJSON("api/feed/"+feedid+"/tag/remove", data,  function(retval) {
    location.reload();
  })
  return false;
}

var removeFeed = function(feedid) {
  $.getJSON("api/feed/"+feedid+"/remove",  function(retval) {
    location.href="#!/feeds";
  })
  return false;
}

var showAll = function() {
  $('.article').each(function(index){ 
    readArticle(this.id);
  });
}

var autosizeIframes = function(iframes) {
  iframes.on('load', function () {
    $('<style type="text/css">img { max-width: 100%; height: auto; }</style>').appendTo($(this.contentDocument.head));
    this.height = this.contentDocument.body.scrollHeight + "px";
  });
}

var doBrowse = function() {
  $("#target").html("<h1>...</h1>");
  $.ajax({
    url: "api/html/next",
    cache: false
  }).done(function( html ) {
    $("#target").html(html);
    autosizeIframes($("#target").find(".article-description"));
    $('#browsemodecount').html(latest_unread);
    $(".nbc").collapse('hide');
    $('img').addClass('img-responsive'); 
    $('iframe').addClass('iframe-responsive');
  });
}




var doStarred = function() {
  $("#target").html("<h1>...</h1>");
  var bits = window.location.href.split("?");
  var data = "";
  if(bits.length > 0) {
    data = bits[1];
  }
  $.ajax({
    url: "api/html/starred",
    cache: false,
    data: data
  }).done(function( html ) {
    $("#target").html(html);
    autosizeIframes($("#target").find(".article-description"));
    $(".nbc").collapse('hide')
  });
}

var doFeeds = function() {
  $("#target").html("<h1>...</h1>");
  $.ajax({
    url: "api/html/feeds",
    cache: false
  }).done(function( html ) {
    $("#target").html(html);
    autosizeIframes($("#target").find(".article-description"));
    $(".nbc").collapse('hide')
  });
}

var doSingleFeed = function() {
  $("#target").html("<h1>...</h1>");
  var bits = window.location.href.split("?");
  var data = "";
  if(bits.length > 0) {
    data = bits[1];
  }
  $.ajax({
    url: "api/html/feed",
    cache: false,
    data: data
  }).done(function( html ) {
    $("#target").html(html);
    autosizeIframes($("#target").find(".article-description"));
  });
}

var doSearch = function() {
  $("#target").html("<h1>...</h1>");
  var bits = window.location.href.split("?");
  var data = "";
  if(bits.length > 0) {
    data = bits[1];
  }
  $.ajax({
    url: "api/html/search",
    cache: false,
    data: data
  }).done(function( html ) {
    $("#target").html(html);
    autosizeIframes($("#target").find(".article-description"));
  });
};

var doAddForm = function() {
  $("#target").html("<h1>...</h1>");
  $.ajax({
    url: "api/html/add",
    cache: false
  }).done(function( html ) {
    $("#target").html(html);
    autosizeIframes($("#target").find(".article-description"));
  });
}

var searchRedirect = function() {
  var url = "#!/search?keywords=" + escape($('#keywords').val());
  window.location = url;
  return false;
}

var latest_unread = '0';

$(document).ready(function () { 
  $(".nbc").collapse('hide');
/*  var socket = io.connect(window.location.hostname);
  socket.on('news', function (data) {
    latest_unread = data.unread;
    $('#browsecount').html(data.unread);
    $('#unreadcount').html(data.unread);
    $('#readcount').html(data.read); 
    $('#starredcount').html(data.starred); 
    if($('#browsemodecount')) {
      $('#browsemodecount').html(data.unread);
    }
  });
  
  socket.on('connect', function () {
    $('#connected').html(" <i class='icon icon-star icon-white'></i>");
  });
  socket.on('disconnect', function () {
    $('#connected').html(" <i class='icon icon-star-empty icon-white'></i>");
  });*/

});


Path.map("#!/browse").to(function(){
  doBrowse();
});

Path.map("#!/unread").to(function(){
  doUnread();
});

Path.map("#!/read").to(function(){
  doRead();
});

Path.map("#!/starred").to(function(){
  doStarred();
});

Path.map("#!/feeds").to(function(){
  doFeeds();
});

Path.map("#!/search").to(function(){
  doSearch();
});

Path.map("#!/add").to(function(){
  doAddForm();
});

Path.map("#!/feed").to(function(){
  doSingleFeed();
});

Path.root("#!/browse");

Path.listen();



//

fetchStats(function() {
  
});