// Кнопка "Бесплатная консультация"
document.querySelector('.consult-btn').addEventListener('click', () => {
  gsap.to(this, {
    scale: 0.95,
    repeat: 1,
    yoyo: true,
    duration: 0.3
  });
  openModal('consultation');
});

// Кнопки тарифов
document.querySelectorAll('.pricing-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const plan = btn.dataset.plan;
    window.location.href = `/checkout?plan=${plan}`;
  });
});

// Плавный скролл
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    e.preventDefault();
    gsap.to(window, {
      scrollTo: document.querySelector(this.getAttribute('href')),
      duration: 1,
      ease: "power2.inOut"
    });
  });
});