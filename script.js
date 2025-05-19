function openLogin() {
  const loginOverlay = document.getElementById("loginOverlay");
  if (loginOverlay) {
    loginOverlay.style.display = "flex";
  }
  document.body.classList.add("blur-effect");
}

function closeLogin() {
  const loginOverlay = document.getElementById("loginOverlay");
  if (loginOverlay) {
    loginOverlay.style.display = "none";
  }
  document.body.classList.remove("blur-effect");
}

function toggleAnimation() {
  const container = document.getElementById('cards-container');
  if (container) {
    container.classList.toggle('paused');
  }
}
// Show header on scroll up, hide on scroll down
let lastScrollTop = 0;
window.addEventListener("scroll", function() {
    const header = document.querySelector("header");
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    if (scrollTop > lastScrollTop) {
        header.classList.remove("show");
    } else {
        header.classList.add("show");
    }
    lastScrollTop = scrollTop;
});
