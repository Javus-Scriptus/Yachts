(() => {
  const refs = {
    form: document.querySelector('.form__rend__yacht'),
    modal: document.querySelector('[data-modal]'),
    closeModalBtn: document.querySelector('[data-modal-close]'),
  };

  // Обробка відправки форми
  refs.form.addEventListener('submit', function (event) {
    event.preventDefault(); // Зупиняємо стандартну відправку форми

    // Очищаємо форму
    refs.form.reset();

    // Відкриваємо модальне вікно
    toggleModal();
  });

  // Закриття модального вікна
  refs.closeModalBtn.addEventListener('click', toggleModal);

  // Закриття модального вікна при кліку поза ним
  refs.modal.addEventListener('click', function (event) {
    if (event.target === refs.modal) {
      toggleModal();
    }
  });

  function toggleModal() {
    refs.modal.classList.toggle('is-hidden');
    document.body.classList.toggle('no-scroll');
  }
})();
