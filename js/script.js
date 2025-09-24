// Mobile navigation toggle
const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');
const mainContent = document.querySelector('main');
const sections = document.querySelectorAll('section');
const navbarHeight = document.getElementById('navbar').offsetHeight;

hamburger.addEventListener('click', () => {
    navLinks.classList.toggle('active');
    hamburger.classList.toggle('active');
});

// Function to show a specific section
function showSection(targetId) {
    // Hide all sections first
    sections.forEach(section => {
        section.classList.remove('active');
    });

    // Show the target section
    const targetElement = document.querySelector(targetId);
    if (targetElement) {
        targetElement.classList.add('active');
        // Adjust padding-top for the visible section to account for fixed navbar
        targetElement.style.paddingTop = `${navbarHeight + 40}px`; // Add some extra space
    }
}

// Initial display: show #hero section on load
document.addEventListener('DOMContentLoaded', () => {
    showSection('#hero');

    // Close mobile menu when clicking on a link
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();

            const targetId = this.getAttribute('href');
            if (targetId === '#') return; // Ignore if href is just '#'

            if (targetId.startsWith('#')) {
                // This is an internal link, use SPA logic
                showSection(targetId);
            } else {
                // This is an external link (like CV), allow default behavior
                window.open(targetId, '_blank');
            }

            navLinks.classList.remove('active');
            hamburger.classList.remove('active');
        });
    });
});

// Remove scroll event listener and related functions
// The site is now a single-page application, so scrolling logic is no longer needed.
// This means:
// - `animateOnScroll` function is removed.
// - `window.addEventListener('scroll', ...)` is removed.
// - `window.addEventListener('load', animateOnScroll)` is removed.
// - Logic preventing default scroll behavior on hero section is removed.

// Note: The 'no-scroll' class on body is now permanent.
// The `footer` will need to be part of each section or be fixed at the bottom of the viewport
// and adjusted for each section's content. For this solution, I've made the footer
// absolutely positioned at the bottom of the viewport.
