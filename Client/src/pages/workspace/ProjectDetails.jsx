import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { DragDropContext } from '@hello-pangea/dnd';
import { toast } from 'react-hot-toast';
import KanbanBoard from '../../components/project/KanbanBoard';
import ListView from '../../components/project/ListView';
import TaskModal from '../../components/project/TaskModal';
import api from '../../utils/Api';

const ProjectDetails = () => {
  const { id, projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' or 'list'
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [currentTask, setCurrentTask] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const modalRef = useRef(null);

  // Fetch project data
  useEffect(() => {
    const fetchProjectDetails = async () => {
      setLoading(true);
      try {
        // First get the project details
        const projectResponse = await api.get(`/api/projects/${projectId}`);
        setProject(projectResponse.data);
        
        // Then get the tasks for this project
        const tasksResponse = await api.get(`/api/projects/${projectId}/tasks`);
        setTasks(tasksResponse.data || []);
        
        // Fetch workspace members
        const workspaceResponse = await api.get(`/api/workspaces/${id}/members`);
        setUsers(workspaceResponse.data || []);
      } catch (error) {
        console.error('Error fetching project details:', error);
        toast.error('Failed to load project data');
      } finally {
        setLoading(false);
      }
    };

    fetchProjectDetails();
  }, [id, projectId]);

  // Handle task creation
  const handleCreateTask = async (taskData) => {
    try {
      const response = await api.post(`/api/projects/${projectId}/tasks`, {
        ...taskData,
        project_id: projectId
      });
      
      setTasks([...tasks, response.data]);
      setShowTaskModal(false);
      toast.success('Task created successfully');
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error('Failed to create task');
    }
  };

  // Handle task update
  const handleUpdateTask = async (taskId, taskData) => {
    try {
      const response = await api.put(`/api/tasks/${taskId}`, taskData);
      
      setTasks(tasks.map(task => 
        task._id === taskId ? response.data : task
      ));
      setShowTaskModal(false);
      toast.success('Task updated successfully');
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Failed to update task');
    }
  };

  // Handle task deletion
  const handleDeleteTask = async (taskId) => {
    try {
      await api.delete(`/api/tasks/${taskId}`);
      
      setTasks(tasks.filter(task => task._id !== taskId));
      setShowTaskModal(false);
      toast.success('Task deleted successfully');
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Failed to delete task');
    }
  };

  // Handle drag and drop in Kanban view
  const handleDragEnd = async (result) => {
    if (!result.destination) return;
    
    const { draggableId, source, destination } = result;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;
    
    // Find the task being dragged - ensure consistent string conversion
    const taskId = String(draggableId);
    const newStatus = destination.droppableId;
    
    // Find the task object
    const taskToUpdate = tasks.find(task => String(task._id) === taskId);
    if (!taskToUpdate) {
      console.error('Task not found:', taskId);
      return;
    }
    
    // Update task locally for immediate UI update
    const updatedTasks = tasks.map(task => {
      if (String(task._id) === taskId) {
        return { ...task, status: newStatus };
      }
      return task;
    });
    
    setTasks(updatedTasks);
    
    // Update task on server
    try {
      await api.put(`/api/tasks/${taskId}`, { status: newStatus });
      toast.success('Task moved successfully');
    } catch (error) {
      console.error('Error updating task status:', error);
      toast.error('Failed to update task status');
      // Revert changes if server update fails
      setTasks(tasks);
    }
  };

  // Add this function to handle status changes from the SimpleKanbanBoard component
  const handleStatusChange = async (taskId, newStatus) => {
    try {
      // Update task locally for immediate UI update
      const updatedTasks = tasks.map(task => {
        if (String(task._id) === String(taskId)) {
          return { ...task, status: newStatus };
        }
        return task;
      });
      
      setTasks(updatedTasks);
      
      // Update on server
      await api.put(`/api/tasks/${taskId}`, { status: newStatus });
      toast.success('Task status updated');
    } catch (error) {
      console.error('Error updating task status:', error);
      toast.error('Failed to update task status');
      // Revert changes if server update fails
      setTasks(tasks);
    }
  };

  // Open task modal for creating or editing
  const openTaskModal = (task = null) => {
    setCurrentTask(task);
    setShowTaskModal(true);
  };

  // Calculate project completion percentage
  const calculateProgress = () => {
    if (!tasks.length) return 0;
    const completedTasks = tasks.filter(task => task.status === 'DONE').length;
    return Math.round((completedTasks / tasks.length) * 100);
  };

  // Get filtered and sorted tasks
  const getFilteredTasks = () => {
    let filteredTasks = [...tasks];
    
    // Apply status filter if not "all"
    if (filterStatus !== 'all') {
      filteredTasks = filteredTasks.filter(task => task.status === filterStatus);
    }
    
    // Apply search term
    if (searchTerm) {
      filteredTasks = filteredTasks.filter(task => 
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply sorting
    switch (sortBy) {
      case 'newest':
        return filteredTasks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      case 'oldest':
        return filteredTasks.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      case 'deadline':
        return filteredTasks.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
      case 'priority':
        const priorityOrder = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
        return filteredTasks.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
      default:
        return filteredTasks;
    }
  };

  // Map status to color
  const getStatusColor = (status) => {
    switch (status) {
      case 'TODO': return 'bg-info text-info-content';
      case 'IN_PROGRESS': return 'bg-primary text-primary-content';
      case 'REVIEW': return 'bg-warning text-warning-content';
      case 'DONE': return 'bg-success text-success-content';
      default: return 'bg-base-300';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-lg">Loading project details...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center">
        <div className="w-24 h-24 bg-base-300 rounded-full flex items-center justify-center mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-base-content/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold mb-4">Project Not Found</h2>
        <p className="mb-6 max-w-md">This project doesn't exist or you don't have permission to view it.</p>
        <Link to={`/workspace/${id}/projects`} className="btn btn-primary">
          Back to Projects
        </Link>
      </div>
    );
  }

  const progress = calculateProgress();
  const filteredTasks = getFilteredTasks();

  return (
    <div className="space-y-8 pb-16">
      {/* Breadcrumb Navigation */}
      <div className="text-sm breadcrumbs">
        <ul>
          <li>
            <Link to={`/workspace/${id}/projects`} className="flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Projects
            </Link>
          </li>
          <li>
            <span className="flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              {project.project_name || project.name}
            </span>
          </li>
        </ul>
      </div>

      {/* Project Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-base-100 rounded-xl shadow-lg overflow-hidden"
      >
        <div className="relative">
          {/* Decorative elements */}
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary via-secondary to-primary"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-base-100 to-secondary/10 z-0"></div>
          
          <div className="relative z-10 p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-base-content">{project.project_name || project.name}</h1>
                <p className="text-base-content/90 mt-1 max-w-2xl">
                  {project.description || "No description provided."}
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="btn btn-primary gap-2"
                  onClick={() => openTaskModal()}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                  New Task
                </motion.button>
                
                <div className="dropdown dropdown-end">
                  <label tabIndex={0} className="btn btn-ghost btn-circle">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                    </svg>
                  </label>
                  <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
                    <li><a>Edit Project</a></li>
                    <li><a className="text-error">Delete Project</a></li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
              <div className="stats bg-base-100 shadow-md border border-base-200">
                <div className="stat">
                  <div className="stat-figure text-primary">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div className="stat-title font-medium text-base-content/90">Tasks</div>
                  <div className="stat-value text-primary">{tasks.length}</div>
                </div>
              </div>
              
              <div className="stats bg-base-100 shadow-md border border-base-200">
                <div className="stat">
                  <div className="stat-figure text-success">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="stat-title font-medium text-base-content/90">Progress</div>
                  <div className="stat-value text-success">{progress}%</div>
                  <div className="stat-desc">
                    <div className="w-full bg-base-200 rounded-full h-2 mt-1">
                      <div 
                        className={`${progress >= 100 ? 'bg-success' : 'bg-primary'} h-2 rounded-full`}
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="stats bg-base-100 shadow-md border border-base-200">
                <div className="stat">
                  <div className="stat-figure text-warning">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="stat-title font-medium text-base-content/90">Deadline</div>
                  <div className="stat-value text-warning">
                    {project.end_date ? new Date(project.end_date).toLocaleDateString() : 'N/A'}
                  </div>
                </div>
              </div>
              
              <div className="stats bg-base-100 shadow-md border border-base-200">
                <div className="stat">
                  <div className="stat-figure text-info">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div className="stat-title font-medium text-base-content/90">Team</div>
                  <div className="stat-value text-info">
                    {project.id_teamMembre?.length || 0}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
      
      {/* Filters and View Toggle */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="relative overflow-hidden rounded-2xl shadow-lg"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-base-100 to-secondary/10 z-0"></div>
        <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full bg-primary/5 blur-3xl"></div>
        <div className="absolute -left-20 -bottom-20 w-64 h-64 rounded-full bg-secondary/5 blur-3xl"></div>
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary via-secondary to-primary"></div>
        
        <div className="relative z-10 p-5">
          <div className="flex flex-col lg:flex-row justify-between items-center gap-4">
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full lg:w-auto">
              <div className="relative w-full sm:w-64">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                  <svg className="w-4 h-4 text-primary" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"/>
                  </svg>
                </div>
                <input 
                  type="search" 
                  className="input input-bordered border-2 border-base-200 focus:border-primary bg-base-100/90 pl-10 w-full"
                  placeholder="Search tasks..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="join w-full sm:w-auto">
                <select 
                  className="select select-bordered join-item"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="TODO">To Do</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="REVIEW">Review</option>
                  <option value="DONE">Done</option>
                </select>
                
                <select 
                  className="select select-bordered join-item"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="deadline">By Deadline</option>
                  <option value="priority">By Priority</option>
                </select>
              </div>
            </div>
            
            {/* View Mode Switcher */}
            <div className="rounded-lg border border-primary/20 p-1">
              <div className="flex relative">
                <div
                  className="absolute bg-gradient-to-r from-primary/30 to-secondary/30 rounded-md transition-all duration-500 ease-in-out"
                  style={{
                    width: "50%",
                    height: "100%",
                    top: "0%",
                    left: viewMode === 'kanban' ? '0%' : '50%',
                    opacity: 0.8,
                  }}
                />
                <button 
                  className="btn btn-sm rounded-md border-0 bg-transparent hover:bg-transparent z-10 w-28 flex justify-center items-center"
                  onClick={() => setViewMode('kanban')}
                >
                  <div className="flex items-center justify-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                    <span className={viewMode === 'kanban' ? 'font-bold text-base-content' : 'text-base-content/60'}>Kanban</span>
                  </div>
                </button>
                <button 
                  className="btn btn-sm rounded-md border-0 bg-transparent hover:bg-transparent z-10 w-28 flex justify-center items-center"
                  onClick={() => setViewMode('list')}
                >
                  <div className="flex items-center justify-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                    <span className={viewMode === 'list' ? 'font-bold text-base-content' : 'text-base-content/60'}>List</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
      
      {/* Task Display based on view mode */}
      {viewMode === 'kanban' ? (
         
          <DragDropContext onDragEnd={handleDragEnd}>
            <KanbanBoard 
              tasks={filteredTasks} 
              onEditTask={openTaskModal} 
              getStatusColor={getStatusColor}
              users={users}
            />
          </DragDropContext>
        
      ) : (
        <ListView 
          tasks={filteredTasks} 
          onEditTask={openTaskModal}
          getStatusColor={getStatusColor}
          users={users} 
        />
      )}
      
      {/* Task Modal */}
      <AnimatePresence>
        {showTaskModal && (
          <TaskModal
            isOpen={showTaskModal}
            onClose={() => setShowTaskModal(false)}
            task={currentTask}
            projectId={projectId}
            users={users}
            onCreateTask={handleCreateTask}
            onUpdateTask={handleUpdateTask}
            onDeleteTask={handleDeleteTask}
            modalRef={modalRef}
          />
        )}
      </AnimatePresence>
      
      {/* Mobile Add Task Button */}
      <motion.button 
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-8 right-8 btn btn-primary btn-circle btn-lg shadow-lg md:hidden"
        onClick={() => openTaskModal()}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
        </svg>
      </motion.button>
    </div>
  );
};

export default ProjectDetails;