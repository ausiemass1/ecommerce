
$(document).ready(function(){
  $('.modal').modal();
  // $(".dropdown-trigger").dropdown();
  $('.sidenav').sidenav();
  // $(".button-collapse").sideNav();
  $('.collapsible').collapsible();
  // $('.carousel').carousel();
});

function toggleModal( ){
var instance = M.modal.getInstance($("modal1"));
instance.open();
}

document.addEventListener('DOMContentLoaded', function() {
  var elems = document.querySelectorAll('.carousel');
  var instances = M.Carousel.init(elems, {
    noWrap: true,
    indicators: true
  });
});


document.addEventListener('DOMContentLoaded', function() {
  var elems = document.querySelectorAll('.dropdown-trigger');
  var instances = M.Dropdown.init(elems, {
    coverTrigger: false,
    hover: true
  });
});

document.addEventListener('DOMContentLoaded', function() {
  var elems = document.querySelectorAll('.tooltipped');
  var instances = M.Tooltip.init(elems, options);
});
