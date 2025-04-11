import { motion } from 'framer-motion';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import TaskCard from './TaskCard';

const KanbanBoard = ({ tasks, onEditTask, getStatusColor, users }) => {
  // Group tasks by status
  const columns = {
    'TODO': {
      title: 'To Do',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
      tasks: tasks.filter(task => task.status === 'TODO'),
    },
    'IN_PROGRESS': {
      title: 'In Progress',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      tasks: tasks.filter(task => task.status === 'IN_PROGRESS'),
    },
    'REVIEW': {
      title: 'Review',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      ),
      tasks: tasks.filter(task => task.status === 'REVIEW'),
    },
    'DONE': {
      title: 'Done',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
        </svg>
      ),
      tasks: tasks.filter(task => task.status === 'DONE'),
    },
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2 }}
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
    >
      {Object.entries(columns).map(([columnId, column]) => (
        <div 
          key={columnId}
          className="bg-base-100 rounded-lg shadow-lg overflow-hidden flex flex-col"
        >
          {/* Column Header */}
          <div className={`p-4 flex items-center justify-between`}>
            <div className="flex items-center gap-2">
              <div className={`${getStatusColor(columnId)} rounded-md p-1`}>
                {column.icon}
              </div>
              <h3 className="font-bold">{column.title}</h3>
              <div className="badge badge-sm">{column.tasks.length}</div>
            </div>
          </div>

          {/* Task List */}
          <Droppable droppableId={columnId}>
            {(provided, snapshot) => (
              <div
                className={`flex-1 p-2 min-h-[300px] ${snapshot.isDraggingOver ? 'bg-base-200/50' : ''}`}
                ref={provided.innerRef}
                {...provided.droppableProps}
              >
                {column.tasks.length > 0 ? (
                  column.tasks.map((task, index) => (
                    <Draggable 
                      key={String(task._id)} 
                      draggableId={String(task._id)} // Ensure ID is a string
                      index={index}
                    >
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          style={{
                            ...provided.draggableProps.style,
                            opacity: snapshot.isDragging ? 0.8 : 1,
                          }}
                          className="mb-2"
                        >
                          <TaskCard task={task} onEdit={() => onEditTask(task)} users={users} />
                        </div>
                      )}
                    </Draggable>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-base-content/50 text-sm">
                    <p>No tasks</p>
                  </div>
                )}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </div>
      ))}
    </motion.div>
  );
};

export default KanbanBoard;