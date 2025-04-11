import { motion } from 'framer-motion';
import { format, isPast, isToday } from 'date-fns';

const ListView = ({ tasks, onEditTask, getStatusColor, users }) => {
  // Helper to get user info
  const getUserInfo = (userId) => {
    const user = users.find(u => u._id === userId);
    return user ? user : { name: 'Unassigned' };
  };
  
  // Helper for priority badge styling
  const getPriorityBadge = (priority) => {
    switch(priority) {
      case 'URGENT': return 'badge-error';
      case 'HIGH': return 'badge-warning';
      case 'MEDIUM': return 'badge-info';
      case 'LOW': return 'badge-success';
      default: return 'badge-ghost';
    }
  };
  
  // Helper for deadline status
  const getDeadlineStatus = (deadline) => {
    const deadlineDate = new Date(deadline);
    if (isPast(deadlineDate) && !isToday(deadlineDate)) {
      return { class: 'text-error', text: 'Overdue' };
    }
    if (isToday(deadlineDate)) {
      return { class: 'text-warning', text: 'Due Today' };
    }
    return { class: '', text: '' };
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-base-100 rounded-xl shadow-lg overflow-hidden"
    >
      {tasks.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead className="bg-base-200/50">
              <tr>
                <th>Title</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Assignee</th>
                <th>Deadline</th>
                <th>Time</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task, index) => {
                const deadlineStatus = getDeadlineStatus(task.deadline);
                
                return (
                  <motion.tr 
                    key={task._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b border-base-200 transition-all duration-200 hover:bg-base-100/5 group"
                  >
                    {/* Title and Description */}
                    <td className="max-w-xs">
                      <div className="font-medium">{task.title}</div>
                      <div className="text-xs text-base-content/70 line-clamp-1">{task.description}</div>
                    </td>
                    
                    {/* Status */}
                    <td>
                      <div className={`badge ${getStatusColor(task.status)} badge-sm text-xs px-3 py-2 capitalize`}>
                        {task.status.replace('_', ' ')}
                      </div>
                    </td>
                    
                    {/* Priority */}
                    <td>
                      <div className={`badge ${getPriorityBadge(task.priority)} badge-sm`}>
                        {task.priority}
                      </div>
                    </td>
                    
                    {/* Assignee */}
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="avatar">
                          <div className="w-8 rounded-full">
                            <img src={`https://ui-avatars.com/api/?name=${getUserInfo(task.assigned_to).name}&background=random`} alt="Avatar" />
                          </div>
                        </div>
                        <div className="text-xs">
                          {getUserInfo(task.assigned_to).name}
                        </div>
                      </div>
                    </td>
                    
                    {/* Deadline */}
                    <td>
                      <div className="flex flex-col">
                        <span className="text-xs">{format(new Date(task.deadline), 'MMM d, yyyy')}</span>
                        <span className={`text-xs ${deadlineStatus.class} font-medium`}>{deadlineStatus.text}</span>
                      </div>
                    </td>
                    
                    {/* Time Tracking */}
                    <td>
                      <div className="flex flex-col">
                        <span className="text-xs">Est: {task.estimated_time}h</span>
                        <span className="text-xs">Act: {task.actual_time || 0}h</span>
                      </div>
                    </td>
                    
                    {/* Actions */}
                    <td>
                      <button 
                        onClick={() => onEditTask(task)} 
                        className="btn btn-ghost btn-xs"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit
                      </button>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-24 h-24 bg-base-200 rounded-full flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-base-content/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-primary mb-2">No Tasks Found</h3>
          <p className="text-base-content/70 max-w-md">
            There are no tasks matching your current filters. Try adjusting your search criteria or create a new task.
          </p>
        </div>
      )}
    </motion.div>
  );
};

export default ListView;