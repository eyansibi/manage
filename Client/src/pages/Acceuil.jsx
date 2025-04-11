import { Link } from 'react-router-dom';
import { useEffect, useState, useRef, useCallback } from 'react';
import useSession from '../hooks/useSession';
import api from '../utils/Api';
import { toast } from 'react-hot-toast';
import NotificationSystem from '../utils/NotificationSystem';
import { motion } from 'framer-motion'; // Add framer-motion for animations

const Acceuil = () => {
  // Your existing state and refs
  const { user, loading, logout, refreshUser, isAuthenticated } = useSession();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const hasLoadedDataRef = useRef(false);
  const [showInactivityAlert, setShowInactivityAlert] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const countdownStartTimeRef = useRef(null);
  const inactivityTimerRef = useRef(null);
  const confirmTimeoutRef = useRef(null);
  const countdownIntervalRef = useRef(null);
  const [showWorkspaceModal, setShowWorkspaceModal] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [newWorkspaceDescription, setNewWorkspaceDescription] = useState('');
  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false);
  const [allWorkspaces, setAllWorkspaces] = useState([]);
  const [isLoadingWorkspaces, setIsLoadingWorkspaces] = useState(false);
  const [favoriteWorkspaces, setFavoriteWorkspaces] = useState([]);

  // New state for animations and UI effects
  const [activeTab, setActiveTab] = useState('workspaces');
  const [scrolled, setScrolled] = useState(false);
  
  // Your existing functions and effects
  // ... (keep all your original functions like handleCreateWorkspace, resetInactivityTimer, etc.)
  const toastStyles = {
    base: {
      style: {
        fontFamily: 'Poppins, sans-serif',
        padding: '16px',
        color: 'white',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        maxWidth: '400px',
        marginBottom: '1rem',
        transition: 'all 0.3s ease',
        animation: 'toast-slide-in 0.5s ease forwards'
      },
      icon: {
        fontSize: '20px',
        marginRight: '8px'
      },
      duration: 3000,
    },
    success: {
      style: {
        background: 'linear-gradient(to right, #4ade80, #22c55e)',
        borderLeft: '5px solid #16a34a',
      },
      icon: '✓'
    },
    error: {
      style: {
        background: 'linear-gradient(to right, #f87171, #ef4444)',
        borderLeft: '5px solid #dc2626',
      },
      icon: '✕'
    },
    loading: {
      style: {
        background: 'linear-gradient(to right, #38bdf8, #3b82f6)',
        borderLeft: '5px solid #2563eb',
      },
      icon: '⟳'
    },
    warning: {
      style: {
        background: 'linear-gradient(to right, #fbbf24, #f59e0b)',
        borderLeft: '5px solid #d97706',
      },
      icon: '!'
    }
  };
   
   const handleCreateWorkspace = async (e) => {
     e.preventDefault();
     setIsCreatingWorkspace(true);
   
     try {
       // 1. Create the workspace
       const workspaceResponse = await api.post('/api/workspaces/addWorkspace', {
         name: newWorkspaceName,
         description: newWorkspaceDescription,
         owner: user._id
       });
       
       const newWorkspace = workspaceResponse.data;
       
       // 2. Update the user
       await api.patch(`/api/users/${user._id}/add-workspace`, {
         workspaceId: newWorkspace._id
       });
       
       // 3. Force a full refresh of user data
       await refreshUser();
       setAllWorkspaces(prevWorkspaces => [newWorkspace, ...prevWorkspaces]);

   
       // 4. Show success message
       showToast('Workspace created successfully!', 'success');
       
       // 5. Reset form and close modal instead of navigating
       setNewWorkspaceName('');
       setNewWorkspaceDescription('');
       setShowWorkspaceModal(false);
       
     } catch (err) {
       console.error("Workspace creation error:", err);
       toast.error(err.response?.data?.error || 'Failed to create workspace');
     } finally {
       setIsCreatingWorkspace(false);
     }
   };
  
   const startCountdown = () => {
    countdownStartTimeRef.current = Date.now();
    const duration = 60 * 1000;
    countdownIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - countdownStartTimeRef.current;
      const remainingSeconds = Math.max(0, Math.ceil((duration - elapsed) / 1000));
      setCountdown(remainingSeconds);
      if (remainingSeconds <= 0) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
        console.log("Countdown finished. Logging out...");
        logout();
      }
    }, 1000);
  };

  const resetInactivityTimer = () => {
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    if (!showInactivityAlert && confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current);

    inactivityTimerRef.current = setTimeout(() => {
      setShowInactivityAlert(true);
      setCountdown(60);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      startCountdown();
      confirmTimeoutRef.current = setTimeout(() => {
        console.log("Backup timeout triggered. Logging out.");
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
        logout();
      }, 61000);
    }, 1800000);
  };

  const staySignedIn = () => {
    setShowInactivityAlert(false);
    if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    resetInactivityTimer();
  };

  useEffect(() => {
    const loadUserData = async () => {
      if (hasLoadedDataRef.current) return;
      setIsRefreshing(true);
      try {
        await refreshUser();
        fetchAllAccessibleWorkspaces();
        hasLoadedDataRef.current = true;
      } catch (error) {
        console.error("Failed to refresh user data:", error);
      } finally {
        setIsRefreshing(false);
      }
    };

    if (isAuthenticated && !hasLoadedDataRef.current) {
      loadUserData();
    }

    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    const handleUserActivity = () => {
      if (!showInactivityAlert) resetInactivityTimer();
    };

    activityEvents.forEach(event => window.addEventListener(event, handleUserActivity));
    resetInactivityTimer();

    return () => {
      activityEvents.forEach(event => window.removeEventListener(event, handleUserActivity));
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [isAuthenticated]);

  // 1. Modify your fetchAllAccessibleWorkspaces function
const fetchAllAccessibleWorkspaces = async () => {
  setIsLoadingWorkspaces(true);
  try {
    const response = await api.get('/api/workspaces/user/workspaces');
    // Get saved favorites from localStorage
    const savedFavorites = JSON.parse(localStorage.getItem('favoriteWorkspaces') || '[]');
    
    // Add isFavorite property to each workspace based on localStorage data
    const workspacesWithFavorites = response.data.map(workspace => ({
      ...workspace,
      isFavorite: savedFavorites.includes(workspace._id)
    }));
    
    setAllWorkspaces(workspacesWithFavorites);
  } catch (error) {
    console.error('Error fetching workspaces:', error);
    toast.error('Failed to load all workspaces');
  } finally {
    setIsLoadingWorkspaces(false);
  }
};

// 2. Update your toggleFavorite function to save to localStorage
const toggleFavorite = (workspaceId) => {
  // Update state
  setAllWorkspaces(prev => 
    prev.map(workspace => 
      workspace._id === workspaceId 
        ? { ...workspace, isFavorite: !workspace.isFavorite } 
        : workspace
    )
  );
  
  // Update localStorage
  const savedFavorites = JSON.parse(localStorage.getItem('favoriteWorkspaces') || '[]');
  const workspace = allWorkspaces.find(w => w._id === workspaceId);
  
  if (workspace) {
    const isFavorite = !workspace.isFavorite;
    
    if (isFavorite) {
      // Add to favorites if not already there
      if (!savedFavorites.includes(workspaceId)) {
        savedFavorites.push(workspaceId);
      }
    } else {
      // Remove from favorites
      const index = savedFavorites.indexOf(workspaceId);
      if (index > -1) {
        savedFavorites.splice(index, 1);
      }
    }
    
    // Save updated favorites to localStorage
    localStorage.setItem('favoriteWorkspaces', JSON.stringify(savedFavorites));
  }
};

const showToast = (message, type = 'success') => {
  const style = {
    ...toastStyles.base.style,
    ...toastStyles[type].style
  };
  
  let icon = toastStyles[type].icon;
  let iconClass = '';
  
  if (type === 'loading') {
    iconClass = 'animate-spin';
  }
  
  const content = (
    <div className="flex items-center gap-3">
      <span className={`text-xl ${iconClass}`}>{icon}</span>
      <span>{message}</span>
    </div>
  );
  
  return toast(content, { 
    duration: toastStyles.base.duration, 
    style,
    id: `toast-${Date.now()}`
  });
};
  // New animation effects on scroll
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setScrolled(scrollY > 60);
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  if (loading || isRefreshing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-purple-100/5">
        <div className="text-center space-y-4">
          <div className="loader">
            <svg className="animate-spin h-16 w-16 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <p className="text-lg text-primary/80 animate-pulse">Preparing your workspace...</p>
        </div>
      </div>
    );
  }
  
  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-base-100 to-base-200 font-poppins overflow-x-hidden">
{showInactivityAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-base-100 p-6 rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="rounded-full bg-primary/20 p-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold">Are you still there?</h3>
            </div>
            
            <p className="mb-6">You've been inactive for a while. For security purposes, you'll be logged out automatically in <span className="font-semibold text-primary">{countdown} seconds</span>.</p>
            
            {/* Progress bar */}
            <div className="w-full bg-base-300 rounded-full h-2 mb-6">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-1000 ease-linear"
                style={{ width: `${(countdown / 60) * 100}%` }}
              ></div>
            </div>
            
            <div className="flex justify-end gap-4">
              <button onClick={logout} className="btn btn-outline">Log out</button>
              <button onClick={staySignedIn} className="btn btn-primary">I'm still here</button>
            </div>
          </div>
        </div>
      )}

{showWorkspaceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-base-100 p-6 rounded-lg shadow-xl max-w-md w-full">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-primary">Create New Workspace</h3>
              <button 
                onClick={() => setShowWorkspaceModal(false)} 
                className="btn btn-sm btn-circle btn-ghost"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleCreateWorkspace} className="space-y-6">
              <div className="form-control">
                <label className="label">
                  <span className="label-text text-base">Workspace Name</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter workspace name"
                  className="input input-bordered"
                  value={newWorkspaceName}
                  onChange={(e) => setNewWorkspaceName(e.target.value)}
                  required
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text text-base">Description (optional)</span>
                </label>
                <textarea
                  className="textarea textarea-bordered h-32"
                  placeholder="Describe your workspace..."
                  value={newWorkspaceDescription}
                  onChange={(e) => setNewWorkspaceDescription(e.target.value)}
                ></textarea>
              </div>

              <div className="flex justify-end gap-4 pt-2">
                <button 
                  type="button"
                  onClick={() => setShowWorkspaceModal(false)}
                  className="btn btn-outline" 
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className={`btn btn-primary ${isCreatingWorkspace ? 'loading' : ''}`}
                  disabled={isCreatingWorkspace}
                >
                  {isCreatingWorkspace ? 'Creating...' : 'Create Workspace'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}      
      {/* Enhanced Navigation Bar */}
      <motion.nav 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className={`navbar ${scrolled ? 'bg-base-100 shadow-lg' : 'bg-transparent'} fixed top-0 z-50 px-6 sm:px-8 lg:px-12 transition-all duration-300`}
      >
        <div className="flex-1">
          <Link to="/acceuil" className="group flex items-center gap-2">
            <div className="w-10 h-10 relative overflow-hidden">
              <div className="absolute inset-0 bg-primary rounded-lg rotate-45 origin-center group-hover:rotate-[225deg] transition-all duration-700"></div>
              <div className="absolute inset-0 bg-info rounded-lg rotate-90 origin-center group-hover:rotate-[180deg] transition-all duration-700 opacity-60"></div>
              <span className="absolute inset-0 flex items-center justify-center font-bold text-white text-xl">P</span>
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600">PlaniFy</span>
          </Link>
        </div>
        
        <div className="relative overflow-visible">
          <NotificationSystem />
        </div>
        
        <div className="flex-none gap-4">
          <div className="dropdown dropdown-end">
            <motion.div 
              tabIndex={0} 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="btn btn-ghost btn-circle avatar"
            >
              <div className="w-10 rounded-full ring ring-primary ring-offset-2 ring-offset-base-100">
                {user.profile_picture ? 
                  <img src={user.profile_picture} alt="Profile"/> : 
                  <div className="bg-gradient-to-br from-primary to-blue-600 text-white flex items-center justify-center h-full">
                    {user.name.charAt(0).toUpperCase() || 'U'}
                  </div>
                }
              </div>
            </motion.div>
            <ul tabIndex={0} className="mt-3 z-[1] p-2 shadow-xl menu menu-sm dropdown-content bg-base-100 rounded-box w-64 border border-base-300">
              <li className="px-4 py-2">
                <span className="font-bold text-primary">{user.name}</span>
                <span className="text-sm opacity-75">{user.email}</span>
              </li>
              <div className="divider my-1"></div>
              <li><Link to="/profile" className="flex gap-3 items-center"><i className="fa-solid fa-user"></i> Profile Settings</Link></li>
              <li><button onClick={logout} className="flex gap-3 items-center"><i className="fa-solid fa-arrow-right-from-bracket"></i> Logout</button></li>
            </ul>
          </div>
        </div>
      </motion.nav>

      {/* Spectacular Hero Section */}
      <section className="relative pt-24 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          {/* Dynamic background elements */}
          <div className="absolute w-96 h-96 rounded-full bg-gradient-to-r from-primary/30 to-purple-500/10 blur-3xl -top-48 -right-48"></div>
          <div className="absolute w-96 h-96 rounded-full bg-gradient-to-r from-blue-500/20 to-indigo-500/10 blur-3xl -bottom-48 -left-48"></div>
          
          {/* Floating geometric shapes */}
          <motion.div
            initial={{ y: 0 }}
            animate={{ y: [-20, 20, -20] }}
            transition={{ repeat: Infinity, duration: 10, ease: "easeInOut" }}
            className="absolute top-40 left-[10%] w-12 h-12 bg-primary/10 rounded-lg"
          ></motion.div>
          <motion.div
            initial={{ y: 0 }}
            animate={{ y: [20, -20, 20] }}
            transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
            className="absolute bottom-32 right-[15%] w-16 h-16 bg-purple-500/10 rounded-full"
          ></motion.div>
          <motion.div
            initial={{ y: 0 }}
            animate={{ y: [-15, 15, -15] }}
            transition={{ repeat: Infinity, duration: 7, ease: "easeInOut" }}
            className="absolute top-60 right-[25%] w-10 h-10 bg-blue-400/15 rounded-lg rotate-45"
          ></motion.div>
        </div>
        
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="container mx-auto px-6 sm:px-8 lg:px-12 py-16 relative z-10"
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="w-full md:w-1/2 space-y-6">
              <motion.div 
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
              >
                <h1 className="text-5xl md:text-6xl font-bold mb-2">
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600">
                    Welcome back,
                  </span>
                </h1>
                <h1 className="text-5xl md:text-6xl font-bold mb-6">
                  <span className="relative text-primary-content">
                    {user.name}
                    <span className="absolute bottom-0 left-0 w-full h-2 bg-primary rounded-full"></span>
                  </span>
                </h1>
              </motion.div>
              
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.7 }}
                className="text-xl leading-relaxed text-white dark:text-white text-opacity-90"
                >
                Get ready to achieve more. Your projects, teams, and tasks are waiting for your magic touch today.
              </motion.p>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.9 }}
                className="flex flex-wrap gap-4"
              >
                <button 
                  onClick={() => setShowWorkspaceModal(true)}
                  className="btn btn-primary btn-lg group"
                >
                  <span className="group-hover:mr-2 transition-all">Create Workspace</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-0 w-0 group-hover:h-5 group-hover:w-5 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
                  </svg>
                </button>

              </motion.div>
            </div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="w-full md:w-1/2 h-96 relative"
            >
              
              {/* 3D isometric workspace visualization */}
              <div className="w-full h-full relative perspective-1000">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-64 h-64 relative transform rotate-[30deg] rotateX-[60deg] scale-125">
                    {/* Animated boards representing workspaces */}
                    <motion.div 
                      initial={{ y: 40, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.8, duration: 0.8 }}
                      className="absolute top-0 left-0 w-48 h-32 bg-gradient-to-br from-primary/80 to-blue-600/80 rounded-lg shadow-xl"
                    >
                      <div className="absolute top-3 left-3 w-32 h-3 bg-white/30 rounded"></div>
                      <div className="absolute top-9 left-3 w-20 h-3 bg-white/20 rounded"></div>
                    </motion.div>
                    
                    <motion.div 
                      initial={{ y: 60, opacity: 0 }}
                      animate={{ y: 20, opacity: 1 }}
                      transition={{ delay: 1, duration: 0.8 }}
                      className="absolute top-5 left-10 w-48 h-32 bg-gradient-to-br from-purple-500/80 to-pink-500/80 rounded-lg shadow-xl"
                    >
                      <div className="absolute top-3 left-3 w-32 h-3 bg-white/30 rounded"></div>
                      <div className="absolute top-9 left-3 w-20 h-3 bg-white/20 rounded"></div>
                    </motion.div>
                    
                    <motion.div 
                      initial={{ y: 80, opacity: 0 }}
                      animate={{ y: 40, opacity: 1 }}
                      transition={{ delay: 1.2, duration: 0.8 }}
                      className="absolute top-10 left-20 w-48 h-32 bg-gradient-to-br from-teal-500/80 to-green-500/80 rounded-lg shadow-xl"
                    >
                      <div className="absolute top-3 left-3 w-32 h-3 bg-white/30 rounded"></div>
                      <div className="absolute top-9 left-3 w-20 h-3 bg-white/20 rounded"></div>
                    </motion.div>
                    
                    {/* Floating elements */}
                    <motion.div
                      animate={{
                        y: [-5, 5, -5],
                        rotate: [0, 5, 0]
                      }}
                      transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                      className="absolute -top-8 -right-4 w-12 h-12 bg-yellow-400/30 rounded-full shadow-lg"
                    ></motion.div>
                    
                    <motion.div
                      animate={{
                        y: [3, -3, 3],
                        rotate: [0, -5, 0]
                      }}
                      transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut" }}
                      className="absolute -bottom-4 -left-4 w-8 h-8 bg-blue-400/30 rounded-full shadow-lg"
                    ></motion.div>
                  </div>
                </div>
                
                {/* Animated rings */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <motion.div
                    animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.3, 0.8, 0.3] }}
                    transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
                    className="w-64 h-64 rounded-full border-4 border-primary/20"
                  ></motion.div>
                  <motion.div
                    animate={{ scale: [1, 1.4, 1], opacity: [0.2, 0.5, 0.2] }}
                    transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
                    className="w-80 h-80 absolute rounded-full border-4 border-blue-400/10"
                  ></motion.div>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </section>


      {/* Main content area with animated tabs */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 1 }}
        className="container mx-auto px-6 sm:px-8 lg:px-12 py-12"
      >
        {/* Tab Navigation */}
        <div className="mb-8 flex justify-center">
          <div className="tabs tabs-boxed p-2 bg-base-200/50 backdrop-blur-sm">
            <button 
              className={`tab text-lg transition-all duration-300 ${activeTab === 'workspaces' ? 'tab-active' : ''}`} 
              onClick={() => setActiveTab('workspaces')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              Workspaces
            </button>
            <button 
              className={`tab text-lg transition-all duration-300 ${activeTab === 'recent' ? 'tab-active' : ''}`} 
              onClick={() => setActiveTab('recent')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Recent
            </button>
            <button 
              className={`tab text-lg transition-all duration-300 ${activeTab === 'favorites' ? 'tab-active' : ''}`} 
              onClick={() => setActiveTab('favorites')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.95-.69l1.519-4.674z" />
              </svg>
              Favorites
            </button>
          </div>
        </div>
        
        {/* Workspaces Tab Content */}
        {activeTab === 'workspaces' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center">
                <motion.h2 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5 }}
                  className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600"
                >
                  Your Workspaces
                </motion.h2>
                <div className="badge badge-primary ml-3">
                  {allWorkspaces.length}
                </div>
              </div>
              
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowWorkspaceModal(true)} 
                className="btn btn-primary"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
                </svg>
                New Workspace
              </motion.button>
            </div>
            
            {(allWorkspaces && allWorkspaces.length > 0) ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {/* Map through all accessible workspaces with animations */}
                {allWorkspaces.map((workspace, index) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    whileHover={{ y: -5, transition: { duration: 0.2 } }}
                    key={workspace._id}
                    className="card bg-base-100 shadow-xl hover:shadow-2xl transition-all group"
                  >
                    <div className="card-body">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-blue-500 text-white flex items-center justify-center font-bold text-xl transform group-hover:rotate-12 transition-all duration-500 shadow-md">
                          {workspace.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="card-title text-primary text-xl">{workspace.name}</h3>
                          {workspace.owner !== user._id && 
                            <div className="badge badge-sm badge-outline">Member</div>
                          }
                        </div>
                      </div>
                      
                      <p className="text-base-content mb-4 line-clamp-2">
                        {workspace.description || 'No description provided'}
                      </p>
                      
                      <div className="flex flex-wrap gap-2 mb-4">
                        <span className="badge badge-outline badge-primary">
                          {workspace.projects ? `${workspace.projects.length} Projects` : '0 Projects'}
                        </span>
                        <span className="badge badge-outline">
                          {workspace.members ? `${workspace.members.length} Members` : '1 Member'}
                        </span>
                      </div>
                      
                      <div className="card-actions justify-end mt-auto">
                        <Link 
                          to={`/workspace/${workspace._id}`} 
                          className="btn btn-primary w-full group"
                        >
                          <span>Open Workspace</span>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                          </svg>
                        </Link>
                      </div>
                    </div>
                    
{/* Animated Favorite Star Button */}
<motion.div 
  className="absolute top-2 right-2 z-10 cursor-pointer"
  whileHover={{ scale: 1.2 }}
  whileTap={{ scale: 0.9 }}
  onClick={(e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(workspace._id);
    showToast(`${workspace.name} ${workspace.isFavorite ? 'removed from' : 'added to'} favorites!`, 'success');
  }}
>
  <motion.div
    initial={{ rotate: 0 }}
    whileTap={{ 
      rotate: [0, -15, 15, -15, 15, 0],
      transition: { duration: 0.5 }
    }}
    className="relative"
  >
    {workspace.isFavorite ? (
      <motion.svg 
        initial={{ scale: 0, opacity: 0 }}
        animate={{ 
          scale: 1, 
          opacity: 1,
          rotate: [0, 20, -20, 15, -5, 0]
        }}
        transition={{ duration: 0.5 }}
        xmlns="http://www.w3.org/2000/svg" 
        className="h-7 w-7 text-yellow-400 drop-shadow-md" 
        viewBox="0 0 20 20" 
        fill="currentColor"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.95-.69l1.519-4.674z" />
      </motion.svg>
    ) : (
      <motion.svg 
        xmlns="http://www.w3.org/2000/svg" 
        className="h-6 w-6 text-base-content/50 hover:text-yellow-400 transition-colors" 
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={1.5} 
          d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.95-.69l1.519-4.674z" 
        />
      </motion.svg>
    )}
    
    {/* Animated particles when favorited */}
    {workspace.isFavorite && (
      <>
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: [0, 1.5, 0], opacity: [1, 0.8, 0] }}
          transition={{ duration: 0.7 }}
          className="absolute inset-0 bg-yellow-400 rounded-full opacity-30"
        />
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ scale: 0, x: 0, y: 0, opacity: 0 }}
            animate={{ 
              scale: [0, 1, 0], 
              x: [0, (i % 2 === 0 ? 1 : -1) * Math.random() * 20], 
              y: [0, -Math.random() * 20],
              opacity: [0, 1, 0] 
            }}
            transition={{ duration: 0.6, delay: i * 0.05 }}
            className={`absolute top-1/2 left-1/2 w-1.5 h-1.5 rounded-full bg-yellow-${300 + (i * 100)}`}
          />
        ))}
      </>
    )}
  </motion.div>
