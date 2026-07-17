// Import React and hooks from the CommonJS module system
const React = require('react');
const { useState, useEffect } = require('react');

/**
 * Carousel Component
 * An auto-rotating image carousel with manual navigation controls
 * 
 * @param {Object} props - Component props
 * @param {Array} props.items - Array of slide objects, each containing:
 *   - image: URL string for the slide image
 *   - title: Display title for the slide
 *   - subtitle: Descriptive text for the slide
 */
function Carousel(props) {
    // Destructure items from props
    const { items } = props;
    
    // State to track the currently active slide index
    // Initialized to the first slide (index 0)
    const [current, setCurrent] = useState(0);

    // Effect hook for auto-advancing the carousel
    useEffect(() => {
        // Set up an interval that advances to the next slide every 4 seconds
        const interval = setInterval(() => {
            // Use functional update to access the latest state value
            // Modulo operation ensures we wrap around to the first slide after the last
            setCurrent((prev) => (prev + 1) % items.length);
        }, 4000); // 4000ms = 4 seconds between slides
        
        // Cleanup function: Clear the interval when component unmounts
        // or when items.length changes (prevents memory leaks)
        return () => clearInterval(interval);
    }, [items.length]); // Re-run effect if the number of items changes

    /**
     * Advance to the next slide
     * Uses modulo to create circular navigation (last slide → first slide)
     */
    const nextSlide = () => setCurrent((current + 1) % items.length);
    
    /**
     * Go back to the previous slide
     * Adding items.length before modulo ensures positive numbers
     * (handles the case when current is 0, going to the last slide)
     */
    const prevSlide = () => setCurrent((current - 1 + items.length) % items.length);

    // Build and return the carousel DOM structure using React.createElement
    // (No JSX - using raw React API for environments without transpilation)
    return React.createElement('div', { 
        // Main container for the entire carousel
        className: 'carousel-container',
        style: {
            height: '500px', // Fixed height container
            position: 'relative', // For absolute positioning of children
            overflow: 'hidden', // Hide slides that extend beyond container
            borderRadius: '15px', // Rounded corners for aesthetics
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)' // Depth effect shadow
        }
    },
        // Map through items to create individual slides
        items.map((item, idx) =>
            React.createElement('div', { 
                key: idx, // Unique key for React's reconciliation
                // Dynamically add 'active' class to the current slide
                className: 'carousel-slide' + (idx === current ? ' active' : ''),
                style: {
                    position: 'absolute', // Stack slides on top of each other
                    width: '100%',
                    height: '500px', // Match container height for full coverage
                    // Only show current slide by controlling opacity
                    opacity: idx === current ? 1 : 0,
                    // Smooth fade transition between slides
                    transition: 'opacity 0.8s ease-in-out'
                }
            },
                // Slide background image
                React.createElement('img', { 
                    src: item.image, // Image URL from item data
                    alt: item.title, // Accessibility: descriptive alt text
                    style: {
                        width: '100%',
                        height: '100%', // Fill the entire slide area
                        objectPosition: 'center' // Center the image within its container
                    }
                }),
                // Text overlay on the slide
                React.createElement('div', { 
                    className: 'carousel-text',
                    style: {
                        position: 'absolute', // Position over the image
                        bottom: '40px', // Offset from bottom
                        left: '50px', // Offset from left
                        color: 'white', // White text for contrast
                        textShadow: '2px 2px 8px rgba(0,0,0,0.7)', // Shadow for readability over images
                        maxWidth: '600px' // Prevent text from being too wide
                    }
                },
                    // Slide title
                    React.createElement('h2', { 
                        style: {
                            fontSize: '2.5rem', // Large, prominent title
                            marginBottom: '10px', // Space between title and subtitle
                            fontWeight: '700' // Bold text
                        }
                    }, item.title),
                    // Slide subtitle/description
                    React.createElement('p', { 
                        style: {
                            fontSize: '1.2rem', // Smaller than title but still readable
                            opacity: '0.9' // Slightly transparent for visual hierarchy
                        }
                    }, item.subtitle)
                )
            )
        ),
        // Previous button - navigates to the previous slide
        React.createElement('button', { 
            className: 'prev', // CSS class for styling or external targeting
            onClick: prevSlide, // Click handler to go to previous slide
            style: {
                position: 'absolute', // Positioned over the carousel
                top: '50%', // Vertically centered
                left: '20px', // Offset from left edge
                transform: 'translateY(-50%)', // Perfect vertical centering
                background: 'rgba(0,0,0,0.5)', // Semi-transparent dark background
                color: 'white', // White arrow icon
                border: 'none', // Remove default button border
                padding: '15px', // Comfortable touch target
                cursor: 'pointer', // Hand cursor on hover
                fontSize: '24px', // Large arrow character
                borderRadius: '50%', // Circular button
                width: '50px', // Fixed width for circle shape
                height: '50px', // Fixed height for circle shape
                display: 'flex', // Flexbox for centering arrow
                alignItems: 'center', // Vertical centering of content
                justifyContent: 'center', // Horizontal centering of content
                zIndex: '10' // Ensure button appears above slides
            }
        }, '❮'), // Left-pointing arrow character
        // Next button - navigates to the next slide
        React.createElement('button', { 
            className: 'next', // CSS class for external styling
            onClick: nextSlide, // Click handler to go to next slide
            style: {
                position: 'absolute', // Positioned over the carousel
                top: '50%', // Vertically centered
                right: '20px', // Offset from right edge (mirror of prev button)
                transform: 'translateY(-50%)', // Perfect vertical centering
                background: 'rgba(0,0,0,0.5)', // Semi-transparent dark background
                color: 'white', // White arrow icon
                border: 'none', // Remove default button border
                padding: '15px', // Comfortable touch target
                cursor: 'pointer', // Hand cursor on hover
                fontSize: '24px', // Large arrow character
                borderRadius: '50%', // Circular button
                width: '50px', // Fixed width for circle shape
                height: '50px', // Fixed height for circle shape
                display: 'flex', // Flexbox for centering arrow
                alignItems: 'center', // Vertical centering of content
                justifyContent: 'center', // Horizontal centering of content
                zIndex: '10' // Ensure button appears above slides
            }
        }, '❯') // Right-pointing arrow character
    );
}

// Export the Carousel component for use in other files
module.exports = Carousel;