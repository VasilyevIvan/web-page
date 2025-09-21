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

// Scroll to top when clicking on logo
// Note: You don't have a logo or element with class 'scroll-top' in your HTML.
// If you add one, this code will work. For now, it might not do anything.
/*
document.querySelector('.scroll-top').addEventListener('click', function(e) {
    e.preventDefault();
    document.body.classList.add('no-scroll');
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
});
*/

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
    
    // The no-scroll class was used to prevent scrolling for a smooth logo scroll,
    // which is not currently implemented. Keeping this for consistency or future use.
    if (window.scrollY > 50) {
        document.body.classList.remove('no-scroll');
    } else {
        // If there's a specific "logo" or "scroll-top" behavior that needs no-scroll,
        // this might be relevant. Otherwise, consider removing the no-scroll logic.
        // document.body.classList.add('no-scroll');
    }
});

// Prevent scrolling with mouse wheel on hero section
// This prevents scrolling specifically when the 'no-scroll' class is active,
// which is currently not extensively used.
/*
document.getElementById('hero').addEventListener('wheel', function(e) {
    if (document.body.classList.contains('no-scroll')) {
        e.preventDefault();
    }
});

// Prevent scrolling with touch events on hero section
document.getElementById('hero').addEventListener('touchmove', function(e) {
    if (document.body.classList.contains('no-scroll')) {
        e.preventDefault();
    }
}, { passive: false });
*/

// Animation on scroll for other sections
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


// --- NEW JAVASCRIPT FOR FLOATING IMAGES ---

const floatingImages = document.querySelectorAll('.floating-image');
const heroText = document.querySelector('.hero-text');
const navbar = document.getElementById('navbar');

// Constants for image sizing and collision buffer
const IMAGE_WIDTH = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--floating-img-width'));
const IMAGE_HEIGHT = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--floating-img-height'));
const NAV_BAR_HEIGHT = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--navbar-height'));
const TEXT_BUFFER = 40; // Additional buffer around hero text, matching the `padding` in CSS.

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Check for collision between two rectangles (x, y, width, height)
function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

function positionFloatingImages() {
    const heroRect = document.getElementById('hero').getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Get the bounding box of the hero text, adjusted for the padding as a buffer
    const heroTextRect = heroText.getBoundingClientRect();
    const bufferedTextRect = {
        x: heroTextRect.x - TEXT_BUFFER,
        y: heroTextRect.y - TEXT_BUFFER,
        width: heroTextRect.width + (TEXT_BUFFER * 2),
        height: heroTextRect.height + (TEXT_BUFFER * 2),
    };

    const placedRects = [];

    floatingImages.forEach(imageDiv => {
        let placed = false;
        let attempts = 0;
        const maxAttempts = 200; // Prevent infinite loops

        while (!placed && attempts < maxAttempts) {
            // Generate random position relative to the
