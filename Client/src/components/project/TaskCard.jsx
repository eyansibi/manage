import React from 'react';
import { motion } from 'framer-motion';

const TaskCard = ({ task, onEdit, users }) => {
  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {month: 'short', day: 'numeric'}).format(date);
  };

  // Calculate days until due
  const getDueStatus = () => {
    if (!task.due_date) return { text: '', color: '' };
    
    const dueDate = new Date(task.due_date);
    const today = new Date();
    const diffTime = dueDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { text: 'Overdue', color: 'text-error' };
    if (diffDays === 0) return { text: 'Today', color: 'text-warning' };
    if (diffDays <= 3) return { text: `${diffDays}d`, color: 'text-warning' };
    return { text: `${diffDays}d`, color: 'text-success' };
  };
  
  const dueStatus = getDueStatus();
  
  // Priority colors
  const priorityColor = {
    HIGH: 'var(--error)',
    MEDIUM: 'var(--warning)',
    LOW: 'var(--success)'
  }[task.priority] || 'var(--success)';

  // Get assignee - handle both object and ID reference cases
  let assignee = null;
  
  if (task.assigned_to) {
    // If assigned_to is already a user object with a name property, use it directly
    if (typeof task.assigned_to === 'object' && task.assigned_to.name) {
      assignee = task.assigned_to;
    } 
    // Otherwise try to find the user in the users array
    else if (users?.length > 0) {
      assignee = users.find(user => String(user._id) === String(task.assigned_to));
    }
  }

  return (
    <motion.div 
    whileHover={{ y: -2, boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}
    transition={{ duration: 0.2 }}
    className="card backdrop-blur-[2px] bg-white/40 dark:bg-black/20 border-[0.5px] border-white/20 overflow-hidden relative"
    style={{
      backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.05) 100%)',
    }}
    >
      <div className="card-body p-3">
        {/* Left border priority indicator */}
        <div className="absolute top-0 bottom-0 left-0 w-1" style={{ background: priorityColor }} />
        
        {/* Title and buttons in a row */}
        <div className="flex justify-between items-center mb-1.5">
          <h3 className="font-medium text-sm text-base-content line-clamp-1">{task.title}</h3>
          <button onClick={onEdit} className="btn btn-ghost btn-xs h-6 w-6 min-h-0 p-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
        </div>
        
        {/* Description with better contrast */}
        {task.description && (
          <p className="text-xs text-gray-400 mb-2 line-clamp-1">
            {task.description}
          </p>
        )}
        
        {/* Bottom info bar */}
        <div className="flex items-center justify-between mt-auto text-xs">
          {/* Left side - avatar and due info */}
          <div className="flex items-center gap-2">
            {/* Avatar display - show based on assignee data */}
            <div className="avatar">
              {assignee ? (
                <div className="w-5 h-5 rounded-full">
                  {assignee.profile_picture ? (
                    <img src={assignee.profile_picture} alt={assignee.name} />
                  ) : (
                    <div className="bg-primary text-primary-content flex items-center justify-center text-xs font-bold">
                      {assignee.name?.charAt(0).toUpperCase() || '?'}
                    </div>
                  )}
                </div>
              ) : task.assigned_to ? (
                <div className="w-5 h-5 rounded-full bg-base-300 flex items-center justify-center">
                  <span className="text-xs">?</span>
                </div>
              ) : (
                <div className="w-5 h-5 rounded-full bg-base-200 flex items-center justify-center">
                  <span className="text-xs">-</span>
                </div>
              )}
            </div>
            
            {/* Due date with icon */}
            {task.due_date && (
              <div className="flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-base-content/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className={dueStatus.color || "text-base-content/70"}>
                  {formatDate(task.due_date)} {dueStatus.text && `(${dueStatus.text})`}
                </span>
              </div>
            )}
          </div>
          
          {/* Right side - estimated time, priority badge and progress */}
          <div className="flex items-center gap-2">
            {/* Estimated time indicator */}
            {task.estimated_time && (
              <div className="flex items-center gap-1 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium">{task.estimated_time}h</span>
              </div>
            )}
            
            {/* Priority badge */}
            {task.priority && (
              <div className={`badge badge-xs ${
                task.priority === 'HIGH' ? 'badge-error' : 
                task.priority === 'MEDIUM' ? 'badge-warning' : 
                'badge-success'
              }`}>
                {task.priority === 'HIGH' ? 'HIGH' : task.priority === 'MEDIUM' ? 'MEDIUM' : 'LOW'}
              </div>
            )}
            
            {/* Small progress indicator */}
            {task.progress !== undefined && task.progress > 0 && (
              <div className="text-xs text-base-content/80 font-medium">
                {task.progress}%
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default TaskCard;