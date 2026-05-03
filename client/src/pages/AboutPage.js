import React from "react";
import { FaRocket, FaShieldAlt, FaTruck, FaHeadset, FaSmile, FaAward, FaUsers, FaGlobe, FaShoppingBag, FaCreditCard, FaStar, FaHeart } from "react-icons/fa";

const AboutPage = () => {
  const features = [
    { icon: FaRocket, title: "Fast Delivery", description: "Same-day dispatch on all orders", color: "from-blue-500 to-cyan-500" },
    { icon: FaShieldAlt, title: "Secure Shopping", description: "256-bit SSL encryption", color: "from-green-500 to-emerald-500" },
    { icon: FaHeadset, title: "24/7 Support", description: "Always here to help you", color: "from-purple-500 to-pink-500" },
    { icon: FaAward, title: "Quality Guarantee", description: "1-year warranty on all products", color: "from-yellow-500 to-orange-500" },
    { icon: FaSmile, title: "Happy Customers", description: "10,000+ satisfied clients", color: "from-red-500 to-rose-500" },
    { icon: FaGlobe, title: "Global Shipping", description: "Worldwide delivery available", color: "from-indigo-500 to-purple-500" }
  ];

  const stats = [
    { number: "10K+", label: "Happy Customers", icon: FaUsers },
    { number: "500+", label: "Products", icon: FaShoppingBag },
    { number: "50+", label: "Brands", icon: FaGlobe },
    { number: "24/7", label: "Support", icon: FaHeadset }
  ];

  const team = [
    { name: "John Doe", role: "CEO & Founder", image: "https://randomuser.me/api/portraits/men/1.jpg" },
    { name: "Jane Smith", role: "Head of Operations", image: "https://randomuser.me/api/portraits/women/2.jpg" },
    { name: "Mike Johnson", role: "Tech Lead", image: "https://randomuser.me/api/portraits/men/3.jpg" },
    { name: "Sarah Williams", role: "Customer Support", image: "https://randomuser.me/api/portraits/women/4.jpg" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-black/50 z-10"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-blue-600/20 z-10"></div>
        
        {/* Animated Background */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse delay-2000"></div>
        </div>

        {/* Hero Content */}
        <div className="relative z-20 container mx-auto px-4 py-24 text-center">
          <div className="inline-block animate-bounce">
            <div className="w-24 h-24 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6 transform rotate-3 shadow-2xl">
              <span className="text-white text-4xl font-bold">S</span>
            </div>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 animate-fade-in-up">
            About <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">Smartify LB</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto animate-fade-in-up animation-delay-200">
            Your Premier Destination for Cutting-Edge Electronics
          </p>
          <div className="mt-8 flex gap-4 justify-center animate-fade-in-up animation-delay-400">
            <button 
              onClick={() => window.location.href = '/products'} 
              className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full font-semibold hover:from-purple-700 hover:to-blue-700 transform hover:scale-105 transition-all duration-300 shadow-lg"
            >
              Shop Now
            </button>
            <button 
              onClick={() => window.location.href = '/contact'} 
              className="px-8 py-3 border-2 border-white/30 text-white rounded-full font-semibold hover:bg-white/10 transform hover:scale-105 transition-all duration-300"
            >
              Contact Us
            </button>
          </div>
        </div>
      </div>

      {/* Mission Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Our <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">Mission</span>
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-purple-500 to-blue-500 mx-auto mb-8"></div>
          <p className="text-xl text-gray-300 leading-relaxed">
            Smartify LB is your go-to online store for the latest electronics. 
            From smartphones and laptops to smartwatches and headphones, 
            we carefully select top-quality products at competitive prices. 
            Enjoy fast delivery, excellent customer service, and a shopping experience 
            designed for tech enthusiasts.
          </p>
        </div>
      </div>

      {/* Features Grid */}
      <div className="container mx-auto px-4 py-20">
        <h2 className="text-4xl md:text-5xl font-bold text-white text-center mb-16">
          Why Choose <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">Us?</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="group bg-white/5 backdrop-blur-sm rounded-2xl p-8 hover:bg-white/10 transition-all duration-300 transform hover:-translate-y-2 border border-white/10 hover:border-purple-500/50"
              >
                <div className={`w-16 h-16 bg-gradient-to-r ${feature.color} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                  <Icon className="text-white text-2xl" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                <p className="text-gray-400 leading-relaxed">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 backdrop-blur-sm py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="text-center group">
                  <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <Icon className="text-white text-3xl" />
                  </div>
                  <div className="text-4xl font-bold text-white mb-2">{stat.number}</div>
                  <div className="text-gray-300">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Values Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Our Core <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">Values</span>
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-purple-500 to-blue-500 mb-8"></div>
            <div className="space-y-6">
              <div className="flex gap-4 group">
                <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-purple-500/40 transition-all">
                  <FaSmile className="text-purple-400 text-xl" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">Customer First</h3>
                  <p className="text-gray-400">Your satisfaction is our top priority in everything we do.</p>
                </div>
              </div>
              <div className="flex gap-4 group">
                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-blue-500/40 transition-all">
                  <FaRocket className="text-blue-400 text-xl" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">Innovation</h3>
                  <p className="text-gray-400">Always staying ahead with the latest technology trends.</p>
                </div>
              </div>
              <div className="flex gap-4 group">
                <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-green-500/40 transition-all">
                  <FaShieldAlt className="text-green-400 text-xl" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">Trust & Transparency</h3>
                  <p className="text-gray-400">Honest pricing, clear policies, and secure transactions.</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="relative">
            <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-2xl p-8 border border-white/10 backdrop-blur-sm">
              <h3 className="text-2xl font-bold text-white mb-4 text-center">Our Commitment</h3>
              <p className="text-gray-300 text-center leading-relaxed">
                We're committed to providing the best online shopping experience 
                for electronics in Lebanon and beyond. Quality products, competitive 
                prices, and exceptional service - that's our promise to you.
              </p>
              <div className="mt-6 flex justify-center gap-2">
                <FaStar className="text-yellow-400" />
                <FaStar className="text-yellow-400" />
                <FaStar className="text-yellow-400" />
                <FaStar className="text-yellow-400" />
                <FaStar className="text-yellow-400" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Team Section */}
      <div className="container mx-auto px-4 py-20">
        <h2 className="text-4xl md:text-5xl font-bold text-white text-center mb-16">
          Meet Our <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">Team</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {team.map((member, index) => (
            <div key={index} className="group bg-white/5 backdrop-blur-sm rounded-2xl p-6 text-center hover:bg-white/10 transition-all duration-300 transform hover:-translate-y-2 border border-white/10">
              <div className="w-32 h-32 rounded-full mx-auto mb-4 overflow-hidden border-4 border-purple-500/50 group-hover:border-purple-500 transition-all">
                <img src={member.image} alt={member.name} className="w-full h-full object-cover" />
              </div>
              <h3 className="text-xl font-bold text-white mb-1">{member.name}</h3>
              <p className="text-purple-400 text-sm">{member.role}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="container mx-auto px-4 py-20">
        <h2 className="text-4xl md:text-5xl font-bold text-white text-center mb-16">
          What Our <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">Customers Say</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-purple-500/50 transition-all">
            <div className="flex gap-1 mb-4">
              {[...Array(5)].map((_, i) => <FaStar key={i} className="text-yellow-400" />)}
            </div>
            <p className="text-gray-300 mb-4">"Amazing products and fast delivery! The customer service is exceptional. Highly recommend Smartify LB!"</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold">JD</span>
              </div>
              <div>
                <h4 className="text-white font-semibold">John Doe</h4>
                <p className="text-gray-400 text-sm">Verified Buyer</p>
              </div>
            </div>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-purple-500/50 transition-all transform md:-translate-y-4">
            <div className="flex gap-1 mb-4">
              {[...Array(5)].map((_, i) => <FaStar key={i} className="text-yellow-400" />)}
            </div>
            <p className="text-gray-300 mb-4">"Best electronics store in Lebanon! Great prices and amazing selection. Will shop again!"</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold">JS</span>
              </div>
              <div>
                <h4 className="text-white font-semibold">Jane Smith</h4>
                <p className="text-gray-400 text-sm">Verified Buyer</p>
              </div>
            </div>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-purple-500/50 transition-all">
            <div className="flex gap-1 mb-4">
              {[...Array(5)].map((_, i) => <FaStar key={i} className="text-yellow-400" />)}
            </div>
            <p className="text-gray-300 mb-4">"The AI search feature is incredible! Found exactly what I needed. Fast shipping too!"</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold">MK</span>
              </div>
              <div>
                <h4 className="text-white font-semibold">Mike Khalil</h4>
                <p className="text-gray-400 text-sm">Verified Buyer</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-3xl p-12 text-center transform hover:scale-[1.02] transition-transform duration-500 shadow-2xl">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Upgrade Your Tech?
          </h2>
          <p className="text-purple-100 text-lg mb-8 max-w-2xl mx-auto">
            Join thousands of satisfied customers and experience the best in electronics shopping.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <button 
              onClick={() => window.location.href = '/products'} 
              className="px-8 py-3 bg-white text-purple-600 rounded-full font-semibold hover:bg-gray-100 transform hover:scale-105 transition-all duration-300 shadow-lg flex items-center gap-2"
            >
              <FaShoppingBag /> Start Shopping Now
            </button>
            <button 
              onClick={() => window.location.href = '/contact'} 
              className="px-8 py-3 border-2 border-white text-white rounded-full font-semibold hover:bg-white/10 transform hover:scale-105 transition-all duration-300 flex items-center gap-2"
            >
              <FaHeadset /> Contact Support
            </button>
          </div>
        </div>
      </div>

      {/* Custom Animations */}
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in-up {
          animation: fadeInUp 0.8s ease-out forwards;
        }
        
        .animation-delay-200 {
          animation-delay: 0.2s;
          opacity: 0;
        }
        
        .animation-delay-400 {
          animation-delay: 0.4s;
          opacity: 0;
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 0.4; }
        }
        
        .delay-1000 {
          animation-delay: 1s;
        }
        
        .delay-2000 {
          animation-delay: 2s;
        }
        
        @keyframes bounce {
          0%, 100% { transform: translateY(0) rotate(3deg); }
          50% { transform: translateY(-10px) rotate(3deg); }
        }
        
        .animate-bounce {
          animation: bounce 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default AboutPage;