</motion.div>
                  </motion.div>
                ))}
                
                {/* Create New Workspace Card */}
                <motion.div 
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: allWorkspaces.length * 0.1 }}
                  whileHover={{ scale: 1.03 }}
                  className="card bg-base-100 shadow-lg border-2 border-dashed border-base-300 hover:border-primary transition-all group cursor-pointer"
                  onClick={() => setShowWorkspaceModal(true)}
                >
                  <div className="card-body items-center justify-center text-center h-full">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-all">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
                      </svg>
                    </div>
                    <h3 className="font-semibold text-lg mt-4 mb-2 text-primary">Create New Workspace</h3>
                    <p className="text-base-content opacity-75 mb-4">Start a new project, team, or organization</p>
                    <button 
                      className="btn btn-outline btn-primary"
                    >
                      Get Started
                    </button>
                  </div>
                </motion.div>
              </div>
            ) : (
              /* Empty state for no workspaces */
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8 }}
                className="card bg-base-100 shadow-xl relative overflow-hidden group"
              >
                <div className="card-body items-center justify-center py-24">
                  <div className="relative">
                    <div className="absolute inset-0 bg-primary/10 rounded-full w-32 h-32 animate-ping opacity-30"></div>
                    <div className="relative z-10 w-32 h-32 rounded-full bg-base-200 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
                      </svg>
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold mt-6 mb-3 text-primary">No Workspaces Yet</h3>
                  <p className="text-base-content opacity-75 mb-6 text-lg max-w-md text-center">
                    You don't have any workspaces yet. Create your first one to get started!
                  </p>
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowWorkspaceModal(true)} 
                    className="btn btn-primary btn-lg gap-3"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                    </svg>
                    Create Your First Workspace
                  </motion.button>
                </div>
                
                {/* Background decoration */}
                <div className="absolute -right-12 -top-12 w-40 h-40 bg-primary/10 rounded-full blur-xl"></div>
                <div className="absolute -left-12 -bottom-12 w-40 h-40 bg-blue-400/10 rounded-full blur-xl"></div>
                <div className="absolute right-1/3 bottom-0 w-20 h-20 bg-purple-400/10 rounded-full blur-lg"></div>
              </motion.div>
            )}
          </div>
        )}
        
        {/* Recent Tab Content - Can be implemented for other tabs as needed */}
        {activeTab === 'recent' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center py-12"
          >
            <div className="max-w-md mx-auto">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-primary mb-3">Recent Activity</h3>
              <p className="text-base-content/70 mb-6">
                Your recent activity will appear here as you work on projects and tasks
              </p>
              <button className="btn btn-outline">
                Go to Dashboard
              </button>
            </div>
          </motion.div>
        )}
        
