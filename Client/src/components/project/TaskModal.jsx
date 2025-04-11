import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams } from 'react-router-dom';
import api from '../../utils/Api';
import { toast } from 'react-hot-toast';

const TaskModal = ({ 
  isOpen, 
  onClose, 
  task, 
  projectId, 
  users, 
  onCreateTask, 
  onUpdateTask, 
  onDeleteTask,
  modalRef 
}) => {
  const { id: workspaceId } = useParams(); // Get workspace ID from URL
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'TODO',
    priority: 'MEDIUM',
    estimated_time: 1,
    actual_time: 0,
    assigned_to: '',
    deadline: new Date().toISOString().split('T')[0],
  });
  
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [loading, setLoading] = useState(false);
  const [findingMatch, setFindingMatch] = useState(false);
  
  // Initialize form with task data if editing
  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        status: task.status || 'TODO',
        priority: task.priority || 'MEDIUM',
        estimated_time: task.estimated_time || 1,
        actual_time: task.actual_time || 0,
        assigned_to: task.assigned_to || '',
        deadline: task.deadline ? new Date(task.deadline).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      });
    } else {
      // Set default assignee to first user if available
      if (users.length > 0) {
        setFormData(prev => ({ ...prev, assigned_to: users[0]._id }));
      }
    }
  }, [task, users]);
  
  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Update the findBestMatch function with increased timeout
  const findBestMatch = async () => {
    if (!formData.description) {
      toast.error('Please provide a task description first');
      return;
    }
    
    setFindingMatch(true);
    try {
      console.log(`Finding match for workspace ${workspaceId} with description: ${formData.description.substring(0, 30)}...`);
      
      const response = await api.post('/api/match-profiles', {
        workspace_id: workspaceId,
        task_description: formData.description
      }, {
        timeout: 60000 // Increase timeout to 60 seconds
      });
      
      if (response.data && response.data.length > 0) {
        // Get the highest scoring member
        const bestMatch = response.data[0];
        
        // Update the form with the best match
        setFormData(prev => ({
          ...prev,
          assigned_to: bestMatch.id
        }));
        
        toast.success(`${bestMatch.name} is the best match for this task`);
        console.log('Match results:', response.data);
      } else {
        toast.error('No suitable team members found');
      }
    } catch (error) {
      console.error('Error finding best match:', error);
      if (error.code === 'ECONNABORTED') {
        toast.error('Request timed out. The matching process is taking too long.');
      } else {
        const errorMessage = error.response?.data?.error || 'Could not find a matching team member';
        toast.error(errorMessage);
      }
    } finally {
      setFindingMatch(false);
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Convert assigned_to to string if it's an object ID
    const taskToSubmit = {
      ...formData,
      assigned_to: formData.assigned_to ? String(formData.assigned_to) : null
    };
  
    try {
      if (task) {
        await onUpdateTask(taskToSubmit);
      } else {
        await onCreateTask(taskToSubmit);
      }
      onClose();
    } catch (error) {
      console.error('Error submitting task:', error);
      // Show error message
    }
  };
  
  // Handle delete
  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    
    setLoading(true);
    try {
      await onDeleteTask(task._id);
      onClose();
    } catch (error) {
      console.error('Error deleting task:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Close modal when clicking outside
  const handleClickOutside = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      onClose();
    }
  };

  return (
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={handleClickOutside}
    >
      <motion.div
        ref={modalRef}
        className="bg-base-100 rounded-xl shadow-2xl max-w-xl w-full"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={e => e.stopPropagation()}
      >
        <div className="relative">
          {/* Header accent */}
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary via-secondary to-primary rounded-t-xl"></div>
          
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-primary">
                {task ? 'Edit Task' : 'Create New Task'}
              </h2>
              <button 
                className="btn btn-sm btn-circle btn-ghost"
                onClick={onClose}
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Title */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Task Title</span>
                </label>
                <input
                  type="text"
                  name="title"
                  placeholder="Enter task title"
                  className="input input-bordered"
                  value={formData.title}
                  onChange={handleChange}
                  required
                />
              </div>
              
              {/* Description */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Description</span>
                </label>
                <textarea
                  name="description"
                  placeholder="Describe the task..."
                  className="textarea textarea-bordered h-24"
                  value={formData.description}
                  onChange={handleChange}
                  required
                ></textarea>
              </div>
              
              {/* Status and Priority */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Status</span>
                  </label>
                  <select
                    name="status"
                    className="select select-bordered w-full"
                    value={formData.status}
                    onChange={handleChange}
                  >
                    <option value="TODO">To Do</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="REVIEW">Review</option>
                    <option value="DONE">Done</option>
                  </select>
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Priority</span>
                  </label>
                  <select
                    name="priority"
                    className="select select-bordered w-full"
                    value={formData.priority}
                    onChange={handleChange}
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>
              
              {/* Time Tracking */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Estimated Hours</span>
                  </label>
                  <input
                    type="number"
                    name="estimated_time"
                    min="0"
                    step="0.5"
                    className="input input-bordered w-full"
                    value={formData.estimated_time}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Actual Hours (if tracked)</span>
                  </label>
                  <input
                    type="number"
                    name="actual_time"
                    min="0"
                    step="0.5"
                    className="input input-bordered w-full"
                    value={formData.actual_time}
                    onChange={handleChange}
                  />
                </div>
              </div>
              
              {/* Assignee and Deadline */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Assigned To</span>
                  </label>
                  <div className="flex gap-2">
                    <select
                      name="assigned_to"
                      className="select select-bordered w-full"
                      value={formData.assigned_to}
                      onChange={handleChange}
                      required
                    >
                      <option value="" disabled>Select a team member</option>
                      {users.map(user => (
                        <option key={user._id} value={String(user._id)}>
                          {user.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className={`btn btn-secondary ${findingMatch ? 'loading' : ''}`}
                      onClick={findBestMatch}
                      disabled={findingMatch || !formData.description}
                      title="Find the best team member for this task based on skills"
                    >
                      {findingMatch ? 
                        'Matching...' : 
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                      }
                    </button>
                  </div>
                  {formData.description && !findingMatch && (
                    <label className="label">
                      <span className="label-text-alt">Click the shield button to find the best match</span>
                    </label>
                  )}
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Deadline</span>
                  </label>
                  <input
                    type="date"
                    name="deadline"
                    className="input input-bordered w-full"
                    value={formData.deadline}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex justify-between mt-6">
                <div>
                  {task && (
                    <button 
                      type="button"
                      className={`btn ${confirmDelete ? 'btn-error' : 'btn-outline btn-error'}`}
                      onClick={handleDelete}
                      disabled={loading}
                    >
                      {confirmDelete ? 'Confirm Delete' : 'Delete Task'}
                    </button>
                  )}
                </div>
                
                <div className="flex gap-3">
                  <button 
                    type="button" 
                    className="btn btn-ghost"
                    onClick={onClose}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className={`btn btn-primary ${loading ? 'loading' : ''}`}
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : (task ? 'Update Task' : 'Create Task')}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default TaskModal;