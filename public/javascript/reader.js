var apiMarkAsRead=function(id) {
  $.getJSON("api/"+id+"/read", function(data) {
     $("#description"+id).html(data.description);
     $('img').addClass('img-responsive');
     $('img').addClass('iframe-responsive');
  });

}

var apiStar=function(id) {
  $.getJSON("api/"+id+"/star", function(data) {
    
  })
}

var apiUnstar=function(id) {
  $.getJSON("api/"+id+"/unstar", function() {
    
  })
}

var starArticle = function(id) {
  apiStar(id);
  $('#star'+id).addClass('btn-warning');
}

var unstarArticle = function(id) {
  apiUnstar(id);
  $('#star'+id).removeClass('btn-warning');
}

var readArticle = function(id) {
  $('#body'+id).show();
  $('#hide'+id).show();
  $('#expand'+id).hide();
  $('#summary'+id).hide();
  apiMarkAsRead(id);
}

var hideArticle = function(id) {
  $('#body'+id).hide();
  $('#hide'+id).hide();
  $('#summary'+id).show();
  $('#expand'+id).show();
}

var removeArticle = function(id) {
  $('#'+id).hide();
  apiMarkAsRead(id);
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

var doBrowse = function() {
  $("#target").html("<h1>...</h1>");
  $.ajax({
    url: "api/html/next",
    cache: false
  }).done(function( html ) {
    $("#target").html(html);
    $('#browsemodecount').html(latest_unread);
    $(".nbc").collapse('hide')   ;
    $('img').addClass('img-responsive'); 
    $('iframe').addClass('iframe-responsive');
  });
}

var doUnread = function() {
  $("#target").html("<h1>...</h1>");
  var bits = window.location.href.split("?");
  var data = "";
  if(bits.length > 0) {
    data = bits[1];
  }
  $.ajax({
    url: "api/html/unread",
    cache: false,
    data: data
  }).done(function( html ) {
    $("#target").html(html);
    $(".nbc").collapse('hide')
  });
}

var doRead = function() {
  $("#target").html("<h1>...</h1>");
  var bits = window.location.href.split("?");
  var data = "";
  if(bits.length > 0) {
    data = bits[1];
  }
  $.ajax({
    url: "api/html/readed",
    cache: false,
    data: data
  }).done(function( html ) {
    $("#target").html(html);
    $(".nbc").collapse('hide');
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
  });
};

var doAddForm = function() {
  $("#target").html("<h1>...</h1>");
  $.ajax({
    url: "api/html/add",
    cache: false
  }).done(function( html ) {
    $("#target").html(html);
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
  var socket = io.connect(window.location.hostname);
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
  });
  
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


