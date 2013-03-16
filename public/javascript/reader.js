var apiMarkAsRead=function(id) {
  $.getJSON("/api/"+id+"/read", function(data) {
     $("#description"+id).html(data.description);
  });

}

var apiStar=function(id) {
  $.get("/api/"+id+"/star", function() {
    console.log("request made")
  })
  .done(function() { console.log("success"); })
  .fail(function() { console.log("error"); })
  .always(function() { console.log("finished"); });
}

var starArticle = function(id) {
  apiStar(id);
  $('#star'+id).addClass('btn-warning');
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