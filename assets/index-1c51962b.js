(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const e of document.querySelectorAll('link[rel="modulepreload"]'))i(e);new MutationObserver(e=>{for(const r of e)if(r.type==="childList")for(const s of r.addedNodes)s.tagName==="LINK"&&s.rel==="modulepreload"&&i(s)}).observe(document,{childList:!0,subtree:!0});function o(e){const r={};return e.integrity&&(r.integrity=e.integrity),e.referrerPolicy&&(r.referrerPolicy=e.referrerPolicy),e.crossOrigin==="use-credentials"?r.credentials="include":e.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function i(e){if(e.ep)return;e.ep=!0;const r=o(e);fetch(e.href,r)}})();$(function(){$(".review__slider").slick({infinite:!0,dots:!0,slidesToShow:3,slidesToScroll:3,prevArrow:'<img class="section3-slider__arrow slider__arrow-left" src="" alt="">',nextArrow:'<img class="section3-slider__arrow slider__arrow-right" src="" alt="">',responsive:[{breakpoint:770,settings:{infinite:!0,slidesToShow:2,slidesToScroll:1,dots:!0}}]})});new Swiper(".swiper",{loop:!1,centeredSlides:!0,direction:"horizontal",lazyloading:!0,freeMode:!1,pagination:{el:".swiper-pagination",clickable:!0},navigation:{nextEl:".swiper-button-next",prevEl:".swiper-button-prev"},scrollbar:{el:".swiper-scrollbar"},breakpoints:{320:{slidesPerView:1,spaceBetween:50},768:{slidesPerView:2,spaceBetween:20},1024:{slidesPerView:3,spaceBetween:40}}});
