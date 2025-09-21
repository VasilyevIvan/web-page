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
        
        // Remove no-scroll if it was applied (e.g., from an attempted smooth scroll)
        document.body.classList.remove('no-scroll');
        
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
            window.scrollTo({
                top: targetElement.offsetTop - 80, // Offset for fixed navbar
                behavior: 'smooth'
            });
        }
    });
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
});


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

// Initialize elements for animation (for sections below hero)
document.querySelectorAll('.research-list li, .talk-item, .teaching-item, .achievement-item').forEach(item => {
    item.style.opacity = 0;
    item.style.transform = 'translateY(20px)';
    item.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
});

// Listen for scroll events for section animations
window.addEventListener('scroll', animateOnScroll);
// Initial check in case elements are already in view on load
window.addEventListener('load', animateOnScroll);


// --- NEW JAVASCRIPT FOR FLOATING IMAGES ---

const floatingImages = document.querySelectorAll('.floating-image');
const heroText = document.querySelector('.hero-text');
const navbar = document.getElementById('navbar');

// Constants for image sizing and collision buffer
// We fetch these from CSS variables for consistency
let IMAGE_WIDTH;
let IMAGE_HEIGHT;
let NAV_BAR_HEIGHT;
const TEXT_BUFFER = 40; // This buffer needs to match the padding of .hero-text or be slightly larger

// Function to update dimensions from CSS variables (important for resize)
function updateDimensions() {
    IMAGE_WIDTH = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--floating-img-width'));
    IMAGE_HEIGHT = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--floating-img-height'));
    NAV_BAR_HEIGHT = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--navbar-height'));
}

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
    console.log("Attempting to position floating images...");
    updateDimensions(); // Get latest dimensions on each call

    const heroSection = document.getElementById('hero');
    if (!heroSection) {
        console.error("Hero section not found!");
        return;
    }

    const heroRect = heroSection.getBoundingClientRect();
    
    // Calculate available space *within* the hero section for placing images
    // Account for navbar at the top
    const minX = 0;
    const maxX = heroRect.width - IMAGE_WIDTH; // Ensure image stays within hero width
    // Adjusted minY and maxY to properly utilize the space below the navbar within the hero section
    const minY = NAV_BAR_HEIGHT; 
    const maxY = heroRect.height - IMAGE_HEIGHT; 

    // Get the bounding box of the hero text, adjusted for the padding as a buffer
    // These coordinates are relative to the viewport
    const heroTextRect = heroText.getBoundingClientRect();
    const bufferedTextRect = {
        x: heroTextRect.left - TEXT_BUFFER,
        y: heroTextRect.top - TEXT_BUFFER,
        width: heroTextRect.width + (TEXT_BUFFER * 2),
        height: heroTextRect.height + (TEXT_BUFFER * 2),
    };
    console.log("Buffered Text Rect (Viewport relative):", bufferedTextRect);


    const placedRects = []; // Store the bounding boxes of successfully placed images (viewport relative)

    floatingImages.forEach((imageDiv, index) => {
        let placed = false;
        let attempts = 0;
        const maxAttempts = 200; // Prevent infinite loops for unplaceable configurations

        let currentImageRect; // To store the potential new position

        // Hide image initially, will show if successfully placed
        imageDiv.style.opacity = 0; 

        while (!placed && attempts < maxAttempts) {
            attempts++;

            // Generate random position within the hero section, relative to its top-left corner
            // Ensure positions are valid for the scaled image size
            // Math.max(minX, maxX) handles cases where maxX might be negative if viewport is too small for image
            const randomX = getRandomInt(minX, Math.max(minX, maxX)); 
            const randomY = getRandomInt(minY, Math.max(minY, maxY)); 

            currentImageRect = {
                x: randomX + heroRect.left, // Convert to viewport-relative
                y: randomY + heroRect.top,  // Convert to viewport-relative
                width: IMAGE_WIDTH,
                height: IMAGE_HEIGHT
            };

            let overlaps = false;

            // Check collision with Hero Text
            if (checkCollision(currentImageRect, bufferedTextRect)) {
                overlaps = true;
            }

            // Check collision with already placed images
            if (!overlaps) {
                for (const existingRect of placedRects) {
                    if (checkCollision(currentImageRect, existingRect)) {
                        overlaps = true;
                        break;
                    }
                }
            }

            if (!overlaps) {
                // If no overlaps, place the image
                imageDiv.style.left = `${randomX}px`;
                imageDiv.style.top = `${randomY}px`;
                imageDiv.style.transform = `rotate(${getRandomInt(-65, 65)}deg)`;
                imageDiv.style.opacity = 1; // MAKE IT VISIBLE!
                
                placedRects.push(currentImageRect); // Add to placed rectangles
                placed = true;
                console.log(`Image ${index} placed at X:${randomX}, Y:${randomY}`);
            }
        }

        if (!placed) {
            console.warn(`Could not place image ${index} after ${maxAttempts} attempts. It might be overlapping or there's not enough space.`);
            // If an image cannot be placed, it will remain at opacity:0
        }
    });
    console.log("Finished positioning floating images.");
}

// Call the function when the window loads and on resize
window.addEventListener('load', positionFloatingImages);
window.addEventListener('resize', positionFloatingImages); // Reposition on resize
