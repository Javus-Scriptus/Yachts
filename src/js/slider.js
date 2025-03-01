const swiper = new Swiper('.swiper', {
  loop: true,
  centeredSlides: true,
  direction: 'horizontal',
  lazyloading: true,
  freeMode: true,
  // autoplay: {
  //   delay: 5000,
  //   disableOnInteraction: false,
  // },
  pagination: {
    el: '.swiper-pagination',
    clickable: true,
  },
  navigation: {
    nextEl: '.swiper-button-next',
    prevEl: '.swiper-button-prev',
  },
  scrollbar: {
    el: '.swiper-scrollbar',
  },
  breakpoints: {
    320: {
      slidesPerView: 1,
      spaceBetween: 50,
    },
    768: {
      slidesPerView: 2,
      spaceBetween: 30,
    },
    1024: {
      slidesPerView: 3,
      spaceBetween: 40,
    },
  },
});

const menuBtn = document.querySelector('.burger');
let menuOpen = false;
menuBtn.addEventListener('click', () => {
  if (!menuOpen) {
    menuBtn.classList.add('open');
    menuOpen = true;
    document.getElementById('header__nav').style.height = '100%';
  } else {
    menuBtn.classList.remove('open');
    menuOpen = false;
    document.getElementById('header__nav').style.height = '0%';
  }
});
