(function(){const r=document.createElement("link").relList;if(r&&r.supports&&r.supports("modulepreload"))return;for(const e of document.querySelectorAll('link[rel="modulepreload"]'))s(e);new MutationObserver(e=>{for(const t of e)if(t.type==="childList")for(const o of t.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&s(o)}).observe(document,{childList:!0,subtree:!0});function l(e){const t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin==="use-credentials"?t.credentials="include":e.crossOrigin==="anonymous"?t.credentials="omit":t.credentials="same-origin",t}function s(e){if(e.ep)return;e.ep=!0;const t=l(e);fetch(e.href,t)}})();new Swiper(".swiper",{centeredSlides:!0,direction:"horizontal",lazyloading:!0,freeMode:!0,pagination:{el:".swiper-pagination",clickable:!0},navigation:{nextEl:".swiper-button-next",prevEl:".swiper-button-prev"},scrollbar:{el:".swiper-scrollbar"},breakpoints:{320:{slidesPerView:1,spaceBetween:50,loop:!1},768:{slidesPerView:2,spaceBetween:30,loop:!0},1024:{slidesPerView:3,spaceBetween:40,loop:!0}}});const i=document.querySelector(".burger");let n=!1;i.addEventListener("click",()=>{n?(i.classList.remove("open"),n=!1,document.getElementById("header__nav").style.height="0%"):(i.classList.add("open"),n=!0,document.getElementById("header__nav").style.height="100%")});
