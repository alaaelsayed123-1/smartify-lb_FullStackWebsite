import React, { useState } from "react"; // Import React and useState hook for state management
import { FaHeart, FaShoppingCart, FaTag, FaStar, FaStarHalfAlt, FaEye } from "react-icons/fa"; // Import icons from react-icons library
import "../styles/styles.css"; // Import custom CSS styles

function ProductCard({ product, addToCart, addToFavorites, onClick }) {
  // State to track if the card is being hovered over
  const [isHovered, setIsHovered] = useState(false);
  // State to show "Added!" feedback when item is added to cart
  const [addedToCart, setAddedToCart] = useState(false);
  // State to show "Added!" feedback when item is added to favorites
  const [addedToFav, setAddedToFav] = useState(false);
  
  // Check if the product is on sale (handles both 1 and true values)
  const isOnSale = product.sale === 1 || product.sale === true;
  // Calculate sale price with 20% discount if item is on sale
  const salePrice = isOnSale ? (product.price * 0.8).toFixed(2) : null;
  
  // Generate random rating (4-5 stars for demo purposes)
  const rating = 4 + Math.random();
  // Calculate number of full stars to display
  const fullStars = Math.floor(rating);
  // Determine if a half star should be shown
  const hasHalfStar = rating % 1 >= 0.5;

  // Handle adding item to cart - stops event propagation to prevent card click
  const handleAddToCart = (e) => {
    e.stopPropagation();
    addToCart(product); // Call parent's addToCart function
    setAddedToCart(true); // Show "Added!" feedback
    setTimeout(() => setAddedToCart(false), 1500); // Reset feedback after 1.5 seconds
  };

  // Handle adding item to favorites - stops event propagation to prevent card click
  const handleAddToFavorites = (e) => {
    e.stopPropagation();
    addToFavorites(product); // Call parent's addToFavorites function
    setAddedToFav(true); // Show "Added!" feedback
    setTimeout(() => setAddedToFav(false), 1500); // Reset feedback after 1.5 seconds
  };

  // Get image URL - images 
  const getImageUrl = () => {
    // Check if product has a valid image
    if (product.image && product.image !== "" && product.image !== "null" && product.image !== "undefined") {
      // If image path starts with 'images/', prepend with slash for public folder access
      if (product.image.startsWith('images/')) {
        return `/${product.image}`;
      }
      // If image is an external URL, use it as is
      if (product.image.startsWith('http')) {
        return product.image;
      }
      // Otherwise, treat it as a relative path and prepend with slash
      return `/${product.image}`;
    }
    // Fallback to a random placeholder image if no valid image exists
    return `https://picsum.photos/350/300?random=${product.id}`;
  };

  return (
    <div
      // Main card container with gradient background, rounded corners, and hover effects
      className="group relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 transform hover:-translate-y-2 hover:shadow-2xl shadow-lg"
      onClick={onClick} // Trigger parent's onClick handler when card is clicked
      onMouseEnter={() => setIsHovered(true)} // Set hover state to true on mouse enter
      onMouseLeave={() => setIsHovered(false)} // Set hover state to false on mouse leave
    >
      {/* Sale Badge - only displayed when product is on sale */}
      {isOnSale && (
        <div className="absolute top-3 right-3 z-20 animate-pulse-slow">
          <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-lg">
            <FaTag size={10} /> {/* Tag icon */}
            -20% OFF {/* Discount percentage text */}
          </div>
        </div>
      )}

      {/* Quick View Overlay - appears on hover with glass morphism effect */}
      <div className={`absolute inset-0 bg-black/60 backdrop-blur-sm z-10 flex items-center justify-center transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="bg-white/20 rounded-full p-3 transform transition-transform duration-300 hover:scale-110">
          <FaEye className="text-white text-2xl" /> {/* Eye icon for quick view */}
        </div>
      </div>

      {/* Image Container */}
      <div className="relative overflow-hidden bg-gradient-to-br from-gray-700 to-gray-800">
        <img
          src={getImageUrl()} // Get the appropriate image URL
          alt={product.name} // Alt text from product name
          className={`w-full h-56 object-cover transition-all duration-500 ${isHovered ? 'scale-110 blur-sm' : 'scale-100'}`} // Scale up and blur on hover
          style={{ 
            filter: isOnSale ? "brightness(0.95)" : "none", // Slightly dim image if on sale
          }}
          onError={(e) => {
            // Fallback to random placeholder image if image fails to load
            e.target.src = `https://picsum.photos/350/300?random=${product.id}`;
          }}
        />
        
        {/* Stock Badge - shows when quantity is low but not zero */}
        {product.quantity <= 10 && product.quantity > 0 && (
          <div className="absolute bottom-3 left-3 bg-orange-500/90 backdrop-blur-sm text-white px-2 py-1 rounded-lg text-xs font-semibold">
            ⚡ Only {product.quantity} left {/* Warning emoji and stock count */}
          </div>
        )}
        {/* Out of Stock Overlay - covers the image when quantity is zero */}
        {product.quantity === 0 && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
            <span className="text-white font-bold text-lg px-4 py-2 bg-red-500/80 rounded-full">Out of Stock</span>
          </div>
        )}
      </div>

      {/* Content section with product details */}
      <div className="p-4 space-y-3">
        {/* Title - truncates to one line with ellipsis */}
        <h3 className="text-white font-bold text-lg line-clamp-1 group-hover:text-purple-400 transition-colors">
          {product.name}
        </h3>

        {/* Rating display with stars */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-0.5">
            {/* Render full stars */}
            {[...Array(fullStars)].map((_, i) => (
              <FaStar key={i} className="text-yellow-400 text-sm" />
            ))}
            {/* Render half star if applicable */}
            {hasHalfStar && <FaStarHalfAlt className="text-yellow-400 text-sm" />}
            {/* Render empty stars to fill up to 5 */}
            {[...Array(5 - Math.ceil(rating))].map((_, i) => (
              <FaStar key={i} className="text-gray-600 text-sm" />
            ))}
          </div>
          {/* Display review count based on rating */}
          <span className="text-gray-400 text-xs">({(rating * 20).toFixed(0)}+ reviews)</span>
        </div>

        {/* Price section - shows different layout based on sale status */}
        <div className="space-y-1">
          {isOnSale && salePrice ? (
            // Sale price layout: shows original price with strikethrough, discounted price, and savings
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-gray-400 text-sm line-through">
                ${parseFloat(product.price).toFixed(2)} {/* Original price with strikethrough */}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-green-400 font-bold text-xl">
                  ${salePrice} {/* Discounted price */}
                </span>
                <span className="bg-green-500/20 text-green-400 text-xs px-2 py-0.5 rounded-full font-semibold">
                  Save ${(parseFloat(product.price) - parseFloat(salePrice)).toFixed(2)} {/* Amount saved */}
                </span>
              </div>
            </div>
          ) : (
            // Regular price layout
            <div className="text-green-400 font-bold text-xl">
              ${parseFloat(product.price).toFixed(2)}
            </div>
          )}
        </div>

        {/* Stock Status indicator with colored dot and text */}
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${
            // Green dot with pulse animation for in stock (>10)
            product.quantity > 10 ? 'bg-green-500 animate-pulse' : 
            // Orange dot for low stock (1-10)
            product.quantity > 0 ? 'bg-orange-500' : 
            // Red dot for out of stock (0)
            'bg-red-500'
          }`}></div>
          <span className={`text-xs font-medium ${
            // Color-coded text matching the dot color
            product.quantity > 10 ? 'te xt-green-400' : 
            product.quantity > 0 ? 'text-orange-400' : 'text-red-400'
          }`}>
            {/* Display appropriate stock status message */}
            {product.quantity > 10
              ? "In Stock"
              : product.quantity > 0
              ? `Low Stock (${product.quantity} left)`
              : "Out of Stock"}
          </span>
        </div>

        {/* Action Buttons - Add to Cart and Add to Favorites */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={handleAddToCart} // Call cart handler on click
            disabled={product.quantity <= 0} // Disable button if out of stock
            className={`flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 flex items-center justify-center gap-2 ${
              // Different styles based on button state
              product.quantity <= 0 
                ? "bg-gray-700 text-gray-400 cursor-not-allowed" // Disabled state
                : addedToCart
                  ? "bg-green-600 text-white" // Success state after adding to cart
                  : "bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 hover:shadow-lg hover:shadow-green-500/25 transform hover:scale-105" // Default state with hover effects
            }`}
          >
            <FaShoppingCart size={14} /> {/* Shopping cart icon */}
            {/* Button text changes based on state */}
            {addedToCart ? "Added!" : (product.quantity <= 0 ? "Out of Stock" : "Add to Cart")}
          </button>

          <button
            onClick={handleAddToFavorites} // Call favorites handler on click
            className={`flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 flex items-center justify-center gap-2 ${
              // Different styles based on favorites state
              addedToFav
                ? "bg-pink-600 text-white" // Success state after adding to favorites
                : "bg-gradient-to-r from-pink-600 to-rose-600 text-white hover:from-pink-700 hover:to-rose-700 hover:shadow-lg hover:shadow-pink-500/25 transform hover:scale-105" // Default state with hover effects
            }`}
          >
            <FaHeart size={14} /> {/* Heart icon */}
            {/* Button text changes when added to favorites */}
            {addedToFav ? "Added!" : "Favorite"}
          </button>
        </div>
      </div>

      {/* Custom CSS for animations - injected via styled-jsx */}
      <style jsx>{`
        @keyframes pulse-slow {
          0%, 100% {
            transform: scale(1); /* Normal size at start and end */
          }
          50% {
            transform: scale(1.05); /* Slightly larger at middle of animation */
          }
        }
        .animate-pulse-slow {
          animation: pulse-slow 2s ease-in-out infinite; /* Apply slow pulse animation */
        }
        .line-clamp-1 {
          display: -webkit-box; /* Required for line clamping */
          -webkit-line-clamp: 1; /* Limit to 1 line */
          -webkit-box-orient: vertical; /* Set box orientation */
          overflow: hidden; /* Hide overflowing text */
        }
      `}</style>
    </div>
  );
}

export default ProductCard; // Export component for use in other files