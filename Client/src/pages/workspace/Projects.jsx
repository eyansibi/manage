import { useState, useEffect, useRef } from 'react';
import { Link, useOutletContext, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../utils/Api';

// Projects.jsx
const Projects = () => {
  const { workspace, setWorkspace } = useOutletContext();
  const { id } = useParams();
  const [newProject, setNewProject] = useState({
    project_name: '',
    description: '',
    start_date: new Date().toISOString().split('T')[0], // Today as default start date
    end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Today + 7 days as default end date
  });
  const [loading, setLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState('grid');
  const formRef = useRef(null);

  // Use workspace projects if available, otherwise fetch separately
  const projects = workspace?.projects || [];
  
  useEffect(() => {
    const fetchProjectDetails = async () => {
      setIsFetching(true);
      try {
        // First get basic projects from workspace
        const response = await api.get(`/api/workspaces/${id}/projects`);
        
        // Log the raw response data to see what we have
        console.log("Raw project data:", JSON.stringify(response.data[0]));
        
        // Replace setWorkspace with a direct approach that ensures full data refresh
        const updatedProjects = await Promise.all(response.data.map(async project => {
          // For each project, get its detailed information including populated tasks
          try {
            const projectResponse = await api.get(`/api/projects/${project._id}`);
            return projectResponse.data;
          } catch (err) {
            console.error(`Error fetching project ${project._id}:`, err);
            return project;
          }
        }));
        
        // Log projects after fetching complete data
        console.log("Projects with verified task counts:", 
          updatedProjects.map(p => ({
            name: p.project_name,
            taskIdsLength: p.id_tasks ? p.id_tasks.length : 'none',
            taskIds: p.id_tasks
          }))
        );
        
        // Update workspace state with the fetched project data
        setWorkspace(prevState => ({
          ...prevState,
          projects: updatedProjects
        }));
        
      } catch (err) {
        toast.error('Failed to load projects');
      } finally {
        setIsFetching(false);
      }
    };

    fetchProjectDetails();
    
    // Add window focus event listener to refresh data when returning to page
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log("Page is visible again - refreshing project data");
        fetchProjectDetails();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [id, setWorkspace]);

  const getProjectStatus = (project) => {
    // Use the actual project status if available
    if (project.status) {
      return project.status;
    }
    
    // Calculate based on tasks
    if (!project.id_tasks || project.id_tasks.length === 0) {
      return 'not started';
    }
    
    // Check for both 'completed' and 'DONE' status formats
    const completedTasks = project.id_tasks.filter(task => 
      task.status === 'completed' || task.status === 'DONE'
    );
    
    if (completedTasks.length === project.id_tasks.length) {
      return 'completed';
    }
    
    // If there are tasks but not all completed
    return 'in progress';
  };

  const calculateProgress = (project) => {
    if (!project.id_tasks || project.id_tasks.length === 0) {
      return 0; // No tasks = 0% progress
    }
    
    // Check for both 'completed' and 'DONE' status formats
    const completedTasks = project.id_tasks.filter(task => 
      task.status === 'completed' || task.status === 'DONE'
    );
    
    return Math.round((completedTasks.length / project.id_tasks.length) * 100);
  };

  // Update the getStatusColor function to match our status values
  const getStatusColor = (status) => {
    switch(status) {
      case 'completed': return 'bg-success';
      case 'in progress': return 'bg-primary';
      case 'not started': return 'bg-secondary';
      default: return 'bg-secondary';
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Validate required fields before submission
      if (!newProject.project_name || !newProject.project_name.trim()) {
        toast.error('Project name is required');
        setLoading(false);
        return;
      }
      
      // Create proper date objects to pass validation
      // This will convert to ISO format which is more reliable
      const startDate = new Date(newProject.start_date);
      const endDate = new Date(newProject.end_date);
      
      // Create with formatted dates that will pass validation
      const projectData = {
        project_name: newProject.project_name.trim(),
        description: newProject.description || '',
        start_date: startDate.toISOString(), // Format as ISO string
        end_date: endDate.toISOString()      // Format as ISO string
      };
      
      console.log("Submitting project data:", projectData);
      
      const response = await api.post(`/api/workspaces/${id}/projects`, projectData);
      
      // IMMEDIATELY fetch projects again to ensure we get the latest data
      const projectsResponse = await api.get(`/api/workspaces/${id}/projects`);
      
      setWorkspace(prev => ({
        ...prev,
        projects: projectsResponse.data // Use the freshly fetched projects
      }));
      
      setNewProject({
        project_name: '',
        description: '',
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      });
      
      toast.success('Project created successfully!');
      setShowCreateForm(false);
      
    } catch (err) {
      console.error("Project creation error:", err);
      
      if (err.response?.data?.errors) {
        toast.error(`Validation error: ${err.response.data.errors}`);
      } else {
        toast.error(err.response?.data?.message || 'Failed to create project');
      }
    } finally {
      setLoading(false);
    }
  };

  // Update the filter projects function
  const filteredProjects = projects.filter(project => {
    // Get accurate status based on tasks
    const projectStatus = getProjectStatus(project);
    
    // Match against search term (project name or description)
    const matchesSearch = 
      (project.project_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      project.description?.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Filter by status if not "all"
    if (filterStatus === 'all') return matchesSearch;
    return matchesSearch && projectStatus === filterStatus;
  });

  // Sort projects
  const sortedProjects = [...filteredProjects].sort((a, b) => {
    if (sortBy === 'name') {
      return a.name.localeCompare(b.name);
    } else if (sortBy === 'oldest') {
      return new Date(a.createdAt || 0) - new Date(a.createdAt || 0);
    } else {
      // Default: newest first
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    }
  });

  // Close form when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (formRef.current && !formRef.current.contains(event.target)) {
        setShowCreateForm(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Add a debugging log to check task counts
  const logProjectTaskCounts = (projects) => {
    console.log("Projects with task counts:", 
      projects.map(p => ({
        name: p.name || p.project_name,
        taskCount: p.id_tasks?.length || 0
      }))
    );
  };

  // Add this call before rendering to debug task counts
  useEffect(() => {
    if (projects.length > 0) {
      logProjectTaskCounts(projects);
    }
  }, [projects]);

  if (isFetching) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-lg">Loading your projects...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16">
      {/* Header with Stats */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="stats shadow bg-base-100 w-full"
      >
        <div className="stat">
          <div className="stat-figure text-primary">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div className="stat-title">Total Projects</div>
          <div className="stat-value text-primary">{projects.length}</div>
          <div className="stat-desc">In this workspace</div>
        </div>
        
        <div className="stat">
          <div className="stat-figure text-success">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="stat-title">Completed</div>
          <div className="stat-value text-success">
            {projects.filter(p => getProjectStatus(p) === 'completed').length}
          </div>
          <div className="stat-desc">Projects</div>
        </div>
        
        <div className="stat">
          <div className="stat-figure text-secondary">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="stat-title">In Progress</div>
          <div className="stat-value text-secondary">
            {projects.filter(p => getProjectStatus(p) === 'in progress').length}
          </div>
          <div className="stat-desc">Active projects</div>
        </div>
        
        <div className="stat">
          <div className="stat-figure text-info">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="stat-title">Not Started</div>
          <div className="stat-value text-info">
            {projects.filter(p => getProjectStatus(p) === 'not started').length}
          </div>
          <div className="stat-desc">New projects</div>
        </div>
      </motion.div>

      {/* Controls Bar */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="relative overflow-hidden rounded-2xl shadow-lg"
      >
        {/* Decorative background elements */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-base-100 to-secondary/10 z-0"></div>
        <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full bg-primary/5 blur-3xl"></div>
        <div className="absolute -left-20 -bottom-20 w-64 h-64 rounded-full bg-secondary/5 blur-3xl"></div>
        
        {/* Top accent line */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary via-secondary to-primary"></div>
        
        <div className="relative z-10 p-5">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-5">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                  <svg className="w-4 h-4 text-primary" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"/>
                  </svg>
                </div>
                <input 
                  type="search" 
                  className="input input-bordered border-2 border-base-200 focus:border-primary bg-base-100/90 pl-10 w-full"
                  placeholder="Search projects..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-3 w-full sm:w-auto justify-center sm:justify-end">
              <div className="join">
                <select 
                  className="select select-bordered join-item"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="not started">Not Started</option>
                  <option value="in progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
                
                <select 
                  className="select select-bordered join-item"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="name">By Name</option>
                </select>
              </div>

              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowCreateForm(true)}
                className="btn btn-primary gap-1"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                New Project
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Create Project Modal */}
      <AnimatePresence>
        {showCreateForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              ref={formRef}
              className="bg-base-100 rounded-xl shadow-2xl max-w-md w-full overflow-hidden"
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-primary">Create New Project</h2>
                  <button 
                    className="btn btn-sm btn-circle btn-ghost"
                    onClick={() => setShowCreateForm(false)}
                  >
                    ✕
                  </button>
                </div>
                
                <form onSubmit={handleCreateProject} className="space-y-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Project Name</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Enter project name"
                      className="input input-bordered"
                      value={newProject.project_name}
                      onChange={(e) => setNewProject({...newProject, project_name: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Description</span>
                    </label>
                    <textarea
                      placeholder="Describe your project..."
                      className="textarea textarea-bordered h-24"
                      value={newProject.description}
                      onChange={(e) => setNewProject({...newProject, description: e.target.value})}
                    ></textarea>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Start Date</span>
                      </label>
                      <input
                        type="date"
                        className="input input-bordered"
                        value={newProject.start_date}
                        min={new Date().toISOString().split('T')[0]} // Today as minimum
                        onChange={(e) => setNewProject({...newProject, start_date: e.target.value})}
                        required
                      />
                    </div>
                    
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">End Date</span>
                      </label>
                      <input
                        type="date"
                        className="input input-bordered"
                        value={newProject.end_date}
                        min={newProject.start_date || new Date().toISOString().split('T')[0]}
                        onChange={(e) => setNewProject({...newProject, end_date: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-3 mt-6">
                    <button 
                      type="button" 
                      className="btn btn-ghost"
                      onClick={() => setShowCreateForm(false)}
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className={`btn btn-primary ${loading ? 'loading' : ''}`}
                      disabled={loading}
                    >
                      {loading ? 'Creating...' : 'Create Project'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Project Display Mode Switcher */}
      <div className="flex justify-end mb-5">
        <div className="rounded-lg border border-primary/20 p-1">
          <div className="flex relative gap-3">
            <div
              className="absolute bg-gradient-to-r from-primary/20 to-secondary/20 rounded-md transition-all duration-300"
              style={{
                width: "30%",
                height: "100%",
                top: "0%",
                left: viewMode === 'grid' ? '0%' : viewMode === 'list' ? '35%' : '70%',
                opacity: 0.6,
                filter: "blur(1px)",
              }}
            />
            <button 
              className={`btn btn-sm rounded-lg border-0 bg-transparent hover:bg-transparent px-4 z-10 ${viewMode === 'grid' ? 'text-primary font-bold' : 'text-primary/50 hover:text-primary/70'}`}
              onClick={() => setViewMode('grid')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button 
              className={`btn btn-sm rounded-lg border-0 bg-transparent hover:bg-transparent px-4 z-10 ${viewMode === 'list' ? 'text-primary font-bold' : 'text-primary/50 hover:text-primary/70'}`}
              onClick={() => setViewMode('list')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <button 
              className={`btn btn-sm rounded-lg border-0 bg-transparent hover:bg-transparent px-4 z-10 ${viewMode === 'table' ? 'text-primary font-bold' : 'text-primary/50 hover:text-primary/70'}`}
              onClick={() => setViewMode('table')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Projects Grid with Animation */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className={viewMode === 'grid' 
          ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
          : viewMode === 'list'
          ? "space-y-4"
          : "overflow-x-auto"
        }
      >
        {sortedProjects.length > 0 ? (
          viewMode === 'table' ? (
            // Table view
            <div className="overflow-x-auto rounded-xl">
              <table className="table w-full">
                <thead className="bg-base-200/50">
                  <tr>
                    <th className="rounded-tl-lg">Project</th>
                    <th>Status</th>
                    <th>Progress</th>
                    <th>Created</th>
                    <th className="rounded-tr-lg">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedProjects.map((project, index) => {
                    const status = getProjectStatus(project);
                    const statusColor = getStatusColor(status);
                    const progress = calculateProgress(project);
                    
                    return (
                      <motion.tr 
                        key={project._id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.05 }}
                        className="border-b border-base-200 transition-all duration-200 hover:bg-base-100 group"
                        style={{
                          background: "transparent"
                        }}
                      >
                        <td className="group-hover:scale-[1.01] transition-transform duration-200">
                          <div className="flex items-center gap-3">
                            <div className={`${statusColor} w-1 h-10 rounded-full hidden group-hover:block transition-all duration-300`}></div>
                            <div>
                              <div className="font-bold">{project.project_name || project.name}</div>
                              <div className="text-xs text-white/70 line-clamp-1">{project.description || "No description"}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className={`badge ${statusColor} badge-sm text-white capitalize px-3 py-2`}>{status}</div>
                        </td>
                        <td>
                          <div className="flex flex-col gap-1">
                            <div className="w-full bg-base-300 rounded-full h-2 max-w-[100px]">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                transition={{ duration: 1 }}
                                className={`${progress >= 100 ? 'bg-success' : statusColor} h-2 rounded-full`}
                                style={{ width: `${progress}%` }}
                              ></motion.div>
                            </div>
                            <div className="text-xs">{progress}%</div>
                          </div>
                        </td>
                        <td className="text-xs text-white/70">
                          {new Date(project.createdAt || Date.now()).toLocaleDateString()}
                        </td>
                        <td>
                          <Link 
                            to={`/workspace/${id}/projects/${project._id}`}
                            className="btn btn-primary btn-sm btn-outline group-hover:btn-primary transition-all duration-300"
                          >
                            Open
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                          </Link>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-base-200/30">
                  <tr>
                    <td colSpan={5} className="text-center text-xs py-3 rounded-b-lg">
                      {sortedProjects.length} projects found
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : viewMode === 'list' ? (
            // List view - more compact
            sortedProjects.map((project, index) => {
              const status = getProjectStatus(project);
              const statusColor = getStatusColor(status);
              const progress = calculateProgress(project);
              
              return (
                <motion.div 
                  key={project._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-base-100 rounded-lg shadow p-4 hover:shadow-md transition-all"
                >
                  <div className="flex flex-col sm:flex-row justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-md ${statusColor} flex items-center justify-center text-white font-semibold`}>
  {(project.project_name || project.name) ? 
    (project.project_name || project.name).charAt(0).toUpperCase() : 'P'}
</div>
                        <div>
                          <h3 className="font-bold text-lg text-primary">{project.project_name}</h3>
                          <div className="flex items-center gap-2">
                            <div className={`badge ${statusColor} badge-sm text-white capitalize`}>{status}</div>
                            <span className="text-xs">Created: {new Date(project.createdAt || Date.now()).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-base-content/70 mt-2 line-clamp-1">
                        {project.description || "No description provided for this project."}
                      </p>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row items-end sm:items-center gap-4">
                      <div className="w-full sm:w-32">
                        <div className="flex justify-between text-xs mb-1">
                          <span>Progress</span>
                          <span>{progress}%</span>
                        </div>
                        <div className="w-full bg-base-300 rounded-full h-2">
                          <div 
                            className={`${progress >= 100 ? 'bg-success' : statusColor} h-2 rounded-full`}
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      <Link 
                        to={`/workspace/${id}/projects/${project._id}`}
                        className="btn btn-primary btn-sm"
                      >
                        Open Project
                      </Link>
                    </div>
                  </div>
                </motion.div>
              );
            })
          ) : (
            // Grid view - card layout with badges
            <>
              {sortedProjects.map((project, index) => {
                const status = getProjectStatus(project);
                const statusColor = getStatusColor(status);
                const progress = calculateProgress(project); // Dynamic progress calculation
                
                return (
                  <motion.div 
                    key={project._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ 
                      y: -5,
                      boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                      transition: { duration: 0.2 }
                    }}
                    className="card bg-base-100 shadow-lg overflow-hidden"
                  >
                    <div className="card-body p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold ${statusColor}`}>
                            {project.project_name ? project.project_name.charAt(0).toUpperCase() : 'P'}
                          </div>
                          <div>
                            <h3 className="card-title text-primary line-clamp-1">{project.project_name}</h3>
                            <div className="flex items-center gap-1 text-xs text-white">
                              <span>Created {new Date(project.createdAt || Date.now()).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className={`badge ${statusColor} text-white capitalize px-3 py-3`}>
                          {status}
                        </div>
                      </div>
                      
                      {/* Description */}
                      <p className="text-white mb-4 line-clamp-2">
                        {project.description || "No description provided for this project."}
                      </p>
                      
                      {/* Progress bar */}
                      <div className="mb-5">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="font-medium">Project Progress</span>
                          <span className="font-semibold">{progress}%</span>
                        </div>
                        <div className="w-full bg-base-200 rounded-full h-2.5 overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 1, delay: 0.2 }}
                            className={`h-full ${progress >= 100 ? 'bg-success' : statusColor}`}
                          ></motion.div>
                        </div>
                      </div>
                      
                      {/* Project stats with badges - simplified */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        <div className="badge badge-outline gap-1">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                          {(() => {
                            // This is a self-executing function to handle complex logic
                            if (project.id_tasks && Array.isArray(project.id_tasks)) {
                              return project.id_tasks.length;
                            }
                            return 0;
                          })()} Tasks
                        </div>
                        
                        <div className="badge badge-outline gap-1">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {new Date(project.end_date).toLocaleDateString()}
                        </div>
                      </div>
                      
                      {/* Bottom section with just the action button */}
                      <div className="flex justify-end items-center pt-3 border-t border-base-200">
                        <div className="card-actions">
                          <Link 
                            to={`/workspace/${id}/projects/${project._id}`}
                            className="btn btn-primary btn-sm gap-1"
                          >
                            Open Project
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </>
          )
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="col-span-full flex flex-col items-center justify-center py-16 text-center"
          >
            {searchTerm || filterStatus !== 'all' ? (
              // No results from search
              <>
                <div className="w-24 h-24 bg-base-200 rounded-full flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-base-content/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-primary mb-2">No Projects Found</h3>
                <p className="text-base-content/70 max-w-md">
                  We couldn't find any projects matching your search criteria. Try adjusting your filters or search term.
                </p>
                <button 
                  className="btn btn-outline btn-sm mt-4"
                  onClick={() => {
                    setSearchTerm('');
                    setFilterStatus('all');
                  }}
                >
                  Clear Filters
                </button>
              </>
            ) : (
              // No projects at all
              <>
                <div className="w-24 h-24 bg-base-200 rounded-full flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-primary mb-2">No Projects Yet</h3>
                <p className="text-base-content/70 max-w-md mb-6">
                  This workspace doesn't have any projects yet. Get started by creating your first project!
                </p>
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowCreateForm(true)}
                  className="btn btn-primary gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                  Create Your First Project
                </motion.button>
              </>
            )}
          </motion.div>
        )}
      </motion.div>

      {/* Floating Action Button for Mobile */}
      <button 
        onClick={() => setShowCreateForm(true)}
        className="fixed bottom-8 right-8 btn btn-primary btn-circle btn-lg shadow-lg md:hidden"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
        </svg>
      </button>
    </div>
  );
};

// Add this helper function at the component level
const getRandomColor = (index) => {
  const colors = ['primary', 'secondary', 'accent', 'info', 'success', 'warning'];
  return colors[index % colors.length];
};

export default Projects;