// Mobile navigation toggle
const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');
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
// Enable scrolling when navigating to sections
document.querySelectorAll('.nav-links a[href^="#"]').forEach(link => {
link.addEventListener('click', function(e) {
e.preventDefault();
    const targetId = this.getAttribute('href');
    if (targetId === '#') return;
    
    // Enable scrolling
    document.body.classList.remove('no-scroll');
    
    const targetElement = document.querySelector(targetId);
    if (targetElement) {
        window.scrollTo({
            top: targetElement.offsetTop - 80,
            behavior: 'smooth'
        });
    }
});
    });
// Scroll to top when clicking on logo (assuming you'll add a .scroll-top element for this)
// Currently, there's no element with class 'scroll-top' in your HTML.
// If you intend to use this, you'll need to add an element like:
// <a href="#" class="scroll-top">Your Logo/Name</a>
document.addEventListener('DOMContentLoaded', () => {
const scrollTopLink = document.querySelector('.scroll-top');
if (scrollTopLink) {
scrollTopLink.addEventListener('click', function(e) {
e.preventDefault();
document.body.classList.add('no-scroll');
window.scrollTo({
top: 0,
behavior: 'smooth'
});
});
}
});
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
// Enable scrolling if user manually scrolls
// Note: The 'no-scroll' class is intended to prevent scrolling initially or in specific cases.
// This logic might conflict with enabling scrolling via navigation links.
// You might want to refine when 'no-scroll' is applied/removed.
if (window.scrollY > 50) {
    document.body.classList.remove('no-scroll');
} else if (!navLinks.classList.contains('active')) { // Keep no-scroll if at top and menu not active
     // document.body.classList.add('no-scroll'); // This line was commented out in original logic, review if needed
}
});
// Prevent scrolling with mouse wheel on hero section
document.getElementById('hero').addEventListener('wheel', function(e) {
if (document.body.classList.contains('no-scroll')) {
e.preventDefault();
}
}, { passive: false }); // Added passive: false to allow preventDefault
// Prevent scrolling with touch events on hero section
document.getElementById('hero').addEventListener('touchmove', function(e) {
if (document.body.classList.contains('no-scroll')) {
e.preventDefault();
}
}, { passive: false }); // Added passive: false to allow preventDefault
// Animation on scroll
function animateOnScroll() {
const elements = document.querySelectorAll('.research-list li, .talk-item, .teaching-item, .achievement-item');
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
document.querySelectorAll('.research-list li, .talk-item, .teaching-item, .achievement-item').forEach(item => {
item.style.opacity = 0;
item.style.transform = 'translateY(20px)';
item.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
});
// Listen for scroll events
window.addEventListener('scroll', animateOnScroll);
// Initial check in case elements are already in view
window.addEventListener('load', animateOnScroll);
