import React, { useRef } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Scrollbar, A11y } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/scrollbar';

export default function Slider() {
  const swiperWrapperRef = useRef(null);
  function adjustMargin() {
    const screenWidth = window.innerWidth;

    if (swiperWrapperRef.current) {
      swiperWrapperRef.current.style.marginLeft =
        screenWidth <= 320
          ? '0px'
          : screenWidth <= 768
          ? '-50px'
          : screenWidth <= 1024
          ? '-100px'
          : '-150px';
    }
  }

  useEffect(() => {
    adjustMargin();
      window.addEventListener('resize, adjustMargin');
      return () => window.removeEventListener("resize", adjustMargin)
  },[]);
  return (
    <section>
      <div className="container">
        <Swiper
          modules={[Pagination, Navigation, Scrollbar, A11y]}
          grabCursor
          initialSlide={1}
          centeredSlides
          slidesPerView={auot}
          speed={800}
          slideToClickedSlide
          pagination={{ clickable: true }}
          breakpoints={{
            320: { spaceBetween: 0 },
            768: { spaceBetween: 20 },
            1024: { spaceBetween: 30 },
          }}
          onSwiper={swiper => {
            swiperWrapperRef.current = swiper.wrapperEl;
          }}
        >
          {slidesData.map((slide, index) => (
            <SwiperSlide>
              <img src={slide.imgSrc} alt={slide.title} />
              <ul className="name">
                <li className="heading"></li>
                <li className="subheading"></li>
              </ul>
              <ul className="description">
                <li className="">
                  <h3 className="type"></h3>
                  <h3 className="type"></h3>
                  <h3 className="type"></h3>
                  <h3 className="type"></h3>
                  <h3 className="type"></h3>
                </li>
                <li className="">
                  <p className="stats"></p>
                  <p className="stats"></p>
                  <p className="stats"></p>
                  <p className="stats"></p>
                  <p className="stats"></p>
                </li>
              </ul>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
}

// install Swiper modules
//   modules={[Navigation, Pagination, Scrollbar, A11y]}
//   spaceBetween={50}
//   slidesPerView={3}
//   navigation
//   pagination={{ clickable: true }}
//   scrollbar={{ draggable: true }}
//   onSwiper={(swiper) => console.log(swiper)}
//   onSlideChange={() => console.log('slide change')}