{/* Favorites Tab Content */}
{activeTab === 'favorites' && (
  <motion.div 
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.5 }}
  >
    <div className="flex justify-between items-center mb-6">
      <div className="flex items-center">
        <motion.h2 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600"
        >
          Favorite Workspaces
        </motion.h2>
        <div className="badge badge-primary ml-3">
          {allWorkspaces.filter(workspace => workspace.isFavorite).length}
        </div>
      </div>
    </div>
    
    {allWorkspaces.filter(workspace => workspace.isFavorite).length > 0 ? (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {allWorkspaces.filter(workspace => workspace.isFavorite).map((workspace, index) => (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
            key={workspace._id}
            className="card bg-base-100 shadow-xl hover:shadow-2xl transition-all group"
          >
            <div className="card-body">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-blue-500 text-white flex items-center justify-center font-bold text-xl transform group-hover:rotate-12 transition-all duration-500 shadow-md">
                  {workspace.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="card-title text-primary text-xl">{workspace.name}</h3>
                  {workspace.owner !== user._id && 
                    <div className="badge badge-sm badge-outline">Member</div>
                  }
                </div>
              </div>
              
              <p className="text-base-content mb-4 line-clamp-2">
                {workspace.description || 'No description provided'}
              </p>
              
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="badge badge-outline badge-primary">
                  {workspace.projects ? `${workspace.projects.length} Projects` : '0 Projects'}
                </span>
                <span className="badge badge-outline">
                  {workspace.members ? `${workspace.members.length} Members` : '1 Member'}
                </span>
              </div>
              
              <div className="card-actions justify-end mt-auto">
                <Link 
                  to={`/workspace/${workspace._id}`} 
                  className="btn btn-primary w-full group"
                >
                  <span>Open Workspace</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Link>
              </div>
            </div>
            
            {/* Animated Favorite Star Button */}
            <motion.div 
              className="absolute top-2 right-2 z-10 cursor-pointer"
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleFavorite(workspace._id);
                toast.success(`${workspace.name} removed from favorites!`);
              }}
            >
              <motion.div
                initial={{ rotate: 0 }}
                whileTap={{ 
                  rotate: [0, -15, 15, -15, 15, 0],
                  transition: { duration: 0.5 }
                }}
                className="relative"
              >
                <motion.svg 
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ 
                    scale: 1, 
                    opacity: 1,
                    rotate: [0, 20, -20, 15, -5, 0]
                  }}
                  transition={{ duration: 0.5 }}
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-7 w-7 text-yellow-400 drop-shadow-md" 
                  viewBox="0 0 20 20" 
                  fill="currentColor"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.95-.69l1.519-4.674z" />
                </motion.svg>
              </motion.div>
            </motion.div>
          </motion.div>
        ))}
      </div>
    ) : (
      <div className="card bg-base-100 shadow-xl relative overflow-hidden">
        <div className="card-body items-center justify-center py-16">
          <div className="w-24 h-24 rounded-full bg-base-200 flex items-center justify-center mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.95-.69l1.519-4.674z" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-primary mb-3">No Favorites Yet</h3>
          <p className="text-base-content/70 mb-6 max-w-md text-center">
            Star your favorite workspaces to access them quickly from this tab
          </p>
          <button 
            onClick={() => setActiveTab('workspaces')} 
            className="btn btn-primary"
          >
            Browse Workspaces
          </button>
        </div>
      </div>
    )}
  </motion.div>
)}
      </motion.div>
      <motion.div
  initial={{ opacity: 0, y: 30 }}
  whileInView={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.7, delay: 0.2 }}
  viewport={{ once: true }}
  className="container mx-auto px-6 sm:px-8 lg:px-12 py-12"
