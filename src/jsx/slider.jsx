//TODO swiper framework
// import Swiper JS
import Swiper from 'swiper';
// import Swiper styles
import 'swiper/css';
import 'swiper/css';
import { Navigation, Pagination } from 'swiper/modules';
// import Swiper and modules styles
import 'swiper/css/navigation';
import 'swiper/css/pagination';
// initializing Swiper:
const swiper = new Swiper('.swiper', {
  modules: [Navigation, Pagination],
  direction: 'vertical',
  loop: true,
  // pagination
  pagination: {
    el: '.swiper-pagination',
    clickable: true,
  },
  // navigation
  navigation: {
    nextEl: '.swiper-button-next',
    prevEl: '.swiper-button-prev',
  },
  //scrollbar
  scrollbar: {
    el: '.swiper-scrollbar',
  },
});

import { A11y, Autoplay } from 'swiper/modules';

import { Swiper, SwiperSlide } from 'swiper/react';

import 'swiper/css';

import './slider.scss';

const Slider = () => {
  return (
    <section className="slider">
      <Swiper
        modules={[A11y, Autoplay]}
        slidesPerView={3}
        spaceBetween={52}
        centeredSlides={true}
        loop={true}
        autoplay={{
          delay: 2000,
          disableOnInteraction: false,
        }}
        className="custom-swiper-slider"
      >
        <SwiperSlide>
          <div className="slide">
            <img src={One} alt="PhotoOne" />
          </div>
        </SwiperSlide>
        <SwiperSlide>
          <div className="slide">
            <img src={Two} alt="PhotoTwo" />
          </div>
        </SwiperSlide>
        <SwiperSlide>
          <div className="slide">
            <img src={Three} alt="PhotoThree" />
          </div>
        </SwiperSlide>
        <SwiperSlide>
          <div className="slide">
            <img src={Four} alt="PhotoFour" />
          </div>
        </SwiperSlide>
        <SwiperSlide>
          <div className="slide">
            <img src={Five} alt="PhotoFive" />
          </div>
        </SwiperSlide>
      </Swiper>
    </section>
  );
};
export default Slider;