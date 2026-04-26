// Mobile navigation toggle
const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');
const cardPhotos = document.querySelectorAll('.card-photo');

function randomBetween(min, max) {
if (max <= min) return min;
return Math.random() * (max - min) + min;
}

function layoutThrownCards() {
const cluster = document.querySelector('.hero-image-cluster');
if (!cluster || cardPhotos.length === 0) return;

const clusterRect = cluster.getBoundingClientRect();
const firstCardRect = cardPhotos[0].getBoundingClientRect();
const cardWidth = firstCardRect.width || 120;
const cardHeight = firstCardRect.height || 120;
const maxX = Math.max(0, clusterRect.width - cardWidth);
const maxY = Math.max(0, clusterRect.height - cardHeight);

cardPhotos.forEach((photo, index) => {
    const x = randomBetween(0, maxX);
    const y = randomBetween(Math.min(12, maxY), maxY);
    const angle = randomBetween(-22, 22);
    const startX = randomBetween(-80, 80);
    const startRotate = randomBetween(-35, 35);

    photo.style.setProperty('--card-x', `${x}px`);
    photo.style.setProperty('--card-y', `${y}px`);
    photo.style.setProperty('--card-angle', `${angle}deg`);
    photo.style.setProperty('--card-start-x', `${startX}px`);
    photo.style.setProperty('--card-start-rotate', `${startRotate}deg`);
    photo.style.setProperty('--card-delay', `${index * 115}ms`);
    photo.style.zIndex = String(index + 1);
});
}

layoutThrownCards();
function getPageFromHash() {
return window.location.hash.replace('#', '') || 'home';
}

function activatePage(pageName) {
const pages = document.querySelectorAll('.page-section');
const navItems = document.querySelectorAll('.nav-links a[href^="#"]');
const targetPage = document.querySelector(`[data-page="${pageName}"]`) ? pageName : 'home';

pages.forEach(page => {
    page.classList.toggle('is-active', page.dataset.page === targetPage);
});

navItems.forEach(link => {
    link.classList.toggle('active', link.getAttribute('href') === `#${targetPage}`);
});

navLinks.classList.remove('active');
hamburger.classList.remove('active');
window.scrollTo(0, 0);

if (targetPage === 'home') {
    layoutThrownCards();
}

requestAnimationFrame(animateOnScroll);
}

hamburger.addEventListener('click', () => {
navLinks.classList.toggle('active');
hamburger.classList.toggle('active');
});
// Close mobile menu when clicking on a link
document.querySelectorAll('.nav-links a').forEach(link => {
link.addEventListener('click', () => {
navLinks.classList.remove('active');
hamburger.classList.remove('active');
});
});
// Page navigation
document.querySelectorAll('.nav-links a[href^="#"]').forEach(link => {
link.addEventListener('click', function(e) {
e.preventDefault();
    const targetPage = this.getAttribute('href').replace('#', '');
    window.location.hash = targetPage;
    activatePage(targetPage);
});
});
window.addEventListener('popstate', () => activatePage(getPageFromHash()));
window.addEventListener('hashchange', () => activatePage(getPageFromHash()));
// Navbar background change on scroll
window.addEventListener('scroll', () => {
const navbar = document.getElementById('navbar');
if (window.scrollY > 100) {
navbar.style.background = 'rgba(255, 255, 255, 0.98)';
navbar.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
} else {
navbar.style.background = 'rgba(255, 255, 255, 0.95)';
navbar.style.boxShadow = 'none';
}
});
// Animation on scroll
function animateOnScroll() {
const elements = document.querySelectorAll('.research-list li, .talk-item, .timeline-item, .achievement-item');
elements.forEach(element => {
    const elementPosition = element.getBoundingClientRect().top;
    const screenPosition = window.innerHeight / 1.3;
    
    if (elementPosition < screenPosition) {
        element.style.opacity = 1;
        element.style.transform = 'translateY(0)';
    }
});
}
// Initialize elements for animation
document.querySelectorAll('.research-list li, .talk-item, .timeline-item, .achievement-item').forEach(item => {
item.style.opacity = 0;
item.style.transform = 'translateY(20px)';
item.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
});
// Listen for scroll events
window.addEventListener('scroll', animateOnScroll);
// Initial check in case elements are already in view
activatePage(getPageFromHash());
window.addEventListener('load', () => activatePage(getPageFromHash()));
