import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useInView, useAnimation } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faVideo, 
  faScissors, 
  faMagicWandSparkles, 
  faFilm, 
  faArrowRight, 
  faUser,
  faRightToBracket,
  faUserPlus,
  faStar,
  faCheck,
  faRocket,
  faShield,
  faGears,
  faCloud,
  faDownload,
  faBolt,
  faChartLine,
  faCode,
  faGlobe,
  faServer,
  faClock,
  faInfinity,
  faLock,
  faUsers,
  faCrown,
  faGem,
  faQuoteLeft,
  faQuoteRight,
  faCheckCircle,
  faAngleDown,
  faHandshake,
  faQuestion,
  faBrain,
  faLightbulb,
  faComments,
  faHeadset,
  faTools,
  faChartBar,
  faChevronRight,
  faChevronLeft,
  faPlay,
  faEye,
  faFileVideo,
  faExclamationCircle,
  faCirclePlay,
  faUpload,
  faPlus,
  faEnvelope,
  faPaperPlane,
  faArrowUp
} from '@fortawesome/free-solid-svg-icons';

// Add import for brand icons
import {
  faTwitter,
  faFacebookF,
  faInstagram,
  faLinkedinIn
} from '@fortawesome/free-brands-svg-icons';

// Epic Hero Animation Component
const HeroAnimation = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);
  const particlesRef = useRef([]);
  const floatingElements = useRef([]);
  
  // Initialize particles
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Create particles
    const containerWidth = containerRef.current.clientWidth;
    const containerHeight = containerRef.current.clientHeight;
    
    // Reset particles
    particlesRef.current = [];
    
    // Generate particles
    for (let i = 0; i < 60; i++) {
      particlesRef.current.push({
        x: Math.random() * containerWidth,
        y: Math.random() * containerHeight,
        size: Math.random() * 3 + 1,
        speedX: (Math.random() - 0.5) * 0.7,
        speedY: (Math.random() - 0.5) * 0.7,
        opacity: Math.random() * 0.5 + 0.3,
        color: i % 5 === 0 ? "#6c5ce7" : i % 3 === 0 ? "#a29bfe" : "#ffffff"
      });
    }
    
    // Generate floating UI elements
    const elements = ['rectangle', 'circle', 'triangle', 'square', 'pentagon', 'hexagon'];
    floatingElements.current = [];
    
    for (let i = 0; i < 10; i++) {
      floatingElements.current.push({
        type: elements[Math.floor(Math.random() * elements.length)],
        x: Math.random() * containerWidth,
        y: Math.random() * containerHeight,
        size: Math.random() * 30 + 20,
        speedX: (Math.random() - 0.5) * 0.4,
        speedY: (Math.random() - 0.5) * 0.4,
        opacity: Math.random() * 0.3 + 0.05,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 0.8
      });
    }
    
    // Animation loop
    let animationFrameId;
    
    const animate = () => {
      if (!containerRef.current) return;
      
      const ctx = containerRef.current.getContext('2d');
      const width = containerRef.current.width;
      const height = containerRef.current.height;
      
      // Clear canvas
      ctx.clearRect(0, 0, width, height);
      
      // Draw glow effect around cursor
      const gradient = ctx.createRadialGradient(
        mousePosition.x, mousePosition.y, 0,
        mousePosition.x, mousePosition.y, 150
      );
      gradient.addColorStop(0, "rgba(108, 92, 231, 0.6)");
      gradient.addColorStop(0.4, "rgba(108, 92, 231, 0.2)");
      gradient.addColorStop(1, "rgba(108, 92, 231, 0)");
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(mousePosition.x, mousePosition.y, 150, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw and update floating elements
      floatingElements.current.forEach(element => {
        // Update position
        element.x += element.speedX;
        element.y += element.speedY;
        element.rotation += element.rotationSpeed;
        
        // Boundary checking
        if (element.x < -element.size) element.x = width + element.size;
        if (element.x > width + element.size) element.x = -element.size;
        if (element.y < -element.size) element.y = height + element.size;
        if (element.y > height + element.size) element.y = -element.size;
        
        // Mouse attraction
        const dx = mousePosition.x - element.x;
        const dy = mousePosition.y - element.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 200) {
          const force = 0.2 * (1 - distance / 200);
          element.x += dx * force * 0.05;
          element.y += dy * force * 0.05;
        }
        
        // Draw element
        ctx.save();
        ctx.translate(element.x, element.y);
        ctx.rotate(element.rotation * Math.PI / 180);
        
        // Different shapes
        ctx.fillStyle = `rgba(108, 92, 231, ${element.opacity})`;
        
        switch(element.type) {
          case 'rectangle':
            ctx.fillRect(-element.size/2, -element.size/4, element.size, element.size/2);
            break;
          case 'circle':
            ctx.beginPath();
            ctx.arc(0, 0, element.size/2, 0, Math.PI * 2);
            ctx.fill();
            break;
          case 'triangle':
            ctx.beginPath();
            ctx.moveTo(0, -element.size/2);
            ctx.lineTo(element.size/2, element.size/2);
            ctx.lineTo(-element.size/2, element.size/2);
            ctx.closePath();
            ctx.fill();
            break;
          case 'square':
            ctx.fillRect(-element.size/2, -element.size/2, element.size, element.size);
            break;
          case 'pentagon':
            ctx.beginPath();
            for (let i = 0; i < 5; i++) {
              const angle = (i * 2 * Math.PI / 5) - Math.PI / 2;
              const x = Math.cos(angle) * element.size/2;
              const y = Math.sin(angle) * element.size/2;
              if (i === 0) ctx.moveTo(x, y);
              else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.fill();
            break;
          case 'hexagon':
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
              const angle = (i * 2 * Math.PI / 6);
              const x = Math.cos(angle) * element.size/2;
              const y = Math.sin(angle) * element.size/2;
              if (i === 0) ctx.moveTo(x, y);
              else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.fill();
            break;
          default:
            ctx.fillRect(-element.size/2, -element.size/2, element.size, element.size);
        }
        
        ctx.restore();
      });
      
      // Draw and update particles
      particlesRef.current.forEach(particle => {
        // Update position
        particle.x += particle.speedX;
        particle.y += particle.speedY;
        
        // Boundary checking
        if (particle.x < 0) particle.x = width;
        if (particle.x > width) particle.x = 0;
        if (particle.y < 0) particle.y = height;
        if (particle.y > height) particle.y = 0;
        
        // Mouse attraction/repulsion
        const dx = mousePosition.x - particle.x;
        const dy = mousePosition.y - particle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 100) {
          const force = 1 - distance / 100;
          particle.x -= dx * force * 0.02;
          particle.y -= dy * force * 0.02;
        }
        
        // Draw particle
        ctx.fillStyle = particle.color + Math.floor(particle.opacity * 255).toString(16).padStart(2, '0');
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Connect nearby particles
        particlesRef.current.forEach(otherParticle => {
          const dx = particle.x - otherParticle.x;
          const dy = particle.y - otherParticle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < 80) {
            ctx.strokeStyle = `rgba(108, 92, 231, ${0.2 * (1 - distance / 80)})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(otherParticle.x, otherParticle.y);
            ctx.stroke();
          }
        });
      });
      
      animationFrameId = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [mousePosition]);
  
  // Handle mouse movement
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!containerRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      setMousePosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    };
    
    const container = containerRef.current;
    if (container) {
      container.addEventListener('mousemove', handleMouseMove);
      
      // Set canvas dimensions
      const resizeCanvas = () => {
        container.width = container.clientWidth;
        container.height = container.clientHeight;
        
        // Force repaint to ensure proper rendering
        container.style.width = '100%';
        container.style.height = '100%';
      };
      
      resizeCanvas();
      // Call resize on timeout to ensure animations render properly
      setTimeout(resizeCanvas, 100);
      window.addEventListener('resize', resizeCanvas);
      
      return () => {
        container.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('resize', resizeCanvas);
      };
    }
  }, []);
  
  return (
    <canvas 
      ref={containerRef} 
      className="absolute inset-0 z-10 pointer-events-none w-full h-full"
      style={{ 
        mixBlendMode: 'screen', 
        width: '100%', 
        height: '100%', 
        position: 'absolute',
        top: 0,
        left: 0
      }}
    />
  );
};

// Enhanced AnimatedBackground with improved visual elements
const AnimatedBackground = () => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-[-1]">
      {/* Base dark gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a13] via-[#12121f] to-[#0a0a13]"></div>
      
      {/* Animated grid pattern */}
      <div className="absolute inset-0 opacity-[0.05]">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(108, 92, 231, 0.2) 1px, transparent 1px),
            linear-gradient(90deg, rgba(108, 92, 231, 0.2) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
          backgroundPosition: '-0.5px -0.5px',
          animation: 'gridMove 45s linear infinite'
        }}></div>
      </div>

      {/* Animated gradient orbs */}
      <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full bg-gradient-to-r from-[#6c5ce7]/15 to-[#9d8dfc]/10 blur-[150px] animate-pulse-slow"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[700px] h-[700px] rounded-full bg-gradient-to-r from-[#7f66ff]/12 to-[#a78bfa]/8 blur-[180px] animate-pulse-slower"></div>
      <div className="absolute top-3/4 left-2/3 w-[500px] h-[500px] rounded-full bg-gradient-to-r from-[#4F46E5]/8 to-[#818CF8]/5 blur-[130px] animate-pulse-slow"></div>
      
      {/* Star-like particles */}
      <div className="stars-small"></div>
      <div className="stars-medium"></div>
      <div className="stars-large"></div>
      
      {/* Subtle scanline effect */}
      <div className="absolute inset-0 bg-scanline opacity-[0.02] pointer-events-none"></div>
    </div>
  );
};

// Improved Component: Features and Pricing section
const FeatureCard = ({ icon, title, description, delay = 0, accentColor = 'from-[#6c5ce7] to-[#a29bfe]' }) => {
  const ref = useRef(null);
  
  return (
    <motion.div
      ref={ref}
      className="bg-[#1a1a2e]/60 backdrop-blur-md border border-[#ffffff1a] rounded-xl p-6 overflow-hidden relative group"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px 0px" }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -5, boxShadow: "0 15px 30px -10px rgba(108, 92, 231, 0.15)" }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/5 to-indigo-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      <div className="absolute -right-20 -bottom-20 w-40 h-40 bg-gradient-to-br from-[#6c5ce7]/10 to-[#a29bfe]/5 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
      
      <div className={`bg-gradient-to-br ${accentColor} w-12 h-12 rounded-lg mb-4 flex items-center justify-center`}>
        <FontAwesomeIcon icon={icon} className="text-white text-lg" />
      </div>
      
      <h3 className="text-lg font-bold text-white mb-3 relative z-10">{title}</h3>
      <p className="text-gray-400 leading-relaxed text-sm relative z-10">{description}</p>
    </motion.div>
  );
};

// Enhanced Pricing Card Component
const PricingCard = ({ title, price, features, recommended, icon, period = 'month' }) => {
  return (
    <motion.div 
      className={`relative group h-full`}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px 0px" }}
      transition={{ duration: 0.5 }}
      whileHover={{ translateY: -8 }}
    >
      {/* Background glow effect */}
      <div className={`absolute -inset-0.5 rounded-2xl blur-md bg-gradient-to-br opacity-30 
        ${recommended ? 'from-[#6c5ce7] to-[#a29bfe] group-hover:opacity-100' : 'from-[#2d2b42] to-[#1f1d36] group-hover:opacity-80'} 
        transition-all duration-500 group-hover:blur-xl`}></div>
      
      {/* Card Body */}
      <div className={`relative h-full flex flex-col rounded-xl overflow-hidden bg-[#151522] border 
        ${recommended ? 'border-[#6c5ce7]/40' : 'border-[#2d2b42]'} 
        backdrop-blur-md group-hover:border-[#6c5ce7]/60 transition-all duration-300`}>
        
        {/* Recommended label */}
        {recommended && (
          <div className="absolute top-0 right-0 left-0 bg-gradient-to-r from-[#6c5ce7] to-[#a29bfe] text-white py-1.5 text-sm font-medium text-center shadow-lg">
            Most Popular
          </div>
        )}

        {/* Header Section */}
        <div className={`p-8 ${recommended ? 'pt-12' : 'pt-8'} text-center relative overflow-hidden`}>
          {/* Background patterns */}
          <div className="absolute top-0 left-0 w-full h-full opacity-5">
            <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full border border-[#6c5ce7]/10"></div>
            <div className="absolute -bottom-8 -left-8 w-40 h-40 rounded-full border border-[#6c5ce7]/5"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full border border-[#6c5ce7]/20"></div>
          </div>
          
          {/* Icon */}
          <div className="relative mb-5 mx-auto">
            <div className={`w-16 h-16 mx-auto rounded-xl flex items-center justify-center relative
              ${recommended ? 'bg-gradient-to-br from-[#6c5ce7]/20 to-[#a29bfe]/20' : 'bg-[#1d1c2d]'}`}>
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center
                ${recommended ? 'bg-gradient-to-r from-[#6c5ce7] to-[#a29bfe]' : 'bg-[#272636]'}`}>
                <FontAwesomeIcon icon={icon} className="text-white text-xl" />
              </div>
            </div>
          </div>
          
          {/* Plan Name */}
          <h3 className={`text-2xl font-bold mb-2 
            ${recommended ? 'text-white' : 'text-gray-200'}`}>
            {title}
          </h3>
          
          {/* Price */}
          <div className="mb-6">
            <span className={`text-5xl font-bold 
              ${recommended ? 'text-white bg-clip-text text-transparent bg-gradient-to-r from-white to-[#a29bfe]' : 'text-gray-200'}`}>
              ${price}
            </span>
            <span className="text-gray-400 text-base">/{period}</span>
          </div>
        </div>
        
        {/* Features List */}
        <div className="px-8 pb-8 flex-grow flex flex-col">
          <ul className="space-y-4 mb-8 flex-grow">
            {features.map((feature, index) => (
              <motion.li 
                key={index} 
                className="flex items-start gap-3"
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: 0.1 * index }}
              >
                <div className={`mt-0.5 text-xs 
                  ${recommended ? 'text-[#a29bfe]' : 'text-[#6c5ce7]'}`}>
                  <FontAwesomeIcon icon={faCheck} />
                </div>
                <span className="text-gray-300 text-sm">{feature}</span>
              </motion.li>
            ))}
          </ul>
          
          {/* CTA Button */}
          <motion.button
            className={`w-full py-3 px-6 rounded-xl text-white font-medium transition-all duration-300 shadow-lg
              ${recommended 
                ? 'bg-gradient-to-r from-[#6c5ce7] to-[#a29bfe] hover:shadow-[#6c5ce7]/30 hover:shadow-xl' 
                : 'bg-[#1d1c2d] hover:bg-[#272636] border border-[#2d2b42] hover:border-[#6c5ce7]/30'}`}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
          >
            Get Started
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

// Enhanced Testimonial Card with better spacing
const TestimonialCard = ({ name, role, company, image, quote }) => {
  const ref = useRef(null);
  
  return (
    <motion.div 
      ref={ref}
      className="bg-[#1a1a2e]/50 backdrop-blur-sm border border-[#ffffff1a] rounded-xl p-6 relative"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px 0px" }}
      transition={{ duration: 0.5 }}
      whileHover={{ y: -5, boxShadow: "0 15px 30px -10px rgba(0, 0, 0, 0.2)" }}
    >
      <div className="absolute top-4 left-4 text-[#6c5ce7]/20 text-3xl">
        <FontAwesomeIcon icon={faQuoteLeft} />
      </div>
      
      <div className="relative z-10">
        <p className="text-gray-300 mb-5 text-base leading-relaxed">{quote}</p>
        
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-[#6c5ce7]/30">
            <img src={image} alt={name} className="w-full h-full object-cover" />
          </div>
          <div>
            <h4 className="text-white font-semibold text-sm">{name}</h4>
            <p className="text-gray-400 text-xs">{role} at {company}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Enhanced FAQ Item Component with better animation and styling
const FAQItem = ({ question, answer, isOpen, onClick }) => {
  return (
    <motion.div 
      className={`border-b border-[#ffffff1a] overflow-hidden ${isOpen ? 'pb-4' : 'pb-0'}`}
      initial={false}
      animate={{ backgroundColor: isOpen ? 'rgba(108, 92, 231, 0.05)' : 'transparent' }}
      transition={{ duration: 0.3 }}
    >
      <button
        className="w-full py-4 px-4 text-left flex items-center justify-between focus:outline-none group rounded-lg"
        onClick={onClick}
      >
        <h3 className={`text-base font-medium ${isOpen ? 'text-[#a29bfe]' : 'text-white'} group-hover:text-[#a29bfe] transition-colors`}>
          {question}
        </h3>
        <motion.div
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{ duration: 0.2 }}
          className={`w-6 h-6 flex items-center justify-center ${isOpen ? 'text-[#a29bfe]' : 'text-gray-400'}`}
        >
          <FontAwesomeIcon icon={faPlus} className="text-xs" />
        </motion.div>
      </button>
      <motion.div
        initial={false}
        animate={{
          height: isOpen ? 'auto' : 0,
          opacity: isOpen ? 1 : 0,
          marginTop: isOpen ? 8 : 0
        }}
        transition={{ duration: 0.3 }}
        className="overflow-hidden px-4"
      >
        <p className="text-gray-400 text-sm leading-relaxed">{answer}</p>
      </motion.div>
    </motion.div>
  );
};

// Scroll Indicator component for vertical navigation
const ScrollIndicator = ({ sections, activeSection, scrollToSection }) => {
  return (
    <motion.div 
      className="fixed right-6 top-1/2 transform -translate-y-1/2 z-40 hidden md:flex flex-col items-center gap-4"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 1, duration: 0.5 }}
    >
      {sections.map((section) => (
        <motion.div
          key={section.id}
          className="relative group cursor-pointer"
          onClick={() => scrollToSection(section.id)}
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 0.9 }}
        >
          {/* Indicator dot with animated gradient */}
          <motion.div 
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              activeSection === section.id 
                ? 'bg-gradient-to-r from-[#6c5ce7] to-[#a29bfe] shadow-md shadow-purple-500/30' 
                : 'bg-white/30 hover:bg-white/50'
            }`}
            animate={activeSection === section.id ? {
              scale: [1, 1.2, 1],
              boxShadow: [
                '0 0 0 0 rgba(108, 92, 231, 0)',
                '0 0 0 4px rgba(108, 92, 231, 0.3)',
                '0 0 0 0 rgba(108, 92, 231, 0)'
              ]
            } : {}}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          
          {/* Enhanced tooltip with animation */}
          <div className="absolute right-full mr-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
            <motion.div
              className="bg-[#0a0a13]/90 backdrop-blur-md px-3 py-1.5 rounded-lg text-xs border border-[#ffffff1a] whitespace-nowrap"
              initial={{ opacity: 0, x: 10, scale: 0.9 }}
              whileHover={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ duration: 0.2 }}
              animate={activeSection === section.id ? 
                { opacity: 1, x: 0, scale: 1 } : 
                { opacity: 0, x: 10, scale: 0.9 }
              }
            >
              {/* Animated gradient accent */}
              {activeSection === section.id && (
                <motion.div 
                  className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg bg-gradient-to-b from-[#6c5ce7] to-[#a29bfe]"
                  layoutId="sidebarActiveIndicator"
                />
              )}
              
              {/* Section name */}
              <span className={activeSection === section.id ? 
                'font-medium' : ''
              }>
                {section.name}
              </span>
            </motion.div>
          </div>
          
          {/* Line connecting dots */}
          {section.id !== sections[sections.length - 1].id && (
            <div className="h-10 w-px bg-white/10 mx-auto mt-1"></div>
          )}
        </motion.div>
      ))}
    </motion.div>
  );
};

// Scroll Progress Bar component
const ScrollProgressBar = () => {
  const [scrollProgress, setScrollProgress] = useState(0);

  const handleScroll = () => {
    const totalHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrollPosition = window.scrollY;
    const progress = (scrollPosition / totalHeight) * 100;
    setScrollProgress(progress);
  };

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <motion.div 
      className="fixed top-0 left-0 right-0 h-1 z-50 bg-gradient-to-r from-[#6c5ce7] to-[#a29bfe]"
      style={{ width: `${scrollProgress}%`, transformOrigin: 'left' }}
      animate={{ opacity: scrollProgress > 0 ? 1 : 0 }}
      transition={{ duration: 0.3 }}
    />
  );
};

// New component for header with scroll effect
const DynamicHeader = ({ children, scrollY }) => {
  // Calculate background opacity based on scroll position
  const bgOpacity = Math.min(0.9, 0.6 + (scrollY / 500) * 0.3);
  const borderOpacity = Math.min(0.1, 0.05 + (scrollY / 500) * 0.05);
  const boxShadowOpacity = Math.min(0.15, 0.05 + (scrollY / 500) * 0.1);
  
  return (
    <motion.header 
      className="fixed top-0 left-0 right-0 z-50 backdrop-blur-lg border-b px-4 transition-all duration-300"
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      style={{
        backgroundColor: `rgba(10, 10, 19, ${bgOpacity})`,
        borderColor: `rgba(255, 255, 255, ${borderOpacity})`,
        boxShadow: `0 4px 30px rgba(0, 0, 0, ${boxShadowOpacity})`,
        height: 'var(--header-height)'
      }}
    >
      {children}
    </motion.header>
  );
};

// Scroll-to-top button component
const ScrollToTopButton = () => {
  const [isVisible, setIsVisible] = useState(false);

  const toggleVisibility = () => {
    if (window.scrollY > 500) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  useEffect(() => {
    window.addEventListener('scroll', toggleVisibility);
    
    return () => {
      window.removeEventListener('scroll', toggleVisibility);
    };
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          className="fixed bottom-6 right-6 z-40 w-12 h-12 rounded-full bg-gradient-to-r from-[#6c5ce7] to-[#a29bfe] flex items-center justify-center shadow-lg cursor-pointer"
          onClick={scrollToTop}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        </motion.button>
      )}
    </AnimatePresence>
  );
};

const LandingPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const featuresRef = useRef(null);
  const heroRef = useRef(null);
  const howItWorksRef = useRef(null);
  const pricingRef = useRef(null);
  const testimonialsRef = useRef(null);
  const faqRef = useRef(null);
  const isHeroInView = useInView(heroRef, { once: true });
  const isFeaturesInView = useInView(featuresRef, { once: true, amount: 0.3 });
  const isHowItWorksInView = useInView(howItWorksRef, { once: true, amount: 0.3 });
  const isPricingInView = useInView(pricingRef, { once: true, amount: 0.3 });
  const isTestimonialsInView = useInView(testimonialsRef, { once: true, amount: 0.3 });
  const isFaqInView = useInView(faqRef, { once: true, amount: 0.3 });
  const [activeSection, setActiveSection] = useState('hero');
  const [scrollY, setScrollY] = useState(0);
  const [openFAQ, setOpenFAQ] = useState(null);
  // Add state for mobile menu
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Navigation handlers
  const handleSignIn = () => navigate('/signin?redirect=/dashboard');
  const handleSignUp = () => navigate('/signup?redirect=/dashboard');
  const handleExplore = () => navigate('/explore');
  const handleDashboard = () => navigate('/dashboard');
  const handleContactUs = () => navigate('/contact');
  const handleTerms = () => navigate('/terms');
  const handlePrivacy = () => navigate('/privacy');
  const handleCookiePolicy = () => navigate('/cookies');
  const handleGDPR = () => navigate('/gdpr');

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  // Close mobile menu when clicking on a section
  const handleMobileNavigation = (sectionId) => {
    scrollToSection(sectionId);
    setMobileMenuOpen(false);
  };

  // Improved smooth scroll function with offset calculation
  const scrollToSection = (sectionId) => {
    const section = document.getElementById(sectionId);
    if (section) {
      // Calculate header height dynamically
      const headerHeight = document.querySelector('header')?.offsetHeight || 80;
      const sectionTop = section.getBoundingClientRect().top + window.pageYOffset;
      const offsetPosition = sectionTop - headerHeight;

      // Smooth scroll with proper offset
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
      
      // Update active section
      setActiveSection(sectionId);
    }
  };

  // Improved scroll handling with debouncing
  useEffect(() => {
    const handleScroll = () => {
      // Update scroll position for parallax effects
      setScrollY(window.scrollY);
      
      // Add a small delay for performance
      if (!window.requestAnimationFrame) {
        setTimeout(() => updateActiveSection(), 100);
      } else {
        window.requestAnimationFrame(() => updateActiveSection());
      }
    };

    const updateActiveSection = () => {
      const scrollPosition = window.scrollY + 100; // Reduced offset for more accurate detection
      const headerHeight = document.querySelector('header')?.offsetHeight || 80;

      // Check each section's position
      const sections = [
        { id: 'hero', el: document.getElementById('hero') },
        { id: 'features', el: document.getElementById('features') }, 
        { id: 'how-it-works', el: document.getElementById('how-it-works') },
        { id: 'pricing', el: document.getElementById('pricing') },
        { id: 'testimonials', el: document.getElementById('testimonials') },
        { id: 'faq', el: document.getElementById('faq') }
      ];

      // Find the current section in view
      for (let i = sections.length - 1; i >= 0; i--) {
        const section = sections[i];
        if (section.el && (section.el.offsetTop - headerHeight - 50) <= scrollPosition) {
          if (activeSection !== section.id) {
            setActiveSection(section.id);
          }
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [activeSection]);

  // Force enable scrolling
  useEffect(() => {
    // Force enable scrolling on body and html
    document.body.style.overflow = 'auto';
    document.body.style.height = 'auto';
    document.documentElement.style.overflow = 'auto';
    document.documentElement.style.height = 'auto';
    document.documentElement.style.scrollBehavior = 'smooth';

    // Add CSS variables for scroll-padding to handle fixed header properly
    document.documentElement.style.setProperty('--header-height', '80px');
    document.documentElement.style.setProperty('--scroll-padding', '80px');
    document.documentElement.style.scrollPaddingTop = 'var(--scroll-padding)';

    // Get the root div
    const rootDiv = document.getElementById('root');
    if (rootDiv) {
      rootDiv.style.overflow = 'visible';
      rootDiv.style.height = 'auto';
    }

    return () => {
      // Cleanup
      document.documentElement.style.removeProperty('--header-height');
      document.documentElement.style.removeProperty('--scroll-padding');
    };
  }, []);

  // Improved scroll animation effect with performance optimizations
  useEffect(() => {
    // Create an intersection observer with better thresholds
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
          // Use rAF for smoother animations
          requestAnimationFrame(() => {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
          });
          observer.unobserve(entry.target); // Stop observing once animated
        }
      });
    }, { 
      threshold: [0.05, 0.1, 0.2], 
      rootMargin: '0px 0px -10% 0px' 
    });

    // Target elements with improved selector
    const animatedElements = document.querySelectorAll('.scroll-fade-in, .scroll-scale-in');
    animatedElements.forEach(el => {
      // Set initial state more efficiently
      el.style.opacity = '0';
      el.style.transform = 'translateY(20px)';
      el.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
      observer.observe(el);
    });

    return () => {
      animatedElements.forEach(el => {
        observer.unobserve(el);
      });
    };
  }, []);

  // Define sections for the scroll indicator
  const pageSections = [
    { id: 'hero', name: 'Home' },
    { id: 'features', name: 'Features' },
    { id: 'how-it-works', name: 'How It Works' },
    { id: 'pricing', name: 'Pricing' },
    { id: 'testimonials', name: 'Testimonials' },
    { id: 'faq', name: 'FAQ' }
  ];

  // FAQ data
  const [faqs] = useState([
    {
      question: "How does ClipSmart AI work?",
      answer: "ClipSmart uses advanced AI to analyze your videos, identify key moments, and create engaging clips. It recognizes important content, transitions, and can even generate captions and summaries automatically."
    },
    {
      question: "What video formats are supported?",
      answer: "ClipSmart supports all popular video formats including MP4, MOV, AVI, and more. You can also directly import from YouTube by simply pasting a URL."
    },
    {
      question: "How accurate is the AI editing?",
      answer: "Our AI has been trained on millions of videos to recognize engaging content. Most users find that 90% of AI-generated clips require little to no additional editing, but you always have the ability to fine-tune the results."
    },
    {
      question: "Can I customize the AI's editing style?",
      answer: "Yes, you can set preferences for clip length, style, focus areas, and more. The AI will learn from your preferences over time and deliver increasingly personalized results."
    },
    {
      question: "Is there a limit to video length?",
      answer: "Free accounts can process videos up to 30 minutes. Pro accounts can handle 2-hour videos, and Enterprise accounts have no limitations on video length."
    },
    {
      question: "Do you offer refunds?",
      answer: "Yes, we offer a 14-day money-back guarantee if you're not satisfied with our service."
    }
  ]);
  
  // Add state for scroll-to-top button visibility
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Update scroll position and show/hide scroll-to-top button
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setScrollY(currentScrollY);
      
      // Show button when user scrolls down 500px
      setShowScrollTop(currentScrollY > 500);
      
      // Update active section based on scroll position
      const sections = ['hero', 'features', 'how-it-works', 'pricing', 'testimonials', 'faq'];
      for (let i = sections.length - 1; i >= 0; i--) {
        const section = document.getElementById(sections[i]);
        if (section) {
          const rect = section.getBoundingClientRect();
          if (rect.top <= 200) {
            setActiveSection(sections[i]);
            break;
          }
        }
      }
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  // Function to scroll to top smoothly
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <div className="min-h-screen bg-[#0f0f1a] text-white">
      <AnimatedBackground />
      
      {/* Add Scroll Progress Bar */}
      <ScrollProgressBar />
      
      {/* Enhanced Dynamic Header with scroll effect */}
      <DynamicHeader scrollY={scrollY}>
        <div className="max-w-7xl mx-auto py-4 flex items-center justify-between">
          <motion.div 
            className="flex items-center gap-3 cursor-pointer group"
            whileHover={{ scale: 1.03 }}
            onClick={() => scrollToSection('hero')}
          >
            <div className="relative group cursor-pointer">
              <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-[#6c5ce7] to-[#a29bfe] blur-[10px] opacity-70 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative w-10 h-10 bg-gradient-to-br from-[#6c5ce7] to-[#a29bfe] rounded-lg flex items-center justify-center border border-[#ffffff1a]">
                <FontAwesomeIcon icon={faFilm} className="text-white text-lg" />
                <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-gradient-to-r from-yellow-400 to-yellow-300 rounded-full opacity-70 group-hover:opacity-100 animate-pulse"></div>
              </div>
            </div>
            <h1 className="text-xl font-bold">
              <span className="relative bg-clip-text text-transparent bg-gradient-to-r from-white via-[#a29bfe] to-white transition-all duration-300 group-hover:from-white group-hover:via-[#8a7cfc] group-hover:to-white">
                ClipSmart 
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#6c5ce7] to-[#a29bfe] group-hover:from-[#5d4ee0] group-hover:to-[#9289fe]">AI</span>
              </span>
            </h1>
          </motion.div>

          {/* Desktop navigation with improved active state indicators */}
          <div className="hidden md:flex items-center gap-6">
            <div className="flex items-center gap-3 ml-4">
              <motion.button
                onClick={handleSignIn}
                className="px-4 py-2 rounded-lg border border-[#ffffff1a] bg-[#ffffff0a] hover:bg-[#ffffff15] transition-all text-gray-200 text-sm font-medium relative overflow-hidden group"
                whileHover={{ scale: 1.05, y: -1 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  Sign In
                </span>
              </motion.button>
              
              <motion.button
                onClick={handleSignUp}
                className="group px-5 py-2 rounded-lg relative overflow-hidden text-sm font-medium"
                whileHover={{ scale: 1.05, y: -1 }}
                whileTap={{ scale: 0.95 }}
              >
                {/* Animated gradient background */}
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-r from-[#6c5ce7] to-[#a29bfe] rounded-lg"
                />
                
                {/* Content */}
                <span className="relative flex items-center justify-center gap-1.5 z-10">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  Sign Up Free
                </span>
              </motion.button>
            </div>
          </div>

          {/* Improved Mobile menu button */}
          <div className="md:hidden">
            <motion.button 
              className="p-2 bg-[#1a1a2e] rounded-lg border border-[#ffffff1a] hover:bg-[#252540] transition-colors"
              onClick={toggleMobileMenu}
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.05 }}
            >
              <AnimatePresence mode="wait">
                {mobileMenuOpen ? (
                  <motion.svg 
                    key="close" 
                    className="w-5 h-5 text-white" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                    initial={{ opacity: 0, rotate: -90 }}
                    animate={{ opacity: 1, rotate: 0 }}
                    exit={{ opacity: 0, rotate: 90 }}
                    transition={{ duration: 0.2 }}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </motion.svg>
                ) : (
                  <motion.svg 
                    key="menu" 
                    className="w-5 h-5 text-white" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                    initial={{ opacity: 0, rotate: 90 }}
                    animate={{ opacity: 1, rotate: 0 }}
                    exit={{ opacity: 0, rotate: -90 }}
                    transition={{ duration: 0.2 }}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                  </motion.svg>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </div>
      </DynamicHeader>
      
      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            className="fixed inset-0 z-40 bg-[#0a0a13]/95 backdrop-blur-md md:hidden flex flex-col"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex flex-col h-full pt-20 pb-8 px-6 overflow-y-auto">
              <div className="flex-1">
                <nav className="space-y-6 py-6">
                  {pageSections.map((section, index) => (
                    <motion.button
                      key={section.id}
                      onClick={() => handleMobileNavigation(section.id)}
                      className={`block w-full text-left px-4 py-3 rounded-xl transition-all relative overflow-hidden group ${
                        activeSection === section.id 
                          ? 'text-white font-medium bg-gradient-to-r from-[#6c5ce715] to-transparent border-l-2 border-[#6c5ce7]' 
                          : 'text-gray-400 hover:bg-white/5'
                      }`}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 + 0.1 }}
                      whileTap={{ scale: 0.98 }}
                      whileHover={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        transition: { duration: 0.2 }
                      }}
                    >
                      {/* Hover gradient effect */}
                      <motion.div 
                        className="absolute inset-0 bg-gradient-to-r from-[#6c5ce710] to-transparent opacity-0 group-hover:opacity-100 -z-0"
                        initial={{ x: '-100%' }}
                        whileHover={{ x: 0 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      />
                    
                      <motion.div 
                        className="flex items-center relative z-10"
                        layout
                      >
                        {/* Pulsing dot indicator */}
                        <motion.span 
                          className={`w-2 h-2 rounded-full mr-3 ${
                            activeSection === section.id 
                              ? 'bg-gradient-to-r from-[#6c5ce7] to-[#a29bfe]' 
                              : 'bg-gray-500'
                          }`}
                          animate={activeSection === section.id ? {
                            scale: [1, 1.2, 1],
                            opacity: [0.7, 1, 0.7],
                          } : {}}
                          transition={activeSection === section.id ? {
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut"
                          } : {}}
                        />
                        
                        {/* Section name with subtle shine effect */}
                        <span className={activeSection === section.id ? 'text-transparent bg-clip-text bg-gradient-to-r from-white via-[#a29bfe] to-white' : ''}>
                          {section.name}
                        </span>
                      </motion.div>
                      
                      {/* Subtle underline for active section */}
                      {activeSection === section.id && (
                        <motion.div 
                          layoutId="activeMobileIndicator"
                          className="absolute bottom-0 left-4 right-4 h-0.5 bg-gradient-to-r from-[#6c5ce7] to-transparent"
                          initial={{ scaleX: 0, opacity: 0 }}
                          animate={{ scaleX: 1, opacity: 1 }}
                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        />
                      )}
                    </motion.button>
                  ))}
                </nav>
              </div>
              
              <div className="border-t border-[#ffffff1a] pt-6 space-y-4">
                <motion.button
                  onClick={() => {
                    handleSignIn();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-3 rounded-lg border border-[#ffffff1a] bg-[#ffffff0a] hover:bg-[#ffffff15] transition-colors text-white font-medium"
                  whileTap={{ scale: 0.98 }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  Sign In
                </motion.button>
                <motion.button
                  onClick={() => {
                    handleSignUp();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-3 rounded-lg bg-gradient-to-r from-[#6c5ce7] to-[#a29bfe] hover:from-[#5d4ee0] hover:to-[#9289fe] text-white font-medium flex items-center justify-center"
                  whileTap={{ scale: 0.98 }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  Sign Up Free
                  <span className="ml-1 text-xs bg-white/20 px-1.5 py-0.5 rounded-sm">Beta</span>
                </motion.button>
              </div>
              
              <motion.div 
                className="mt-8 text-center text-sm text-gray-400"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <p>© 2023 ClipSmart AI. All rights reserved.</p>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content with improved section spacing */}
      <main className="pt-20 overflow-x-hidden">
        {/* Hero Section - Improved with better parallax and alignment */}
        <section 
          id="hero" 
          ref={heroRef} 
          className="relative min-h-[90vh] flex items-center overflow-visible py-16"
          style={{
            scrollMarginTop: 'var(--scroll-padding)'
          }}
        >
          {/* Enhanced parallax hero animation */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div 
              style={{ y: scrollY * 0.2 }}
              className="w-full h-full"
            >
              <HeroAnimation />
            </motion.div>
          </div>
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pt-6 pb-12 relative z-20">
            <div className="grid lg:grid-cols-2 gap-10 items-center">
              {/* Hero Content with better spacing and alignment */}
              <div className="max-w-2xl mx-auto lg:mx-0 text-center lg:text-left">
                <motion.span 
                  className="px-4 py-1.5 rounded-full text-sm font-medium bg-[#6c5ce7]/10 border border-[#6c5ce7]/30 inline-flex items-center gap-2 mb-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={isHeroInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.5 }}
            >
                  <span className="w-2 h-2 rounded-full bg-[#6c5ce7] animate-pulse"></span>
                  AI-Powered Video Editing
                </motion.span>
                
                <motion.h2 
                  className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight mb-6 overflow-visible"
                  initial={{ opacity: 0, y: 20 }}
                  animate={isHeroInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                >
                  <span className="block md:inline">Create{" "}</span>
                  <motion.span 
                    className="bg-clip-text text-transparent bg-gradient-to-r from-[#6c5ce7] to-[#a29bfe] inline-block overflow-visible"
                    animate={{ 
                      backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] 
                    }}
                    transition={{ 
                      duration: 5, 
                      repeat: Infinity,
                      ease: "easeInOut" 
                    }}
                  >
                    captivating
                  </motion.span>{" "}
                  <span className="block md:inline">video content{" "}</span>
                  <span className="relative">
                    instantly
                    <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 100 15" preserveAspectRatio="none" height="15">
                      <motion.path 
                        d="M0,5 Q40,0 50,5 Q60,10 100,5 L100,15 L0,15 Z" 
                        fill="url(#purple-gradient)"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1, delay: 1 }}
                      />
                      <defs>
                        <linearGradient id="purple-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#6c5ce7" />
                          <stop offset="100%" stopColor="#a29bfe" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </span>
                </motion.h2>
                
                <motion.p 
                  className="text-base sm:text-lg text-gray-300 mb-8 leading-relaxed max-w-xl mx-auto lg:mx-0"
                  initial={{ opacity: 0, y: 20 }}
                  animate={isHeroInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  Transform your long-form videos into engaging highlights and clips with our 
                  AI-powered editing tools. Save hours of manual work while delivering professional results.
                </motion.p>
                
                <motion.div 
                  className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
                  initial={{ opacity: 0, y: 20 }}
                  animate={isHeroInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  <motion.button
                    onClick={handleSignUp}
                    className="px-6 py-3 bg-gradient-to-r from-[#6c5ce7] to-[#a29bfe] rounded-xl font-medium hover:shadow-lg hover:shadow-purple-500/20 transition-all flex items-center justify-center gap-2 relative overflow-hidden group"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <motion.div 
                      className="absolute inset-0 bg-white/20"
                      initial={{ x: '-100%' }}
                      animate={{ x: '200%' }}
                      transition={{ 
                        repeat: Infinity, 
                        duration: 2,
                        ease: "linear",
                        repeatDelay: 0.5
                      }}
                    />
                    Get Started Free
                    <FontAwesomeIcon icon={faArrowRight} />
                  </motion.button>
                  
                  <motion.button
                    onClick={handleExplore}
                    className="px-6 py-3 bg-[#1a1a2e]/60 border border-[#ffffff1a] rounded-xl font-medium hover:bg-[#1a1a2e] transition-all flex items-center justify-center gap-2 relative overflow-hidden"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <motion.span 
                      className="absolute h-8 w-8 rounded-full bg-[#6c5ce7]/20"
                      initial={{ scale: 0, x: 0, y: 0 }}
                      whileHover={{ 
                        scale: 5,
                        transition: { duration: 0.5 }
                      }}
                    />
                    <FontAwesomeIcon icon={faPlay} className="text-[#6c5ce7] relative z-10" />
                    <span className="relative z-10">Explore </span>
                  </motion.button>
            </motion.div>

                <motion.div 
                  className="mt-12 flex items-center gap-4 justify-center lg:justify-start"
                  initial={{ opacity: 0 }}
                  animate={isHeroInView ? { opacity: 1 } : { opacity: 0 }}
                  transition={{ duration: 0.5, delay: 0.8 }}
                >
                  <div className="flex -space-x-3">
                    {[...Array(4)].map((_, index) => (
                      <div key={index} className="w-8 h-8 rounded-full border-2 border-[#0a0a13] overflow-hidden">
                        <div className={`w-full h-full bg-gradient-to-br from-[#6c5ce7] to-[#a29bfe] opacity-${90 - index * 20}`}></div>
                      </div>
                    ))}
                  </div>
                  <div className="text-sm">
                    <span className="text-white font-medium">500+</span>
                    <span className="text-gray-400"> users already creating amazing videos</span>
                  </div>
                </motion.div>
              </div>
              
              {/* Hero Video Preview with improved responsive design */}
              <motion.div
                className="relative aspect-video max-w-xl mx-auto w-full rounded-2xl overflow-hidden shadow-2xl shadow-[#6c5ce7]/10"
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={isHeroInView ? { opacity: 1, scale: 1, y: 0 } : { opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                whileHover={{ 
                  y: -10,
                  boxShadow: "0 30px 60px -12px rgba(108, 92, 231, 0.4)",
                  transition: { duration: 0.3 }
                }}
              >
                {/* Enhanced glowing backdrop with animation */}
                <motion.div 
                  className="absolute -inset-1 bg-gradient-to-r from-[#6c5ce7] to-[#a29bfe] rounded-2xl blur-xl"
                  animate={{ 
                    opacity: [0.3, 0.5, 0.3],
                    scale: [1, 1.05, 1]
                  }}
                  transition={{ 
                    duration: 3, 
                    repeat: Infinity,
                    ease: "easeInOut" 
                  }}
                />
                
                {/* Video container with enhanced UI */}
                <div className="relative rounded-2xl overflow-hidden border border-[#ffffff1a] shadow-2xl bg-[#1a1a2e]">
                  {/* Video thumbnail with interactive elements */}
                  <div className="aspect-video relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a2e] to-[#10102e]">
                      {/* Animated grid background */}
                      <motion.div 
                        className="absolute inset-0" 
                        style={{
                          backgroundImage: `
                            linear-gradient(rgba(108, 92, 231, 0.2) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(108, 92, 231, 0.2) 1px, transparent 1px)
                          `,
                          backgroundSize: '20px 20px',
                        }}
                        animate={{
                          backgroundPosition: ['0px 0px', '20px 20px']
                        }}
                        transition={{
                          duration: 20,
                          ease: "linear",
                          repeat: Infinity
                        }}
                      />
                    </div>
                    
                    {/* Floating video elements with improved positioning */}
                    <div className="absolute inset-0 overflow-hidden">
                      {[...Array(6)].map((_, i) => (
                        <motion.div
                          key={i}
                          className="absolute w-14 h-14 rounded-lg bg-[#6c5ce7]/20 backdrop-blur-sm border border-white/10 flex items-center justify-center"
                          style={{
                            left: `${10 + (i * 15)}%`,
                            top: `${20 + ((i % 3) * 18)}%`,
                          }}
                          animate={{
                            y: [0, -10, 0],
                            rotate: [0, i % 2 === 0 ? 5 : -5, 0],
                            scale: [1, 1.05, 1]
                          }}
                          transition={{
                            duration: 3 + i,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: i * 0.2
                          }}
                        >
                          <FontAwesomeIcon 
                            icon={[faVideo, faScissors, faMagicWandSparkles, faFileVideo, faPlay, faUpload][i]} 
                            className="text-white/70" 
                          />
                        </motion.div>
                      ))}
                    </div>
                    
                    <div className="absolute inset-0 flex items-center justify-center">
                    <motion.button
                        className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center relative z-10 overflow-hidden group"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        animate={{
                          boxShadow: ['0 0 0 0 rgba(108, 92, 231, 0)', '0 0 0 20px rgba(108, 92, 231, 0)']
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeOut"
                        }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-[#6c5ce7] to-[#a29bfe] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <FontAwesomeIcon icon={faPlay} className="text-white text-2xl ml-1 relative z-10" />
                      </motion.button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" ref={featuresRef} className="py-20" style={{ scrollMarginTop: 'var(--scroll-padding)' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <motion.h2 
                className="text-3xl font-bold mb-4"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px 0px" }}
                transition={{ duration: 0.5 }}
              >
                Powerful <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#6c5ce7] to-[#a29bfe]">Features</span>
              </motion.h2>
              <motion.p 
                className="text-base sm:text-lg text-gray-300 max-w-2xl mx-auto"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px 0px" }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                Everything you need to create engaging video content in minutes
              </motion.p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              <FeatureCard 
                icon={faVideo} 
                title="AI Video Generation" 
                description="Create professional videos from your content with intelligent AI assistance."
                delay={0}
              />
              <FeatureCard 
                icon={faScissors} 
                title="Smart Clipping" 
                description="Automatically identify and extract the most interesting parts of your videos."
                delay={0.1}
              />
              <FeatureCard 
                icon={faMagicWandSparkles} 
                title="One-Click Enhancement" 
                description="Improve video quality, audio clarity and visual appeal with AI enhancement."
                delay={0.2}
              />
              <FeatureCard 
                icon={faChartLine} 
                title="Analytics Dashboard" 
                description="Track performance metrics and viewer engagement for your video content."
                delay={0.3}
              />
              <FeatureCard 
                icon={faGlobe} 
                title="Multi-Platform Export" 
                description="Easily share your videos across all major social media platforms."
                delay={0.4}
              />
              <FeatureCard 
                icon={faRocket} 
                title="Batch Processing" 
                description="Process multiple videos simultaneously to save time and effort."
                delay={0.5}
              />
            </div>
            
            <motion.div 
              className="mt-10 text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.7 }}
            >
              <motion.button
                onClick={handleExplore}
                className="px-6 py-3 bg-[#1a1a2e]/60 border border-[#ffffff1a] rounded-xl font-medium hover:bg-[#1a1a2e] transition-all flex items-center justify-center gap-2 mx-auto text-sm"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Try All Features
                <FontAwesomeIcon icon={faArrowRight} className="text-xs" />
              </motion.button>
            </motion.div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" ref={howItWorksRef} className="py-20 bg-[#0a0a13]/50 scroll-mt-24" style={{ scrollMarginTop: 'var(--scroll-padding)' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <motion.h2 
                className="text-3xl font-bold mb-4"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px 0px" }}
                transition={{ duration: 0.5 }}
              >
                How ClipSmart <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#6c5ce7] to-[#a29bfe]">Works</span>
              </motion.h2>
              <motion.p 
                className="text-base sm:text-lg text-gray-300 max-w-2xl mx-auto"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px 0px" }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                Our simple 3-step process makes video editing faster and easier than ever before
              </motion.p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6 relative">
              {/* Connecting line between steps */}
              <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-[#6c5ce7]/30 to-[#a29bfe]/30 hidden md:block"></div>
              
              {/* Step 1 */}
              <motion.div 
                className="relative bg-[#1a1a2e]/60 backdrop-blur-md rounded-xl p-6 border border-[#ffffff1a] z-10"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 w-10 h-10 rounded-full bg-gradient-to-r from-[#6c5ce7] to-[#a29bfe] flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-purple-500/20">1</div>
                <h3 className="text-white text-lg font-semibold mt-5 mb-3 text-center">Upload Your Video</h3>
                <p className="text-gray-300 text-center text-sm">Simply upload your YouTube video or paste a link to get started. ClipSmart supports various video formats.</p>
                <div className="h-32 flex items-center justify-center mt-4">
                  <div className="w-16 h-16 bg-[#6c5ce7]/10 rounded-xl flex items-center justify-center">
                    <FontAwesomeIcon icon={faUpload} className="text-[#6c5ce7] text-xl" />
                  </div>
                </div>
              </motion.div>
              
              {/* Step 2 */}
              <motion.div 
                className="relative bg-[#1a1a2e]/60 backdrop-blur-md rounded-xl p-6 border border-[#ffffff1a] z-10"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 w-10 h-10 rounded-full bg-gradient-to-r from-[#6c5ce7] to-[#a29bfe] flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-purple-500/20">2</div>
                <h3 className="text-white text-lg font-semibold mt-5 mb-3 text-center">AI Processing</h3>
                <p className="text-gray-300 text-center text-sm">Our AI analyzes your content, identifies key moments, and prepares engaging clips based on your preferences.</p>
                <div className="h-32 flex items-center justify-center mt-4">
                  <div className="w-16 h-16 bg-[#6c5ce7]/10 rounded-xl flex items-center justify-center">
                    <FontAwesomeIcon icon={faBrain} className="text-[#6c5ce7] text-xl" />
                  </div>
                </div>
              </motion.div>
              
              {/* Step 3 */}
              <motion.div 
                className="relative bg-[#1a1a2e]/60 backdrop-blur-md rounded-xl p-6 border border-[#ffffff1a] z-10"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 w-10 h-10 rounded-full bg-gradient-to-r from-[#6c5ce7] to-[#a29bfe] flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-purple-500/20">3</div>
                <h3 className="text-white text-lg font-semibold mt-5 mb-3 text-center">Download & Share</h3>
                <p className="text-gray-300 text-center text-sm">Get your polished, professionally edited video ready for sharing across all your platforms.</p>
                <div className="h-32 flex items-center justify-center mt-4">
                  <div className="w-16 h-16 bg-[#6c5ce7]/10 rounded-xl flex items-center justify-center">
                    <FontAwesomeIcon icon={faDownload} className="text-[#6c5ce7] text-xl" />
                  </div>
                </div>
              </motion.div>
            </div>
            
            <motion.div 
              className="mt-10 text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.7 }}
            >
              <motion.button
                onClick={handleSignUp}
                className="px-6 py-3 bg-gradient-to-r from-[#6c5ce7] to-[#a29bfe] rounded-xl font-medium hover:shadow-lg hover:shadow-purple-500/20 transition-all flex items-center justify-center gap-2 mx-auto text-sm"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Start Creating Now
                <FontAwesomeIcon icon={faArrowRight} className="text-xs" />
              </motion.button>
            </motion.div>
          </div>
        </section>
        
        {/* Pricing Section with improved header and layout */}
        <section id="pricing" ref={pricingRef} className="py-20 relative z-10" style={{ scrollMarginTop: 'var(--scroll-padding)' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <motion.h2 
                className="text-3xl md:text-4xl font-bold mb-4"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                Simple, <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#6c5ce7] to-[#a29bfe]">Transparent</span> Pricing
              </motion.h2>
              <motion.p 
                className="text-gray-300 text-lg"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                Choose the plan that works for your content creation needs
              </motion.p>
              
              {/* Special Offer Banner */}
              <motion.div 
                className="mt-8 bg-gradient-to-r from-[#6c5ce7]/10 to-[#a29bfe]/10 border border-[#6c5ce7]/20 rounded-xl p-4 relative overflow-hidden backdrop-blur-sm"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <div className="absolute -right-10 -top-10 w-40 h-40 bg-[#6c5ce7]/10 rounded-full blur-xl"></div>
                <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-[#a29bfe]/10 rounded-full blur-xl"></div>
                <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#6c5ce7]/20 flex items-center justify-center text-[#a29bfe]">
                      <FontAwesomeIcon icon={faGem} className="text-sm" />
                    </div>
                    <p className="text-white font-medium">Get <span className="text-[#a29bfe]">20% off</span> any annual plan with code <span className="bg-[#6c5ce7]/20 px-2 py-0.5 rounded text-[#a29bfe] font-mono">CLIPSMART20</span></p>
                  </div>
                  <motion.button 
                    className="text-sm text-white px-4 py-2 rounded-lg bg-gradient-to-r from-[#6c5ce7] to-[#a29bfe] flex items-center gap-2 font-medium"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Claim Offer <FontAwesomeIcon icon={faArrowRight} className="text-xs" />
                  </motion.button>
                </div>
              </motion.div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <PricingCard
                title="Basic"
                price="0"
                icon={faUser}
                features={[
                  "5 video clips per month",
                  "Up to 5 minutes per clip",
                  "720p export quality",
                  "Basic editing features",
                  "Email support"
                ]}
              />
              
              <PricingCard
                title="Pro"
                price="29"
                icon={faCrown}
                features={[
                  "30 video clips per month",
                  "Up to 15 minutes per clip",
                  "1080p export quality",
                  "Advanced editing features",
                  "Priority email support",
                  "Custom branding",
                  "Analytics dashboard"
                ]}
                recommended={true}
              />
              
              <PricingCard
                title="Enterprise"
                price="99"
                icon={faRocket}
                features={[
                  "Unlimited video clips",
                  "Unlimited clip duration",
                  "4K export quality",
                  "All advanced features",
                  "Priority 24/7 support",
                  "Custom branding",
                  "Team collaboration",
                  "API access",
                  "Dedicated account manager"
                ]}
              />
            </div>
            
            {/* Money-back Guarantee */}
            <motion.div 
              className="mt-12 text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <div className="inline-flex items-center gap-2 text-gray-300">
                <FontAwesomeIcon icon={faShield} className="text-[#6c5ce7]" />
                <span>14-day money-back guarantee. No questions asked.</span>
              </div>
            </motion.div>
          </div>
        </section>
        
        {/* Testimonials Section */}
        <section id="testimonials" ref={testimonialsRef} className="py-20 bg-[#0a0a13]/50" style={{ scrollMarginTop: 'var(--scroll-padding)' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <motion.h2 
                className="text-3xl font-bold mb-4"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px 0px" }}
                transition={{ duration: 0.5 }}
              >
                What Our <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#6c5ce7] to-[#a29bfe]">Users Say</span>
              </motion.h2>
              <motion.p 
                className="text-base sm:text-lg text-gray-300 max-w-2xl mx-auto"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px 0px" }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                Join hundreds of content creators who've transformed their video creation process
              </motion.p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              <TestimonialCard 
                name="Alex Johnson"
                role="Content Creator"
                company="TechReview"
                image="https://randomuser.me/api/portraits/men/32.jpg"
                quote="ClipSmart AI has cut my editing time by 80%. I can now focus on creating more content rather than spending hours editing. It's been a game-changer for my YouTube channel."
              />
              
              <TestimonialCard 
                name="Sarah Williams"
                role="Marketing Director"
                company="InnovateX"
                image="https://randomuser.me/api/portraits/women/44.jpg"
                quote="The AI-generated clips are surprisingly good at capturing the essence of our longer videos. We've seen a 40% increase in engagement since using ClipSmart for our social media content."
              />
              
              <TestimonialCard 
                name="Michael Chen"
                role="Educational Content Creator"
                company="LearnFast Academy"
                image="https://randomuser.me/api/portraits/men/67.jpg"
                quote="As someone who creates educational content, ClipSmart has helped me break down complex topics into digestible clips. My students love the shorter, focused videos."
              />
            </div>
          </div>
        </section>
        
        {/* FAQ Section with improved styling and spacing */}
        <section id="faq" ref={faqRef} className="py-20" style={{ scrollMarginTop: 'var(--scroll-padding)' }}>
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <motion.h2 
                className="text-3xl font-bold mb-4"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px 0px" }}
                transition={{ duration: 0.5 }}
              >
                Frequently Asked <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#6c5ce7] to-[#a29bfe]">Questions</span>
              </motion.h2>
              <motion.p 
                className="text-base sm:text-lg text-gray-300 max-w-2xl mx-auto"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px 0px" }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                Everything you need to know about ClipSmart
              </motion.p>
            </div>
            
            <motion.div 
              className="bg-[#1a1a2e]/50 backdrop-blur-md rounded-xl border border-[#ffffff1a] divide-y divide-[#ffffff1a] overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              {faqs.map((faq, index) => (
                <FAQItem
                  key={index}
                  question={faq.question}
                  answer={faq.answer}
                  isOpen={openFAQ === index}
                  onClick={() => setOpenFAQ(openFAQ === index ? null : index)}
                />
              ))}
            </motion.div>
            
            <motion.div 
              className="mt-10 bg-gradient-to-br from-[#1a1a2e]/80 to-[#2d2d3d]/80 backdrop-blur-md rounded-xl p-6 border border-[#ffffff1a] text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <h3 className="text-lg font-semibold mb-2">Still have questions?</h3>
              <p className="text-gray-300 mb-4 text-sm">Get in touch with our support team for more information</p>
              <motion.button
                onClick={handleContactUs}
                className="px-5 py-2.5 bg-gradient-to-r from-[#6c5ce7] to-[#a29bfe] rounded-xl font-medium hover:shadow-lg hover:shadow-purple-500/20 transition-all text-sm inline-flex items-center gap-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Contact Support
                <FontAwesomeIcon icon={faEnvelope} className="text-xs" />
              </motion.button>
            </motion.div>
          </div>
        </section>
        
        {/* CTA Section */}
        <section className="py-24 bg-gradient-to-br from-[#1a1a2e] to-[#0a0a13] relative overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-[#6c5ce7]/5 backdrop-blur-3xl"></div>
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#6c5ce7]/10 rounded-full filter blur-3xl"></div>
            <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-[#a29bfe]/10 rounded-full filter blur-3xl"></div>
          </div>
          
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
            <motion.h2 
              className="text-4xl sm:text-5xl font-bold mb-8"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              Ready to <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#6c5ce7] to-[#a29bfe]">transform</span> your video content?
            </motion.h2>
            
            <motion.p 
              className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              Join thousands of content creators who are saving time and creating better videos with ClipSmart AI.
            </motion.p>
            
            <motion.div 
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              >
                <motion.button
                  onClick={handleSignUp}
                className="px-8 py-4 bg-gradient-to-r from-[#6c5ce7] to-[#a29bfe] rounded-xl font-medium hover:shadow-lg hover:shadow-purple-500/20 transition-all flex items-center justify-center gap-2 w-full sm:w-auto"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Get Started Free
                <FontAwesomeIcon icon={faArrowRight} />
                </motion.button>
              
                <motion.button
                onClick={handleSignIn}
                className="px-8 py-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl font-medium hover:bg-white/20 transition-all w-full sm:w-auto"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                Sign In
                </motion.button>
            </motion.div>
          </div>
        </section>
        
        {/* Enhanced Footer with better organization and styling */}
        <footer className="pt-16 pb-8 bg-[#0a0a13]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              {/* Company Info */}
              <div>
                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 bg-gradient-to-r from-[#6c5ce7] to-[#a29bfe] rounded-lg flex items-center justify-center mr-2">
                    <FontAwesomeIcon icon={faFilm} className="text-white text-sm" />
                  </div>
                  <h3 className="text-lg font-bold text-white">ClipSmart<span className="text-[#6c5ce7]">AI</span></h3>
                </div>
                <p className="text-gray-400 text-sm mb-4">Transform long videos into engaging short clips with AI-powered technology.</p>
                <div className="flex space-x-3">
                  <a href="https://twitter.com/clipsmartai" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-[#1a1a2e] flex items-center justify-center text-gray-400 hover:bg-[#6c5ce7] hover:text-white transition-all">
                    <FontAwesomeIcon icon={faTwitter} className="text-sm" />
                  </a>
                  <a href="https://facebook.com/clipsmartai" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-[#1a1a2e] flex items-center justify-center text-gray-400 hover:bg-[#6c5ce7] hover:text-white transition-all">
                    <FontAwesomeIcon icon={faFacebookF} className="text-sm" />
                  </a>
                  <a href="https://instagram.com/clipsmartai" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-[#1a1a2e] flex items-center justify-center text-gray-400 hover:bg-[#6c5ce7] hover:text-white transition-all">
                    <FontAwesomeIcon icon={faInstagram} className="text-sm" />
                  </a>
                  <a href="https://linkedin.com/company/clipsmartai" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-[#1a1a2e] flex items-center justify-center text-gray-400 hover:bg-[#6c5ce7] hover:text-white transition-all">
                    <FontAwesomeIcon icon={faLinkedinIn} className="text-sm" />
                  </a>
                </div>
              </div>
              
              {/* Legal */}
              <div>
                <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Legal</h3>
                <ul className="space-y-2">
                  <li>
                    <a 
                      href="/terms" 
                      onClick={(e) => {
                        e.preventDefault();
                        handleTerms();
                      }}
                      className="text-gray-400 hover:text-[#a29bfe] transition-colors text-sm"
                    >
                      Terms of Service
                    </a>
                  </li>
                  <li>
                    <a 
                      href="/privacy" 
                      onClick={(e) => {
                        e.preventDefault();
                        handlePrivacy();
                      }}
                      className="text-gray-400 hover:text-[#a29bfe] transition-colors text-sm"
                    >
                      Privacy Policy
                    </a>
                  </li>
                  <li>
                   
                  </li>
                  <li>
                    
                  </li>
                </ul>
              </div>
              
              {/* Contact */}
              <div>
                <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Contact Us</h3>
                <p className="text-gray-400 text-sm mb-4">Have questions or need support?</p>
                <motion.button
                  onClick={handleContactUs}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#6c5ce7] to-[#a29bfe] text-white text-sm font-medium inline-flex items-center gap-2"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Contact Support
                  <FontAwesomeIcon icon={faEnvelope} className="text-xs" />
                </motion.button>
              </div>
            </div>
            
            {/* Bottom Bar */}
            <div className="pt-8 border-t border-[#ffffff1a] flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-500 text-xs">© {new Date().getFullYear()} ClipSmart AI. All rights reserved.</p>
              <div className="mt-4 md:mt-0 flex items-center space-x-4">
                <a href="/terms" onClick={(e) => { e.preventDefault(); handleTerms(); }} className="text-gray-500 hover:text-gray-400 transition-colors text-xs">Terms</a>
                <span className="text-gray-700">•</span>
                <a href="/privacy" onClick={(e) => { e.preventDefault(); handlePrivacy(); }} className="text-gray-500 hover:text-gray-400 transition-colors text-xs">Privacy</a>
                <span className="text-gray-700">•</span>
                <a href="/cookies" onClick={(e) => { e.preventDefault(); handleCookiePolicy(); }} className="text-gray-500 hover:text-gray-400 transition-colors text-xs">Cookies</a>
              </div>
            </div>
          </div>
        </footer>

        {/* Custom animations */}
        <style jsx="true">{`
          @keyframes gridMove {
            0% { background-position: 0px 0px; }
            100% { background-position: 40px 40px; }
          }
          
          @keyframes pulse-slow {
            0%, 100% { opacity: 0.4; }
            50% { opacity: 0.6; }
          }
          
          @keyframes pulse-slower {
            0%, 100% { opacity: 0.3; }
            50% { opacity: 0.5; }
          }
          
          .bg-scanline {
            background-image: linear-gradient(
              to bottom,
              transparent 50%,
              rgba(0, 0, 0, 0.05) 50%
            );
            background-size: 100% 4px;
          }
          
          .stars-small {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-image: radial-gradient(1px 1px at 20px 30px, white, rgba(0, 0, 0, 0)),
                            radial-gradient(1px 1px at 40px 70px, white, rgba(0, 0, 0, 0)),
                            radial-gradient(1px 1px at 50px 160px, white, rgba(0, 0, 0, 0)),
                            radial-gradient(1px 1px at 90px 40px, white, rgba(0, 0, 0, 0));
            background-repeat: repeat;
            background-size: 200px 200px;
            opacity: 0.2;
            animation: twinkle 7s ease-in-out infinite alternate;
          }
          
          .stars-medium {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-image: radial-gradient(1.5px 1.5px at 150px 150px, white, rgba(0, 0, 0, 0)),
                            radial-gradient(1.5px 1.5px at 200px 220px, white, rgba(0, 0, 0, 0)),
                            radial-gradient(1.5px 1.5px at 300px 300px, white, rgba(0, 0, 0, 0));
            background-repeat: repeat;
            background-size: 500px 500px;
            opacity: 0.2;
            animation: twinkle 5s ease-in-out infinite alternate;
          }
          
          .stars-large {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-image: radial-gradient(2px 2px at 300px 300px, white, rgba(0, 0, 0, 0)),
                            radial-gradient(2px 2px at 400px 400px, white, rgba(0, 0, 0, 0)),
                            radial-gradient(2px 2px at 500px 500px, white, rgba(0, 0, 0, 0));
            background-repeat: repeat;
            background-size: 800px 800px;
            opacity: 0.2;
            animation: twinkle 10s ease-in-out infinite alternate;
          }
          
          @keyframes twinkle {
            0%, 100% { opacity: 0.2; }
            50% { opacity: 0.3; }
          }
        `}</style>
      </main>
      
      {/* Scroll to top button */}
      <motion.button
        onClick={scrollToTop}
        className="fixed bottom-6 right-6 w-12 h-12 rounded-full bg-gradient-to-r from-[#6c5ce7] to-[#a29bfe] text-white flex items-center justify-center shadow-lg shadow-purple-500/20 z-50"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ 
          opacity: showScrollTop ? 1 : 0,
          scale: showScrollTop ? 1 : 0.5,
          y: showScrollTop ? 0 : 20
        }}
        transition={{ duration: 0.3 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <FontAwesomeIcon icon={faArrowUp} />
      </motion.button>
    </div>
  );
};

export default LandingPage; 