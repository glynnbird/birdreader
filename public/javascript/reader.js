var apiMarkAsRead=function(id) {
  $.getJSON("/api/"+id+"/read", function(data) {
     $("#description"+id).html(data.description);
  });

}

var apiStar=function(id) {
  $.getJSON("/api/"+id+"/star", function(data) {
    console.log("request made")
  })
}

var apiUnstar=function(id) {
  $.getJSON("/api/"+id+"/unstar", function() {
    console.log("request made")
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
  console.log("readArticle",id)
  $('#body'+id).show();
  $('#hide'+id).show();
  $('#expand'+id).hide();
  apiMarkAsRead(id);
}

var hideArticle = function(id) {
  console.log("hide",id)
  $('#body'+id).hide();
  $('#hide'+id).hide();
  $('#expand'+id).show();
}

var removeArticle = function(id) {
  console.log("removeArticle",id);
  $('#'+id).hide();
  apiMarkAsRead(id);
}

var readAll = function() {
  console.log("readAll")
  $('.showable').show(1);
}