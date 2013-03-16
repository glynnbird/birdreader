var apiMarkAsRead=function(id) {
  $.get("/api/"+id+"/read", function() {
    console.log("request made")
  })
  .done(function() { console.log("success"); })
  .fail(function() { console.log("error"); })
  .always(function() { console.log("finished"); });
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
  apiMarkAsRead(id);
}

var hideArticle = function(id) {
  console.log("hide",id)
  $('#body'+id).hide(1);
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