>
  <div className="flex justify-between items-center mb-8">
    <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600">
      Your Achievements
    </h2>
    <button className="btn btn-sm btn-primary">View All</button>
  </div>
  
  <div className="carousel carousel-center max-w-full p-4 space-x-4 bg-base-200/30 backdrop-blur-sm rounded-box">
    {[
      { name: "Fast Starter", icon: "🚀", desc: "Created first workspace", progress: 100 },
      { name: "Team Player", icon: "👥", desc: "Added 5 team members", progress: 60 },
      { name: "Task Master", icon: "✓", desc: "Completed 50 tasks", progress: 82 },
      { name: "Project Pro", icon: "📊", desc: "Managed 10 projects", progress: 30 },
      { name: "Communication Star", icon: "💬", desc: "100 comments", progress: 45 },
    ].map((achievement, idx) => (
      <div key={idx} className="carousel-item">
        <motion.div 
          whileHover={{ y: -10, scale: 1.05 }}
          className="card w-64 bg-base-100 shadow-xl"
        >
          <div className="card-body items-center text-center p-6">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-3xl mb-3">
              {achievement.icon}
            </div>
            <h3 className="card-title text-primary">{achievement.name}</h3>
            <p className="text-sm opacity-70">{achievement.desc}</p>
            <div className="w-full mt-3">
              <div className="w-full bg-base-300 rounded-full h-2">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${achievement.progress}%` }}
                  transition={{ duration: 1, delay: 0.5 + idx * 0.1 }}
                  className={`h-2 rounded-full ${achievement.progress === 100 ? 'bg-success' : 'bg-primary'}`}
                ></motion.div>
              </div>
              <div className="flex justify-between text-xs mt-1">
                <span>{achievement.progress}%</span>
                <span>{achievement.progress === 100 ? "Completed!" : "In progress"}</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    ))}
  </div>
</motion.div>
      {/* ****Add this under the hero section */}
<section className="py-12">
  <div className="container mx-auto px-6 sm:px-8 lg:px-12">
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
    >
      {/* Productivity Score */}
      <motion.div 
        whileHover={{ y: -8 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
        className="card bg-gradient-to-br from-primary/10 to-primary/5 backdrop-blur-sm shadow-lg border border-white/10"
      >
        <div className="card-body p-6">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-base-content/70">Productivity</h3>
            <div className="badge badge-primary">+12%</div>
          </div>
          <div className="flex items-end gap-2 mt-2 mb-4">
            <span className="text-4xl font-bold">87</span>
            <span className="text-base-content/50 text-sm mb-1">/ 100</span>
          </div>
          <div className="w-full bg-base-300 rounded-full h-2">
            <div className="bg-primary h-2 rounded-full" style={{ width: "87%" }}></div>
          </div>
        </div>
      </motion.div>
      
      {/* Tasks Completed */}
      <motion.div 
        whileHover={{ y: -8 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
        className="card bg-gradient-to-br from-blue-500/10 to-blue-500/5 backdrop-blur-sm shadow-lg border border-white/10"
      >
        <div className="card-body p-6">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-base-content/70">Tasks Completed</h3>
            <div className="badge badge-info">This Week</div>
          </div>
          <div className="flex items-end gap-1 mt-2">
            <span className="text-4xl font-bold">24</span>
            <span className="text-success text-sm mb-1 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
              </svg>
              8%
            </span>
          </div>
          <div className="flex justify-between items-center mt-4 text-xs text-base-content/50">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => (
              <div key={day} className="flex flex-col items-center gap-1">
                <div className="w-1.5 bg-blue-500/50 rounded-t-sm" style={{ 
                  height: `${[12, 18, 24, 20, 30, 15, 8][i]}px` 
                }}></div>
                <span>{day}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
      
      {/* Project Status */}
      <motion.div 
        whileHover={{ y: -8 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
        className="card bg-gradient-to-br from-purple-500/10 to-purple-500/5 backdrop-blur-sm shadow-lg border border-white/10"
      >
        <div className="card-body p-6">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-base-content/70">Project Status</h3>
          </div>
          <div className="flex flex-col gap-3 mt-3">
            <div className="w-full bg-base-300 rounded-full h-2.5">
              <div className="bg-success h-2.5 rounded-full" style={{ width: "65%" }}></div>
            </div>
            <div className="grid grid-cols-3 text-xs">
              <div>
                <div className="text-success font-medium">Planning</div>
                <div className="text-base-content/50">Completed</div>
              </div>
              <div>
                <div className="text-success font-medium">Development</div>
                <div className="text-base-content/50">In Progress</div>
              </div>
              <div>
                <div className="text-base-content/50 font-medium">Testing</div>
                <div className="text-base-content/50">Pending</div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
      
      {/* Time Tracking */}
      <motion.div 
        whileHover={{ y: -8 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
        className="card bg-gradient-to-br from-teal-500/10 to-teal-500/5 backdrop-blur-sm shadow-lg border border-white/10"
      >
        <div className="card-body p-6">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-base-content/70">Time Logged</h3>
          </div>
          <div className="mt-3 flex items-center justify-center">
            <div className="relative w-24 h-24">
              <svg className="w-24 h-24" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.1)"
                  strokeWidth="3"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="rgba(20, 184, 166, 0.7)"
                  strokeWidth="3"
                  strokeDasharray="75, 100"
                  className="animate-dashboard-progress"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <span className="text-xl font-bold">22.5</span>
                <span className="text-xs text-base-content/50">hours</span>
              </div>
            </div>
          </div>
          <div className="flex justify-between text-xs text-base-content/50 mt-4">
            <span>Weekly Goal: 30h</span>
            <span>75%</span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  </div>
</section>
      {/* Quick Access Section with Glass Effect */}
      <section className="py-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-blue-500/5"></div>
        <div className="container mx-auto px-6 sm:px-8 lg:px-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-3xl font-bold text-primary mb-8 text-center"
          >
            Quick Access
          </motion.h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* My Projects Card */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              whileHover={{ y: -10, transition: { duration: 0.2 } }}
              className="card backdrop-blur-md bg-white/10 shadow-xl border border-white/20"
            >
              <div className="card-body">
                <div className="flex items-center gap-4 mb-4">
                  <div className="rounded-2xl bg-gradient-to-br from-primary to-blue-500 p-4 shadow-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                    </svg>
                  </div>
                  <h2 className="card-title text-2xl text-primary">My Projects</h2>
                </div>
                <p className="mb-6">All your projects in one place. Track progress, manage tasks, and collaborate with your team.</p>
                <div className="card-actions justify-end">
                  <button className="btn btn-primary btn-block group">
                    <span>View All Projects</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </button>
                </div>
              </div>
            </motion.div>
            
            {/* Tasks Card */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              whileHover={{ y: -10, transition: { duration: 0.2 } }}
              className="card backdrop-blur-md bg-white/10 shadow-xl border border-white/20"
            >
              <div className="card-body">
                <div className="flex items-center gap-4 mb-4">
                  <div className="rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 p-4 shadow-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
                    </svg>
                  </div>
                  <h2 className="card-title text-2xl text-primary">My Tasks</h2>
                </div>
                <p className="mb-6">Stay organized with all your tasks in one view. Track deadlines and manage your priorities.</p>
                <div className="card-actions justify-end">
                  <button className="btn btn-primary btn-block group">
                    <span>View Tasks</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </button>
                </div>
              </div>
            </motion.div>
            
            {/* Team Card */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              whileHover={{ y: -10, transition: { duration: 0.2 } }}
              className="card backdrop-blur-md bg-white/10 shadow-xl border border-white/20"
            >
              <div className="card-body">
                <div className="flex items-center gap-4 mb-4">
                  <div className="rounded-2xl bg-gradient-to-br from-teal-500 to-green-500 p-4 shadow-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                    </svg>
                  </div>
                  <h2 className="card-title text-2xl text-primary">Team</h2>
                </div>
                <p className="mb-6">Connect and collaborate with your team members. Manage permissions and roles efficiently.</p>
                <div className="card-actions justify-end">
                  <button className="btn btn-primary btn-block group">
                    <span>View Team</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Enhanced Footer */}
      <footer className="bg-base-300 text-base-content border-t border-base-200 relative z-10 mt-12">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          {/* Waves SVG */}
          <div className="w-full overflow-hidden leading-none relative -top-1">
            <svg className="relative block w-full h-12" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
              <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" className="fill-base-100"></path>
            </svg>
          </div>
          
          <div className="p-10">
            {/* Footer Links - Keep your existing footer content */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {/* Product Links */}
              <div>
                <h6 className="footer-title opacity-100 text-primary">Product</h6>
                <Link to="/features" className="link link-hover">Features</Link>
                <Link to="/pricing" className="link link-hover">Pricing</Link>
                <Link to="/integrations" className="link link-hover">Integrations</Link>
                <Link to="/status" className="link link-hover">Status</Link>
              </div>
              
              {/* Solutions Links */}
              <div>
                <h6 className="footer-title opacity-100 text-primary">Solutions</h6>
                <Link to="/teams" className="link link-hover">For Teams</Link>
                <Link to="/startups" className="link link-hover">For Startups</Link>
                <Link to="/enterprise" className="link link-hover">Enterprise</Link>
                <Link to="/education" className="link link-hover">Education</Link>
              </div>
              
              {/* Company Links */}
              <div>
                <h6 className="footer-title opacity-100 text-primary">Company</h6>
                <Link to="/about" className="link link-hover">About</Link>
                <Link to="/careers" className="link link-hover">Careers</Link>
                <Link to="/blog" className="link link-hover">Blog</Link>
                <Link to="/contact" className="link link-hover">Contact</Link>
              </div>
              
              {/* Legal Links and Social Media */}
              <div>
                <h6 className="footer-title opacity-100 text-primary">Legal</h6>
                <Link to="/privacy" className="link link-hover">Privacy</Link>
                <Link to="/terms" className="link link-hover">Terms</Link>
                <Link to="/cookies" className="link link-hover">Cookies</Link>
                
                {/* Social Media Icons */}
                <div className="mt-4 flex gap-4">
                  <motion.a 
                    whileHover={{ scale: 1.2, rotate: 5 }}
                    whileTap={{ scale: 0.9 }}
                    className="btn btn-circle btn-sm bg-base-200 hover:bg-primary hover:text-white transition-all"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" className="fill-current">
                      <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                    </svg>
                  </motion.a>
                  <motion.a 
                    whileHover={{ scale: 1.2, rotate: -5 }}
                    whileTap={{ scale: 0.9 }}
                    className="btn btn-circle btn-sm bg-base-200 hover:bg-primary hover:text-white transition-all"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" className="fill-current">
                      <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
                    </svg>
                  </motion.a>
                  <motion.a 
                    whileHover={{ scale: 1.2, rotate: 5 }}
                    whileTap={{ scale: 0.9 }}
                    className="btn btn-circle btn-sm bg-base-200 hover:bg-primary hover:text-white transition-all"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" className="fill-current">
                      <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/>
                    </svg>
                  </motion.a>
                </div>
              </div>
            </div>
            
            {/* Footer Bottom */}
            <div className="divider my-8"></div>
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              {/* Language Selector */}
              <div className="flex items-center gap-4">
                <span className="text-sm">Language:</span>
                <select className="select select-bordered select-sm w-32">
                  <option>English</option>
                  <option>Français</option>
                  <option>Español</option>
                </select>
              </div>
              
              {/* Copyright and Links */}
              <div className="flex gap-4">
                <span className="text-sm">© 2025 PlaniFy</span>
                <Link to="/privacy" className="link link-hover text-sm">Privacy Policy</Link>
                <Link to="/terms" className="link link-hover text-sm">Terms of Service</Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
      
      {/* Add the animations style */}
      <style>{`
        @keyframes gridScroll {
          0% { background-position: 0 0; }
          100% { background-position: 0 40px; }
        }
        
        @keyframes gridScrollSlow {
          0% { background-position: 0 0; }
          100% { background-position: 0 20px; }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0) translateX(0); }
          25% { transform: translateY(-10px) translateX(5px); }
          50% { transform: translateY(-5px) translateX(10px); }
          75% { transform: translateY(5px) translateX(-5px); }
        }

          @keyframes toast-slide-in {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
        
        .animate-grid-scroll {
          animation: gridScroll 20s linear infinite;
        }
        
        .animate-grid-scroll-slow {
          animation: gridScrollSlow 15s linear infinite;
        }
        
        .animate-float {
          animation: float 10s ease-in-out infinite;
        }
        
        .animate-float-delay-1 {
          animation: float 12s ease-in-out 1s infinite;
        }
        
        .animate-float-delay-2 {
          animation: float 14s ease-in-out 2s infinite;
        }
        
        .animate-float-delay-3 {
          animation: float 16s ease-in-out 3s infinite;
        }
        
        .animate-float-delay-4 {
          animation: float 18s ease-in-out 4s infinite;
        }

        .perspective-1000 {
          perspective: 1000px;
        }
        
        .rotateX-\\[60deg\\] {
          transform: rotateX(60deg);
        }
      `}</style>
    </div>
  );
};

export default Acceuil;