const revealObserver = new IntersectionObserver((entries) => entries.forEach((entry) => {
  if (entry.isIntersecting) { entry.target.classList.add('visible'); revealObserver.unobserve(entry.target); }
}), { threshold: .1 });
document.querySelectorAll('.reveal').forEach((item) => revealObserver.observe(item));

const menu = document.querySelector('.menu');
const nav = document.querySelector('.topbar nav');
menu?.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  menu.setAttribute('aria-expanded', String(open));
});
nav?.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => nav.classList.remove('open')));

const toast = document.querySelector('.toast');
let toastTimer;
function showToast(message) {
  toast.textContent = message; toast.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('show'), 2400);
}
document.querySelectorAll('[data-copy]').forEach((button) => button.addEventListener('click', async () => {
  const value = button.dataset.copy;
  try { await navigator.clipboard.writeText(value); showToast('Código copiado: ' + value); }
  catch { showToast('Código de demo: ' + value); }
}));
