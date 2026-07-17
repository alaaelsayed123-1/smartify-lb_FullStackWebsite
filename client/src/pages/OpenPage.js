// Import React and necessary hooks from React library
import React, { useState, useEffect } from "react";
// Import navigation hook for programmatic routing
import { useNavigate } from "react-router-dom";
// Import icon components from react-icons library for visual elements
import { FaArrowRight, FaGem, FaCrown, FaStar, FaShoppingBag, FaRocket } from "react-icons/fa";

// OpenPage component - The landing/splash page of the Smartify Store application
const OpenPage = () => {
  // Initialize navigation hook for redirecting to home page
  const navigate = useNavigate();
  
  // State to track whether the CTA button is being hovered over
  const [isHovered, setIsHovered] = useState(false);
  
  // State to track mouse position for dynamic cursor glow effect
  // x and y represent percentage positions within the viewport
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  
  // State to store particle objects for the floating particles animation
  const [particles, setParticles] = useState([]);

  // Create particles effect - runs once on component mount
  useEffect(() => {
    // Generate array of 50 particle objects with random properties
    const particleArray = [];
    for (let i = 0; i < 50; i++) {
      particleArray.push({
        id: i,                                    // Unique identifier for React key
        x: Math.random() * 100,                   // Random starting X position (0-100%)
        y: Math.random() * 100,                   // Random starting Y position (0-100%)
        size: Math.random() * 3 + 1,              // Random particle size (1-4px)
        speedX: (Math.random() - 0.5) * 0.5,      // Random horizontal movement speed
        speedY: (Math.random() - 0.5) * 0.5,      // Random vertical movement speed
        opacity: Math.random() * 0.5 + 0.2,       // Random opacity (0.2-0.7)
      });
    }
    // Set initial particle positions
    setParticles(particleArray);

    // Set up animation interval - updates particle positions every 50ms
    const interval = setInterval(() => {
      setParticles(prev => prev.map(particle => ({
        ...particle,
        // Update x and y positions based on speed
        x: particle.x + particle.speedX,
        y: particle.y + particle.speedY,
        // Wrap particles around screen edges for continuous animation
        ...(particle.x > 100 && { x: 0 }),        // Reset to left if exceeding right edge
        ...(particle.x < 0 && { x: 100 }),        // Reset to right if exceeding left edge
        ...(particle.y > 100 && { y: 0 }),        // Reset to top if exceeding bottom edge
        ...(particle.y < 0 && { y: 100 }),        // Reset to bottom if exceeding top edge
      })));
    }, 50);

    // Cleanup function to clear interval when component unmounts
    return () => clearInterval(interval);
  }, []); // Empty dependency array ensures this runs only once

  // Handle mouse movement to update cursor position for glow effect
  const handleMouseMove = (e) => {
    // Get bounding rectangle of the target element for accurate positioning
    const rect = e.currentTarget.getBoundingClientRect();
    // Calculate mouse position as percentage of element dimensions
    setMousePosition({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  };

  return (
    <div 
      className="relative min-h-screen overflow-hidden"
      onMouseMove={handleMouseMove}  // Attach mouse move handler to track cursor
    >
      {/* Animated Gradient Background - Creates shifting purple/dark gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-purple-900 to-black animate-gradient"></div>
      
      {/* Animated Grid Pattern - Adds subtle geometric overlay */}
      <div className="absolute inset-0 bg-grid-pattern opacity-20"></div>
      
      {/* Floating Particles - Render each particle as a small white dot */}
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute rounded-full bg-white"
          style={{
            left: `${particle.x}%`,          // Position from left
            top: `${particle.y}%`,           // Position from top
            width: `${particle.size}px`,     // Dynamic size
            height: `${particle.size}px`,    // Dynamic size
            opacity: particle.opacity,       // Dynamic opacity
            transform: `translate(-50%, -50%)`,  // Center the particle on its position
            transition: 'all 0.05s linear',      // Smooth movement animation
          }}
        />
      ))}

      {/* Animated Orbs - Decorative background elements for depth */}
      {/* Purple orb - top left */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float"></div>
      {/* Pink orb - bottom right */}
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-pink-600 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float-delayed"></div>
      {/* Blue orb - center, larger */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse-slow"></div>

      {/* Dynamic Cursor Glow - Follows mouse position for interactive lighting effect */}
      <div 
        className="absolute w-96 h-96 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 filter blur-3xl opacity-20 transition-all duration-300 pointer-events-none"
        style={{
          left: `${mousePosition.x}%`,
          top: `${mousePosition.y}%`,
          transform: 'translate(-50%, -50%)',  // Center the glow on cursor
        }}
      />

      {/* Main Content Container */}
      <div className="relative min-h-screen flex flex-col items-center justify-center px-4">
        
        {/* Animated Badge - Displays premium status indicator */}
        <div className="mb-8 animate-fade-in-down">
          <div className="inline-flex items-center gap-3 px-5 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 shadow-xl">
            <FaCrown className="text-yellow-400 text-sm animate-pulse" />  {/* Crown icon with pulse animation */}
            <span className="text-white text-sm font-semibold tracking-wide">Premium Experience</span>
            <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-ping"></div>  {/* Live indicator dot */}
          </div>
        </div>

        {/* Main Title with 3D Effect - Company name display */}
        <div className="text-center mb-6 animate-fade-in-up">
          <h1 className="text-6xl md:text-8xl font-extrabold mb-4 relative">
            {/* Background blur effect for 3D depth */}
            <span className="absolute inset-0 bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent blur-2xl opacity-50">
              Smartify Store
            </span>
            {/* Foreground text with gradient and shimmer animation */}
            <span className="relative bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent animate-shimmer">
              Smartify Store
            </span>
          </h1>
          
          {/* Decorative Line - Visual separator below title */}
          <div className="flex justify-center gap-2 mb-4">
            <div className="w-12 h-1 bg-gradient-to-r from-purple-500 to-transparent rounded-full"></div>
            <div className="w-3 h-1 bg-pink-500 rounded-full"></div>
            <div className="w-12 h-1 bg-gradient-to-l from-orange-500 to-transparent rounded-full"></div>
          </div>

          {/* Subtitle - Describes the application's value proposition */}
          <p className="text-gray-300 text-lg md:text-xl max-w-2xl mx-auto animate-fade-in-up animation-delay-200">
            Experience the future of online shopping with AI-powered recommendations,
            premium quality products, and lightning-fast delivery.
          </p>
        </div>

        {/* Stats Section - Displays key business metrics */}
        <div className="flex flex-wrap justify-center gap-8 mb-12 animate-fade-in-up animation-delay-400">
          {/* Happy Customers stat */}
          <div className="text-center">
            <div className="text-3xl font-bold text-white">10K+</div>
            <div className="text-gray-400 text-sm">Happy Customers</div>
          </div>
          <div className="w-px h-12 bg-white/20"></div>  {/* Vertical separator */}
          
          {/* Premium Products stat */}
          <div className="text-center">
            <div className="text-3xl font-bold text-white">500+</div>
            <div className="text-gray-400 text-sm">Premium Products</div>
          </div>
          <div className="w-px h-12 bg-white/20"></div>  {/* Vertical separator */}
          
          {/* Customer Support stat */}
          <div className="text-center">
            <div className="text-3xl font-bold text-white">24/7</div>
            <div className="text-gray-400 text-sm">Customer Support</div>
          </div>
        </div>

        {/* Floating Icons - Decorative elements positioned around the page */}
        {/* Gem icon - top left area */}
        <div className="absolute top-1/4 left-[5%] animate-float-slow">
          <FaGem className="text-purple-400 text-4xl opacity-40" />
        </div>
        {/* Star icon - bottom right area */}
        <div className="absolute bottom-1/4 right-[5%] animate-float-delayed">
          <FaStar className="text-yellow-400 text-3xl opacity-40" />
        </div>
        {/* Shopping bag icon - lower left area */}
        <div className="absolute top-2/3 left-[10%] animate-float">
          <FaShoppingBag className="text-pink-400 text-2xl opacity-30" />
        </div>
        {/* Rocket icon - upper right area */}
        <div className="absolute top-1/3 right-[8%] animate-float-delayed">
          <FaRocket className="text-blue-400 text-3xl opacity-30" />
        </div>

        {/* Main CTA Button Section */}
        <div className="relative animate-fade-in-up animation-delay-600">
          {/* Glow effect behind button - intensifies on hover */}
          <div className={`absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl blur-xl transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-50'}`}></div>
          
          {/* Main Enter Button */}
          <button
            onClick={() => navigate("/home")}  // Navigate to home page on click
            className="group relative px-10 py-5 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 rounded-2xl font-bold text-white text-lg md:text-xl shadow-2xl transition-all duration-500 overflow-hidden"
            onMouseEnter={() => setIsHovered(true)}   // Set hover state on mouse enter
            onMouseLeave={() => setIsHovered(false)}  // Reset hover state on mouse leave
            style={{
              // Lift and scale button on hover
              transform: isHovered ? 'translateY(-5px) scale(1.02)' : 'translateY(0) scale(1)',
            }}
          >
            {/* Animated Border - White sheen that sweeps across on hover */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
            
            {/* Button Content - Text and icon */}
            <div className="relative flex items-center gap-3">
              <span className="font-semibold tracking-wide">Enter Smartify Store</span>
              <FaArrowRight className={`transition-all duration-300 ${isHovered ? 'translate-x-1' : 'translate-x-0'}`} />  {/* Arrow slides right on hover */}
            </div>

            {/* Sparkle Effects - Show decorative elements on hover */}
            {isHovered && (
              <>
                {/* Sparkle overlay */}
                <div className="absolute top-0 left-0 w-full h-full bg-white opacity-20 animate-sparkle"></div>
                {/* Top-left glow burst */}
                <div className="absolute -top-10 -left-10 w-20 h-20 bg-white rounded-full filter blur-xl animate-ping-slow"></div>
                {/* Bottom-right glow burst with delay */}
                <div className="absolute -bottom-10 -right-10 w-20 h-20 bg-white rounded-full filter blur-xl animate-ping-slow animation-delay-500"></div>
              </>
            )}
          </button>

          {/* Additional CTA Text - Call to action and promotional message */}
          <p className="text-center text-gray-400 text-sm mt-6">
            ✨ Join 10,000+ smart shoppers | Free shipping on orders $50+ ✨
          </p>
        </div>
      </div>

      {/* Custom CSS - Defines all custom animations */}
      <style jsx>{`
        /* Gradient animation - Creates flowing background effect */
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        /* Float animation - Gentle up-down-left-right movement */
        @keyframes float {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          50% { transform: translateY(-30px) translateX(20px); }
        }
        
        /* Float-delayed animation - Opposite direction floating effect */
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          50% { transform: translateY(30px) translateX(-20px); }
        }
        
        /* Pulse-slow animation - Subtle scaling and opacity change */
        @keyframes pulse-slow {
          0%, 100% { transform: scale(1); opacity: 0.2; }
          50% { transform: scale(1.1); opacity: 0.3; }
        }
        
        /* Shimmer animation - Light reflection effect on text */
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        
        /* Fade-in-down animation - Element slides down while fading in */
        @keyframes fade-in-down {
          from {
            opacity: 0;
            transform: translateY(-30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        /* Fade-in-up animation - Element slides up while fading in */
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        /* Ping-slow animation - Expanding circle effect */
        @keyframes ping-slow {
          0% { transform: scale(1); opacity: 0.5; }
          100% { transform: scale(3); opacity: 0; }
        }
        
        /* Sparkle animation - Diagonal movement with rotation */
        @keyframes sparkle {
          0% { transform: translateX(-100%) rotate(0deg); }
          100% { transform: translateX(100%) rotate(360deg); }
        }
        
        /* Utility classes for applying animations */
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 8s ease infinite;
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        
        .animate-float-delayed {
          animation: float-delayed 6s ease-in-out infinite;
        }
        
        .animate-float-slow {
          animation: float 8s ease-in-out infinite;
        }
        
        .animate-pulse-slow {
          animation: pulse-slow 4s ease-in-out infinite;
        }
        
        .animate-shimmer {
          background: linear-gradient(110deg, transparent 25%, rgba(255,255,255,0.1) 50%, transparent 75%);
          background-size: 200% 100%;
          animation: shimmer 2s linear infinite;
        }
        
        .animate-fade-in-down {
          animation: fade-in-down 0.8s ease-out forwards;
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out forwards;
          opacity: 0;
        }
        
        .animate-ping-slow {
          animation: ping-slow 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
        
        .animate-sparkle {
          animation: sparkle 0.8s linear;
        }
        
        /* Animation delay utilities for staggered entrance effects */
        .animation-delay-200 {
          animation-delay: 0.2s;
        }
        
        .animation-delay-400 {
          animation-delay: 0.4s;
        }
        
        .animation-delay-500 {
          animation-delay: 0.5s;
        }
        
        .animation-delay-600 {
          animation-delay: 0.6s;
        }
        
        /* Grid pattern background - Creates subtle lined overlay */
        .bg-grid-pattern {
          background-image: 
            linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px);
          background-size: 40px 40px;
        }
      `}</style>
    </div>
  );
};

// Export component for use in other parts of the application
export default OpenPage;