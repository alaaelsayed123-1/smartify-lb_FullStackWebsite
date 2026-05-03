const React = require('react');
const { useState, useEffect } = require('react');

function Carousel(props) {
    const { items } = props;
    const [current, setCurrent] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrent((prev) => (prev + 1) % items.length);
        }, 4000);
        return () => clearInterval(interval);
    }, [items.length]);

    const nextSlide = () => setCurrent((current + 1) % items.length);
    const prevSlide = () => setCurrent((current - 1 + items.length) % items.length);

    return React.createElement('div', { 
        className: 'carousel-container',
        style: {
            height: '500px', // Increased height
            position: 'relative',
            overflow: 'hidden',
            borderRadius: '15px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
        }
    },
        items.map((item, idx) =>
            React.createElement('div', { 
                key: idx, 
                className: 'carousel-slide' + (idx === current ? ' active' : ''),
                style: {
                    position: 'absolute',
                    width: '100%',
                    height: '500px', // Match container height
                    opacity: idx === current ? 1 : 0,
                    transition: 'opacity 0.8s ease-in-out'
                }
            },
                React.createElement('img', { 
                    src: item.image, 
                    alt: item.title,
                    style: {
                        width: '100%',
                        height: '100%', // Fill the slide
                        objectPosition: 'center'
                    }
                }),
                React.createElement('div', { 
                    className: 'carousel-text',
                    style: {
                        position: 'absolute',
                        bottom: '40px',
                        left: '50px',
                        color: 'white',
                        textShadow: '2px 2px 8px rgba(0,0,0,0.7)',
                        maxWidth: '600px'
                    }
                },
                    React.createElement('h2', { 
                        style: {
                            fontSize: '2.5rem',
                            marginBottom: '10px',
                            fontWeight: '700'
                        }
                    }, item.title),
                    React.createElement('p', { 
                        style: {
                            fontSize: '1.2rem',
                            opacity: '0.9'
                        }
                    }, item.subtitle)
                )
            )
        ),
        React.createElement('button', { 
            className: 'prev', 
            onClick: prevSlide,
            style: {
                position: 'absolute',
                top: '50%',
                left: '20px',
                transform: 'translateY(-50%)',
                background: 'rgba(0,0,0,0.5)',
                color: 'white',
                border: 'none',
                padding: '15px',
                cursor: 'pointer',
                fontSize: '24px',
                borderRadius: '50%',
                width: '50px',
                height: '50px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: '10'
            }
        }, '❮'),
        React.createElement('button', { 
            className: 'next', 
            onClick: nextSlide,
            style: {
                position: 'absolute',
                top: '50%',
                right: '20px',
                transform: 'translateY(-50%)',
                background: 'rgba(0,0,0,0.5)',
                color: 'white',
                border: 'none',
                padding: '15px',
                cursor: 'pointer',
                fontSize: '24px',
                borderRadius: '50%',
                width: '50px',
                height: '50px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: '10'
            }
        }, '❯')
    );
}

module.exports = Carousel;