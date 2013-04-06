var apiMarkAsRead=function(id) {
  $.getJSON("/api/"+id+"/read", function(data) {
     $("#description"+id).html(data.description);
  });

}

var apiStar=function(id) {
  $.getJSON("/api/"+id+"/star", function(data) {
    
  })
}

var apiUnstar=function(id) {
  $.getJSON("/api/"+id+"/unstar", function() {
    
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
  $.getJSON("/api/feed/add", data,  function(retval) {
    $('#addfeedback').html("<div class='well'>"+retval.message+"</div>");
  })
  return false;
}

var addTag = function(feedid) {

  var data = {tag : $('#tagName').val()}
  $.getJSON("/api/feed/"+feedid+"/tag/add", data,  function(retval) {
    location.reload();
  })
  return false;
}

var removeTag = function(feedid, tag) {
  var data = {tag : tag}
  $.getJSON("/api/feed/"+feedid+"/tag/remove", data,  function(retval) {
    location.reload();
  })
  return false;
}

var removeFeed = function(feedid) {
  $.getJSON("/api/feed/"+feedid+"/remove",  function(retval) {
    location.href="/feeds";
  })
  return false;
}

var showAll = function() {
  $('.article').each(function(index){ 
    readArticle(this.id);
  });
}