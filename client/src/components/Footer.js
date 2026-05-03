import React, { useState } from "react";
import { 
  FaFacebookF, FaInstagram, FaTwitter, FaTiktok, 
  FaHeart, FaGem, FaRocket, FaArrowUp, FaCcVisa, 
  FaCcMastercard, FaCcPaypal, FaCcApplePay, FaEnvelope, 
  FaPhone, FaMapMarkerAlt, FaClock, FaShoppingBag, FaTag
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const Footer = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [showScrollTop, setShowScrollTop] = useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email) {
      alert(`Thanks for subscribing with ${email}!`);
      setEmail("");
    }
  };

  const socialLinks = [
    { icon: FaFacebookF, url: "https://www.facebook.com", color: "hover:bg-[#1877f2]" },
    { icon: FaInstagram, url: "https://www.instagram.com", color: "hover:bg-gradient-to-tr from-[#feda77] via-[#d62976] to-[#962fbf]" },
    { icon: FaTwitter, url: "https://www.twitter.com", color: "hover:bg-[#1da1f2]" },
    { icon: FaTiktok, url: "https://www.tiktok.com", color: "hover:bg-[#000000]" },
  ];

  const footerLinks = {
    "Shop": ["All Products", "New Arrivals", "Best Sellers", "On Sale"],
    "Support": ["Help Center", "Returns Policy", "Shipping Info", "Contact Us"],
    "Company": ["About Us", "Careers", "Blog", "Affiliate Program"],
  };

  const paymentIcons = [FaCcVisa, FaCcMastercard, FaCcPaypal, FaCcApplePay];

  return (
    <footer className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white overflow-hidden">
      {/* Animated Background Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-float"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-600 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-float-delayed"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-5 animate-pulse-slow"></div>
      </div>

      {/* Main Footer Content */}
      <div className="relative container mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
          {/* Brand Section */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                <FaGem className="text-white text-xl" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Smartify LB
              </span>
            </div>
            <p className="text-gray-400 text-sm mb-4 leading-relaxed">
              Your premier destination for cutting-edge electronics and smart devices. 
              Experience the future of online shopping with us.
            </p>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <FaHeart className="text-pink-500" />
              <span>Making tech accessible since 2024</span>
            </div>
          </div>

          {/* Quick Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="font-bold text-white mb-4 text-lg relative inline-block">
                {category}
                <div className="absolute -bottom-2 left-0 w-8 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
              </h3>
              <ul className="space-y-2">
                {links.map((link, index) => (
                  <li key={index}>
                    <a 
                      href="#" 
                      className="text-gray-400 hover:text-purple-400 transition-all duration-300 text-sm flex items-center gap-2 group"
                      onClick={(e) => {
                        e.preventDefault();
                        if (link === "All Products") navigate("/products");
                        else if (link === "Contact Us") navigate("/contact");
                      }}
                    >
                      <FaTag className="opacity-0 group-hover:opacity-100 transition-all duration-300 text-purple-400 text-xs" />
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Contact & Newsletter */}
          <div>
            <h3 className="font-bold text-white mb-4 text-lg relative inline-block">
              Stay Connected
              <div className="absolute -bottom-2 left-0 w-8 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
            </h3>
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3 text-gray-400 text-sm group">
                <FaEnvelope className="group-hover:text-purple-400 transition-colors" />
                <span>support@smartify.com</span>
              </div>
              <div className="flex items-center gap-3 text-gray-400 text-sm group">
                <FaPhone className="group-hover:text-purple-400 transition-colors" />
                <span>+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center gap-3 text-gray-400 text-sm group">
                <FaMapMarkerAlt className="group-hover:text-purple-400 transition-colors" />
                <span>123 Tech Street, Silicon Valley, CA</span>
              </div>
              <div className="flex items-center gap-3 text-gray-400 text-sm group">
                <FaClock className="group-hover:text-purple-400 transition-colors" />
                <span>Mon-Fri: 9AM - 9PM</span>
              </div>
            </div>

            {/* Newsletter Signup */}
            <form onSubmit={handleSubscribe} className="mt-4">
              <p className="text-white text-sm font-semibold mb-2">Subscribe to our newsletter</p>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email address"
                  className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 text-sm focus:outline-none focus:border-purple-500 transition-all"
                  required
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg text-sm font-semibold hover:shadow-lg hover:shadow-purple-500/25 transition-all hover:transform hover:-translate-y-0.5"
                >
                  Subscribe
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-white/10 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            {/* Copyright */}
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <span>© 2025 Smartify LB.</span>
              <span className="hidden md:inline">|</span>
              <span>All rights reserved.</span>
              <span className="hidden md:inline">|</span>
              <span>Made with <FaHeart className="inline text-pink-500 animate-pulse" /> for tech lovers</span>
            </div>

            {/* Payment Methods */}
            <div className="flex items-center gap-3">
              <span className="text-gray-400 text-xs">Secure payments:</span>
              <div className="flex gap-2">
                {paymentIcons.map((Icon, index) => (
                  <div key={index} className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition-all">
                    <Icon className="text-gray-300 text-sm" />
                  </div>
                ))}
              </div>
            </div>

            {/* Social Links */}
            <div className="flex gap-3">
              {socialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`w-10 h-10 bg-white/10 rounded-full flex items-center justify-center transition-all duration-300 hover:transform hover:-translate-y-1 hover:scale-110 ${social.color} group`}
                >
                  <social.icon className="text-white text-sm group-hover:scale-110 transition-transform" />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="mt-8 flex flex-wrap justify-center gap-6">
          <div className="flex items-center gap-2 text-gray-400 text-xs">
            <FaShoppingBag className="text-purple-400" />
            <span>30-Day Returns</span>
          </div>
          <div className="flex items-center gap-2 text-gray-400 text-xs">
            <FaRocket className="text-purple-400" />
            <span>Fast Shipping</span>
          </div>
          <div className="flex items-center gap-2 text-gray-400 text-xs">
            <FaHeart className="text-pink-400" />
            <span>100% Secure</span>
          </div>
        </div>
      </div>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 hover:transform hover:-translate-y-1 animate-fade-in-up z-50 group"
        >
          <FaArrowUp className="text-white group-hover:animate-bounce" />
        </button>
      )}

      {/* Custom CSS */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          50% { transform: translateY(-20px) translateX(10px); }
        }
        
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          50% { transform: translateY(20px) translateX(-10px); }
        }
        
        @keyframes pulse-slow {
          0%, 100% { transform: scale(1); opacity: 0.05; }
          50% { transform: scale(1.1); opacity: 0.1; }
        }
        
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        
        .animate-float-delayed {
          animation: float-delayed 6s ease-in-out infinite;
        }
        
        .animate-pulse-slow {
          animation: pulse-slow 4s ease-in-out infinite;
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.3s ease-out forwards;
        }
      `}</style>
    </footer>
  );
};

export default Footer;