import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const Home = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);

  useEffect(() => {
    // Load spline viewer
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/@splinetool/viewer@1.9.75/build/spline-viewer.js';
    script.type = 'module';
    script.onload = () => setIsLoaded(true);
    document.head.appendChild(script);
    
    // Feature rotation interval
    const interval = setInterval(() => {
      setActiveFeature(prev => (prev + 1) % 3);
    }, 5000);
    
    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
      clearInterval(interval);
    };
  }, []);

  // Company logos with actual images
  const companies = [
    {name: 'Microsoft', logo: 'https://cdn.worldvectorlogo.com/logos/microsoft-5.svg'},
    {name: 'Google', logo: 'https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg'},
    {name: 'Amazon', logo: 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg'},
    {name: 'Meta', logo: 'https://upload.wikimedia.org/wikipedia/commons/7/7b/Meta_Platforms_Inc._logo.svg'},
    {name: 'Apple', logo: 'https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg'}
  ];
  
  // Feature showcase data
  const features = [
    {
      title: "Intuitive Task Management",
      description: "Organize tasks with our drag-and-drop interface. Create boards, lists, and cards to manage your workflow efficiently.",
      image: "https://daisyui.com/images/stock/photo-1606107557195-0e29a4b5b4aa.jpg",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      )
    },
    {
      title: "Real-time Collaboration",
      description: "Work together with your team in real time. See changes instantly, comment on tasks, and share files effortlessly.",
      image: "https://daisyui.com/images/stock/photo-1606107557195-0e29a4b5b4aa.jpg",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    },
    {
      title: "Powerful Analytics",
      description: "Gain insights into your team's performance with customizable dashboards and detailed reports.",
      image: "https://daisyui.com/images/stock/photo-1606107557195-0e29a4b5b4aa.jpg",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black font-poppins overflow-x-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute w-[800px] h-[800px] rounded-full bg-gradient-to-r from-primary/20 to-purple-500/10 blur-[120px] -top-[400px] -right-[200px]"></div>
        <div className="absolute w-[800px] h-[800px] rounded-full bg-gradient-to-r from-blue-500/20 to-indigo-500/10 blur-[120px] -bottom-[400px] -left-[200px]"></div>
        
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ 
              x: Math.random() * window.innerWidth, 
              y: Math.random() * window.innerHeight,
              opacity: Math.random() * 0.5 + 0.1
            }}
            animate={{
              y: [
                Math.random() * window.innerHeight,
                Math.random() * window.innerHeight
              ],
              x: [
                Math.random() * window.innerWidth,
                Math.random() * window.innerWidth
              ]
            }}
            transition={{ 
              repeat: Infinity, 
              repeatType: "reverse",
              duration: Math.random() * 20 + 10, 
              ease: "easeInOut" 
            }}
            className={`absolute w-${Math.floor(Math.random() * 3) + 1} h-${Math.floor(Math.random() * 3) + 1} 
              bg-white/30 rounded-full blur-sm`}
            style={{
              width: `${Math.random() * 6 + 2}px`, 
              height: `${Math.random() * 6 + 2}px`
            }}
          ></motion.div>
        ))}
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-8 py-8 relative z-10">
        {/* Header/Navigation */}
        <motion.header 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="flex justify-between items-center mb-12 backdrop-blur-sm bg-black/10 p-4 rounded-2xl"
        >
          <motion.div 
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
            className="flex items-center gap-3"
          >
            <div className="w-12 h-12 relative overflow-hidden">
              <motion.div 
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 bg-primary rounded-lg rotate-45 origin-center"
              ></motion.div>
              <motion.div 
                animate={{ rotate: [0, -360] }}
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 bg-info rounded-lg rotate-90 origin-center opacity-60"
              ></motion.div>
              <span className="absolute inset-0 flex items-center justify-center font-bold text-white text-xl">P</span>
            </div>
            <span className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600">PlaniFy</span>
          </motion.div>
          
          <motion.nav 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="hidden lg:flex items-center gap-8"
          >
            {["Features", "Pricing", "About", "Blog"].map((item, index) => (
              <motion.div
                key={item}
                whileHover={{ scale: 1.1, color: "#60a5fa" }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <Link 
                  to={`/${item.toLowerCase()}`} 
                  className="text-white/80 hover:text-primary transition-colors relative group"
                >
                  {item}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
                </Link>
              </motion.div>
            ))}
          </motion.nav>
          
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex items-center gap-4"
          >
            <Link to="/login" className="btn btn-ghost text-white/90 hover:bg-white/10 transition-all duration-300">Sign In</Link>
            <Link to="/register" className="btn btn-primary relative overflow-hidden group">
              <span className="relative z-10">Get Started</span>
              <span className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 group-hover:opacity-0 transition-opacity duration-300"></span>
              <span className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
            </Link>
          </motion.div>
        </motion.header>

        {/* Hero Section with 3D Split Layout */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-16 mt-12 mb-32">
          {/* Text Content */}
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center lg:text-left lg:w-1/2 space-y-8"
          >
            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.8 }}
              >
                <span className="px-4 py-1.5 text-xs font-semibold bg-primary/20 text-primary rounded-full">
                  #1 PROJECT MANAGEMENT PLATFORM
                </span>
              </motion.div>
              
              <motion.h1 
                className="text-5xl lg:text-6xl font-bold leading-tight"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.8 }}
              >
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-blue-500 to-purple-500">
                  Transform Your Workflow with PlaniFy
                </span>
              </motion.h1>
              
              <motion.p 
                className="text-xl text-white/80 leading-relaxed max-w-lg"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.8 }}
              >
                The all-in-one workspace for modern teams to plan, track, and deliver exceptional projects with unparalleled clarity.
              </motion.p>
            </div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="flex flex-wrap gap-5 justify-center lg:justify-start"
            >
              {/* Animated primary CTA button */}
              <div className="relative group">
                <Link
                  to="/register"
                  className="relative inline-flex items-center p-px font-semibold text-white bg-gray-800 shadow-2xl cursor-pointer rounded-xl shadow-zinc-900 transition-transform duration-300 ease-in-out hover:scale-105 active:scale-95"
                >
                  <motion.span
                    className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary via-blue-500 to-purple-500 p-[2px]"
                    animate={{ 
                      background: [
                        'linear-gradient(90deg, rgb(56, 189, 248), rgb(59, 130, 246), rgb(168, 85, 247))',
                        'linear-gradient(90deg, rgb(168, 85, 247), rgb(56, 189, 248), rgb(59, 130, 246))',
                        'linear-gradient(90deg, rgb(59, 130, 246), rgb(168, 85, 247), rgb(56, 189, 248))'
                      ]
                    }}
                    transition={{ duration: 6, repeat: Infinity }}
                  ></motion.span>

                  <span className="relative z-10 block px-8 py-3.5 rounded-xl bg-gray-950">
                    <div className="relative z-10 flex items-center space-x-2">
                      <span className="text-md">Start Your Free Trial</span>
                      <svg
                        className="w-6 h-6 transition-transform duration-500 group-hover:translate-x-1"
                        data-slot="icon"
                        aria-hidden="true"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          clipRule="evenodd"
                          d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z"
                          fillRule="evenodd"
                        ></path>
                      </svg>
                    </div>
                  </span>
                </Link>
              </div>
              
              <Link to="/demo" className="btn btn-outline btn-lg border-white/30 hover:border-white/50 text-white/90 hover:bg-white/5">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 mr-2">
                  <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm14.024-.983a1.125 1.125 0 010 1.966l-5.603 3.113A1.125 1.125 0 019 15.113V8.887c0-.857.921-1.4 1.671-.983l5.603 3.113z" clipRule="evenodd" />
                </svg>
                Watch Demo
              </Link>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="flex flex-wrap justify-center lg:justify-start gap-8 pt-4"
            >
              <div className="flex items-center gap-2">
                <div className="avatar-group -space-x-3">
                  {[1, 2, 3, 4, 5].map(num => (
                    <div key={num} className="avatar">
                      <div className="w-10 h-10 rounded-full ring-2 ring-primary ring-offset-base-100 ring-offset-2 transition-all hover:scale-110">
                        <img src={`https://i.pravatar.cc/150?img=${num + 10}`} alt={`User ${num}`} />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="bg-white/10 backdrop-blur-md px-3 py-1 rounded-full">
                  <p className="text-sm text-white">Join <span className="text-primary font-semibold">10,000+</span> teams</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full">
                <div className="rating rating-sm">
                  {[1, 2, 3, 4, 5].map(star => (
                    <input key={star} type="radio" name="rating-2" className="mask mask-star-2 bg-orange-400" checked={star === 5} readOnly />
                  ))}
                </div>
                <p className="text-sm text-white">4.9/5 <span className="text-primary font-medium">(2.5k+ reviews)</span></p>
              </div>
            </motion.div>
          </motion.div>
          
          {/* 3D Robot Element with Enhanced Visual */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="card flex-shrink-0 w-full lg:w-5/12 overflow-hidden relative"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-blue-500/5 backdrop-blur-lg z-0 rounded-3xl"></div>
            
            {/* Animated Card Elements */}
            <motion.div 
              className="absolute top-6 left-6 w-20 h-20 bg-gradient-to-br from-primary/30 to-blue-800/20 rounded-2xl z-20"
              animate={{ 
                rotate: [0, 10, 0, -10, 0],
                y: [0, -10, 0]
              }}
              transition={{ 
                duration: 10, 
                repeat: Infinity,
                ease: "easeInOut" 
              }}
            ></motion.div>
            
            <motion.div 
              className="absolute bottom-10 right-8 w-16 h-16 bg-gradient-to-br from-purple-500/30 to-indigo-800/20 rounded-full z-20"
              animate={{ 
                rotate: [0, -15, 0, 15, 0],
                x: [0, 15, 0, -15, 0]
              }}
              transition={{ 
                duration: 12, 
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1
              }}
            ></motion.div>
            
            {/* Grid Lighting Effect */}
            <div className="absolute inset-0 z-0">
              <div className="absolute inset-0 grid-bg"></div>
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
              <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-transparent"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-black via-transparent to-transparent"></div>
              <div className="absolute inset-0 bg-gradient-to-l from-black via-transparent to-transparent"></div>
            </div>
            
            {/* Glow Effect */}
            <div className="absolute -top-20 -left-20 w-40 h-40 bg-primary/30 rounded-full filter blur-[80px]"></div>
            <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-blue-600/30 rounded-full filter blur-[80px]"></div>
            
            {/* Border Glow */}
            <div className="absolute inset-0 rounded-3xl border border-white/10 z-30"></div>
            
            {/* 3D Model */}
            <div className="relative w-full h-[480px] z-10">
              <spline-viewer 
                url="https://prod.spline.design/XhyPUX6Ry15iBDlG/scene.splinecode"
                style={{ width: '100%', height: '100%' }}
                suppressHydrationWarning
              />
            </div>
            
            {/* Floating Elements */}
            <motion.div
              animate={{
                y: [-5, 5, -5],
                rotate: [0, 5, 0]
              }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              className="absolute -top-8 -right-4 w-16 h-16 bg-yellow-400/20 rounded-full shadow-lg blur-sm z-20"
            ></motion.div>
            
            <motion.div
              animate={{
                y: [3, -3, 3],
                rotate: [0, -5, 0]
              }}
              transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut" }}
              className="absolute -bottom-4 -left-4 w-12 h-12 bg-blue-400/20 rounded-full shadow-lg blur-sm z-20"
            ></motion.div>
          </motion.div>
        </div>

        {/* Trusted By Section - with Real Logo Styling */}
        <motion.div
  initial={{ opacity: 0, y: 40 }}
  whileInView={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.7 }}
  viewport={{ once: true }}
  className="my-24 bg-gradient-to-r from-gray-900/50 via-black/70 to-gray-900/50 backdrop-blur-lg py-12 px-10 rounded-3xl border border-white/5"
>
  <p className="text-center text-white/50 text-sm uppercase tracking-widest mb-10 font-semibold">Trusted by leading companies worldwide</p>
  <div className="flex flex-wrap justify-center items-center gap-12 lg:gap-16">
    {companies.map((company, idx) => (
      <motion.div 
        key={idx}
        whileHover={{ scale: 1.1 }}
        transition={{ type: "spring", stiffness: 400, damping: 10 }}
        className="relative h-12 w-32 flex items-center justify-center"
      >
        <img 
          src={company.logo} 
          alt={company.name}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = `https://via.placeholder.com/120x40/232323/FFFFFF?text=${company.name}`;
          }}
          className="max-h-12 max-w-[120px] object-contain brightness-75 grayscale hover:brightness-100 hover:grayscale-0 transition-all duration-300"
        />
      </motion.div>
    ))}
  </div>
</motion.div>

        {/* Interactive Feature Showcase */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="py-24"
        >
          <div className="text-center mb-20">
            <motion.span 
              className="px-4 py-1.5 text-xs font-semibold bg-primary/20 text-primary rounded-full"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              viewport={{ once: true }}
            >
              POWERFUL & INTUITIVE
            </motion.span>
            
            <motion.h2 
              className="text-4xl lg:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600 mt-4 mb-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              viewport={{ once: true }}
            >
              Everything You Need for Project Success
            </motion.h2>
            
            <motion.p 
              className="text-xl text-white/70 max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              viewport={{ once: true }}
            >
              Simplify your workflow, enhance team collaboration, and achieve more with our comprehensive suite of tools.
            </motion.p>
          </div>
          
          {/* Feature Tabs */}
          <div className="flex flex-col lg:flex-row gap-12 items-center">
            <div className="w-full lg:w-1/2">
              <div className="flex justify-between mb-8">
                {features.map((feature, idx) => (
                  <motion.button
                    key={idx}
                    className={`px-4 py-2 rounded-lg transition-all duration-300 text-lg font-medium ${activeFeature === idx ? 'bg-primary/20 text-primary' : 'text-white/50 hover:text-white/70'}`}
                    onClick={() => setActiveFeature(idx)}
                    whileHover={{ scale: 1.05 }}
                  >
                    {feature.title.split(' ')[0]}
                  </motion.button>
                ))}
              </div>
              
              {/* Feature Content */}
              <div className="relative h-[320px] overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeFeature}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.5 }}
                    className="absolute inset-0"
                  >
                    <div className="bg-gradient-to-br from-gray-900/70 to-gray-800/30 backdrop-blur-sm p-8 rounded-3xl border border-white/5">
                      <div className="p-4 bg-primary/10 inline-block rounded-2xl text-primary mb-6">
                        {features[activeFeature].icon}
                      </div>
                      <h3 className="text-2xl lg:text-3xl font-bold text-white mb-4">{features[activeFeature].title}</h3>
                      <p className="text-xl text-white/70 mb-6">{features[activeFeature].description}</p>
                      <Link to="/features" className="flex items-center text-primary font-medium hover:underline">
                        Learn more
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 ml-1">
                          <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
                        </svg>
                      </Link>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
            
            <motion.div 
              className="w-full lg:w-1/2 relative"
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <div className="mockup-browser border border-white/10 bg-base-300/20 shadow-2xl backdrop-blur-md">
                <div className="mockup-browser-toolbar px-4">
                  <div className="flex space-x-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  </div>
                  <div className="px-2 py-1 rounded bg-white/10 text-white/60 text-xs font-mono">
                    app.planify.io
                  </div>
                </div>
                <div className="p-4 bg-gradient-to-br from-gray-900 to-gray-800">
                  <div className="grid grid-cols-4 gap-2">
                    <div className="col-span-1 space-y-2">
                      {["Dashboard", "Projects", "Tasks", "Calendar", "Reports"].map((item, i) => (
                        <div key={i} className={`p-2 rounded ${i === activeFeature ? 'bg-primary/20 text-primary' : 'bg-white/5'} text-sm`}>{item}</div>
                      ))}
                    </div>
                    <div className="col-span-3 bg-white/5 rounded-lg p-4">
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={activeFeature}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.5 }}
                        >
                          {activeFeature === 0 && (
                            <div className="space-y-3">
                              <div className="flex justify-between">
                                <div className="h-6 bg-white/10 w-1/3 rounded"></div>
                                <div className="h-6 bg-primary/30 w-1/4 rounded"></div>
                              </div>
                              {[...Array(5)].map((_, i) => (
                                <div key={i} className="h-12 bg-white/5 rounded-lg flex justify-between items-center px-4">
                                  <div className="h-4 bg-white/10 w-1/3 rounded"></div>
                                  <div className="h-6 bg-green-500/20 w-1/6 rounded-full"></div>
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {activeFeature === 1 && (
                            <div className="grid grid-cols-2 gap-4">
                              {[...Array(4)].map((_, i) => (
                                <div key={i} className="h-24 bg-white/5 rounded-lg p-3">
                                  <div className="flex items-center gap-2 mb-2">
                                    <div className="h-6 w-6 rounded-full bg-blue-500/20"></div>
                                    <div className="h-4 bg-white/10 w-3/4 rounded"></div>
                                  </div>
                                  <div className="h-3 bg-white/10 w-full rounded mb-2"></div>
                                  <div className="h-3 bg-white/10 w-2/3 rounded"></div>
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {activeFeature === 2 && (
                            <div>
                              <div className="flex mb-4">
                                <div className="h-40 bg-white/5 rounded-lg w-1/2 mr-2 p-3">
                                  <div className="h-4 bg-white/10 w-1/2 rounded mb-2"></div>
                                  <div className="h-28 bg-gradient-to-b from-primary/30 to-blue-500/30 rounded"></div>
                                </div>
                                <div className="h-40 bg-white/5 rounded-lg w-1/2 ml-2 p-3">
                                  <div className="h-4 bg-white/10 w-1/2 rounded mb-2"></div>
                                  <div className="h-28 bg-gradient-to-b from-purple-500/30 to-pink-500/30 rounded"></div>
                                </div>
                              </div>
                              <div className="h-16 bg-white/5 rounded-lg p-3 flex justify-between">
                                <div className="h-3 bg-white/10 w-1/5 rounded"></div>
                                <div className="h-3 bg-white/10 w-1/5 rounded"></div>
                                <div className="h-3 bg-white/10 w-1/5 rounded"></div>
                                <div className="h-3 bg-white/10 w-1/5 rounded"></div>
                              </div>
                            </div>
                          )}
                        </motion.div>
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Decorative elements */}
              <motion.div
                animate={{
                  y: [-8, 8, -8],
                  rotate: [0, 5, 0]
                }}
                transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
                className="absolute -top-6 -right-6 w-20 h-20 bg-primary/10 rounded-full blur-xl z-0"
              ></motion.div>
              
              <motion.div
                animate={{
                  y: [5, -5, 5],
                  rotate: [0, -5, 0]
                }}
                transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
                className="absolute -bottom-8 -left-8 w-24 h-24 bg-blue-500/10 rounded-full blur-xl z-0"
              ></motion.div>
            </motion.div>
          </div>
        </motion.div>
        
        {/* CTA Section with Enhanced Visuals */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
          className="py-24"
        >
          <div className="relative overflow-hidden rounded-3xl shadow-2xl">
            {/* Background gradient with enhanced visual appeal */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary/80 via-blue-600/80 to-purple-600/80"></div>
            
            {/* Mesh gradient overlay */}
            <div className="absolute inset-0 opacity-60">
              <div className="absolute top-0 right-0 w-2/3 h-full bg-gradient-to-l from-white/10 to-transparent"></div>
              <div className="absolute top-0 left-0 w-2/3 h-full bg-gradient-to-r from-white/5 to-transparent"></div>
              <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black/20 to-transparent"></div>
            </div>
            
            {/* Animated particles */}
            {[...Array(15)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full bg-white/20"
                style={{
                  width: Math.random() * 120 + 20,
                  height: Math.random() * 120 + 20,
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                  opacity: Math.random() * 0.4
                }}
                animate={{
                  y: [Math.random() * 40 - 20, Math.random() * 40 - 20],
                  x: [Math.random() * 40 - 20, Math.random() * 40 - 20],
                  opacity: [Math.random() * 0.3, Math.random() * 0.15, Math.random() * 0.3]
                }}
                transition={{
                  repeat: Infinity,
                  repeatType: "reverse",
                  duration: Math.random() * 8 + 5,
                  ease: "easeInOut"
                }}
              ></motion.div>
            ))}
            
            {/* Content */}
            <div className="relative z-10 py-20 px-8 lg:px-16 backdrop-blur-sm">
              <div className="max-w-5xl mx-auto text-center">
                <motion.h2 
                  className="text-4xl lg:text-5xl font-bold text-white mb-6"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  viewport={{ once: true }}
                >
                  Ready to Revolutionize Your Workflow?
                </motion.h2>
                
                <motion.p 
                  className="text-xl text-white/90 mb-10 max-w-3xl mx-auto"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  viewport={{ once: true }}
                >
                  Join thousands of teams who are using PlaniFy to streamline their projects, boost productivity, and achieve better results.
                </motion.p>
                
                <motion.div 
                  className="flex flex-wrap justify-center gap-5"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  viewport={{ once: true }}
                >
                  <Link to="/register" className="btn btn-lg bg-white text-primary hover:bg-white/90 shadow-lg shadow-black/20">
                    Start Your Free 14-Day Trial
                  </Link>
                  <Link to="/demo" className="btn btn-lg btn-ghost text-white border-white/40 hover:border-white/60 hover:bg-white/10">
                    Schedule a Demo
                  </Link>
                </motion.div>
                
                <motion.div 
                  className="mt-8 text-white/80 text-sm flex justify-center items-center"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  viewport={{ once: true }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                  </svg>
                  No credit card required • Cancel anytime
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Enhanced Footer with Gradient */}
      <footer className="border-t border-white/10 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-gray-900 to-black"></div>
        <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
        
        <div className="container mx-auto px-8 py-16 relative z-10">
          <div className="flex flex-col md:flex-row justify-between gap-12">
            <div className="md:w-1/3">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 relative overflow-hidden">
                  <motion.div 
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 bg-primary rounded-lg rotate-45"
                  ></motion.div>
                  <motion.div 
                    animate={{ rotate: [0, -360] }}
                    transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 bg-info rounded-lg rotate-90 opacity-60"
                  ></motion.div>
                  <span className="absolute inset-0 flex items-center justify-center font-bold text-white text-lg">P</span>
                </div>
                <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600">PlaniFy</span>
              </div>
              
              <p className="text-white/70 mb-6">
                Simplify project management and enhance team collaboration with our comprehensive platform designed for modern teams.
              </p>
              
              <div className="flex gap-4">
                {["twitter", "linkedin", "github", "facebook"].map(platform => (
                  <a 
                    key={platform} 
                    href="#" 
                    className="btn btn-circle btn-sm btn-ghost bg-white/5 hover:bg-white/10 border-none text-white/70 hover:text-white"
                  >
                    <i className={`fa-brands fa-${platform}`}></i>
                  </a>
                ))}
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-8 lg:gap-12">
              {[
                {
                  title: "Product",
                  links: ["Features", "Pricing", "Integrations", "Changelog", "Status"]
                },
                {
                  title: "Company",
                  links: ["About Us", "Blog", "Careers", "Contact", "Press Kit"]
                },
                {
                  title: "Resources",
                  links: ["Documentation", "Help Center", "API Reference", "Community", "Security"]
                }
              ].map((column, idx) => (
                <div key={idx}>
                  <h4 className="text-lg font-medium mb-5 text-primary">{column.title}</h4>
                  <ul className="space-y-3">
                    {column.links.map((link, i) => (
                      <li key={i}>
                        <Link 
                          to={`/${link.toLowerCase().replace(/\s+/g, '-')}`}
                          className="text-white/70 hover:text-white transition-colors relative inline-block group"
                        >
                          {link}
                          <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
          
          <div className="border-t border-white/10 mt-16 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-white/60">
              © {new Date().getFullYear()} PlaniFy. All rights reserved.
            </p>
            <div className="flex flex-wrap justify-center gap-6 mt-6 md:mt-0">
              <Link to="/terms" className="text-white/60 hover:text-white transition-colors">Terms of Service</Link>
              <Link to="/privacy" className="text-white/60 hover:text-white transition-colors">Privacy Policy</Link>
              <Link to="/cookies" className="text-white/60 hover:text-white transition-colors">Cookie Policy</Link>
              <div className="flex items-center gap-2">
                <select className="select select-sm bg-white/5 border-white/10 text-white/70">
                  <option>English (US)</option>
                  <option>Français</option>
                  <option>Español</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Custom CSS */}
      <style>
        {`
          @keyframes gridScroll {
            0% { background-position: 0 0; }
            100% { background-position: 0 40px; }
          }
          
          .grid-bg {
            background-image: 
              radial-gradient(circle, rgba(255, 255, 255, 0.1) 1px, transparent 1px);
            background-size: 30px 30px;
            animation: gridPulse 8s ease-in-out infinite;
          }

          @keyframes gridPulse {
            0%, 100% { opacity: 0.5; }
            50% { opacity: 0.2; }
          }

          .bg-grid-pattern {
            background-size: 50px 50px;
            background-image: 
              linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
          }
          
          .animate-grid-scroll {
            animation: gridScroll 20s linear infinite;
          }
          
          .animation-delay-300 {
            animation-delay: 0.3s;
          }
          
          .animation-delay-600 {
            animation-delay: 0.6s;
          }
        `}
      </style>

      {/* Font Awesome */}
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
    </div>
  );
};

export default Home;