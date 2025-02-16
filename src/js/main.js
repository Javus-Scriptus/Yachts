$(function(){
    $('.review__slider').slick({
        infinite: true,
        dots:true,
        slidesToShow: 3,
        slidesToScroll: 3,
        prevArrow: '<img class="section3-slider__arrow slider__arrow-left" src="" alt="">',
        nextArrow: '<img class="section3-slider__arrow slider__arrow-right" src="" alt="">',
        responsive: [
            {
              breakpoint: 770,
              settings: {
            infinite: true,
            slidesToShow: 2,
            slidesToScroll: 1,
            dots: true
              }
            }
          ]
    });
    });