// import './js/slider.js';
// import './js/jquery-fancybox.min.js';
// import './js/slick.min.js';

//TODO please, explaine this code!!!
$(function () {
  $('.review__slider').slick({
    infinite: true,
    dots: true,
    slidesToShow: 3,
    slidesToScroll: 3,
    prevArrow:
      '<img class="section3-slider__arrow slider__arrow-left" src="" alt="">',
    nextArrow:
      '<img class="section3-slider__arrow slider__arrow-right" src="" alt="">',
    responsive: [
      {
        breakpoint: 770,
        settings: {
          infinite: true,
          slidesToShow: 2,
          slidesToScroll: 1,
          dots: true,
        },
      },
    ],
  });
});

// header modal

const menuBtn = document.querySelector('.burger');
let menuOpen = false;
menuBtn.addEventListener('click', () => {
  if (!menuOpen) {
    menuBtn.classList.add('open');
    menuOpen = true;
    document.getElementById('burger').style.height = '100%';
  } else {
    menuBtn.classList.remove('open');
    menuOpen = false;
    document.getElementById('nav').style.height = '0%';
  }
});
