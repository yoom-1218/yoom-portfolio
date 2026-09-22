$('.btn').click(function(e){
  e.preventDefault();

  $('html, body').animate({
    scrollTop: $('.projects').offset().top
  }, 600);
});