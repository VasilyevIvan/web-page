// SPA Navigation System
class SPANavigation {
    constructor() {
        this.currentSection = 'hero';
        this.sections = document.querySelectorAll('section');
        this.navLinks = document.querySelectorAll('.nav-link');
        this.contentContainer = document.getElementById('content-container');
        this.init();
    }

    init() {
        // Set hero as active initially
        this.showSection('hero');
        
        // Add click event listeners to navigation links
        this.navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetSection = link.getAttribute('href').substring(1);
                this.navigateTo(targetSection);
            });
        });

        // Mobile navigation toggle
        this.initMobileNavigation();
    }

    navigateTo(sectionId) {
        if (sectionId === this.currentSection) return;

        // Handle CV link separately (opens in new tab)
        if (sectionId === 'documents/CV_Ivan_vasilev.pdf') {
            window.open(link.getAttribute('href'), '_blank');
            return;
        }

        const previousSection = this.currentSection;
        this.currentSection = sectionId;

        // Update active nav link
        this.updateActiveNavLink(sectionId);

        // Hide current section and show new one
        this.hideSection(previousSection);
        this.showSection(sectionId);
    }

    showSection(sectionId) {
        const section = document.getElementById(sectionId);
        if (section) {
            section.classList.add('active');
            // Scroll to top of the section content
            section.scrollTop = 0;
        }
    }

    hideSection(sectionId) {
        const section = document.getElementById(sectionId);
        if (section) {
            section.classList.remove('active');
            section.classList.add('previous');
            
            // Remove previous class after transition
            setTimeout(() => {
                section.classList.remove('previous');
            }, 600);
        }
    }

    updateActiveNavLink(sectionId) {
        this.navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${sectionId}`) {
                link.classList.add('active');
            }
        });
    }

    initMobileNavigation() {
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
    }
}

// Initialize the SPA navigation when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new SPANavigation();
});

// Navbar background change on scroll (for section content scrolling)
window.addEventListener('scroll', () => {
    const navbar = document.getElementById('navbar');
    const activeSection = document.querySelector('section.active');
    
    if (activeSection && activeSection.scrollTop > 50) {
        navbar.style.background = 'rgba(255, 255, 255, 0.98)';
        navbar.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
    } else {
        navbar.style.background = 'rgba(255, 255, 255, 0.95)';
        navbar.style.boxShadow = 'none';
    }
});

// Animation on scroll for section content
function animateOnScroll() {
    const activeSection = document.querySelector('section.active');
    if (!activeSection) return;

    const elements = activeSection.querySelectorAll('.research-list li, .achievement-card');
    
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
document.querySelectorAll('.research-list li, .achievement-card').forEach(item => {
    item.style.opacity = 0;
    item.style.transform = 'translateY(20px)';
    item.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
});

// Listen for scroll events on active section
document.addEventListener('scroll', animateOnScroll, true);

// Initial check in case elements are already in view
window.addEventListener('load', animateOnScroll);
