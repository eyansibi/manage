import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import api from './Api';
import useSession from '../hooks/useSession';
import { Link, useNavigate } from 'react-router-dom'; // Add useNavigate
import socketService from './SocketService';

const NotificationSystem = () => {
  const { user } = useSession();
  const navigate = useNavigate(); // Initialize navigate
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  // Fetch notifications when component mounts
  useEffect(() => {
    if (user) {
      fetchNotifications();

      // Set up periodic refresh (you can keep this as a fallback)
      const interval = setInterval(() => {
        fetchNotifications();
      }, 30000);
      
      // Set up socket listener for real-time notifications
      const handleNewNotification = (notification) => {
        console.log('New notification received via socket:', notification);
        // Add the new notification to the state
        setNotifications(prev => [notification, ...prev]);
        // Update unread count
        setUnreadCount(prevCount => prevCount + 1);
        // Optionally show a toast
        toast.success(`New notification: ${notification.message}`, {
          duration: 4000,
        });
      };
      
      // Register the socket event listener
      socketService.on('new-notification', handleNewNotification);
      
      // Clean up on unmount
      return () => {
        clearInterval(interval);
        socketService.off('new-notification', handleNewNotification);
      };
    }
  }, [user]);

  const fetchNotifications = async () => {
    if (!user) return;

    try {
      const response = await api.get('/api/notifications');
      setNotifications(response.data);

      // Count unread notifications
      const unread = response.data.filter(notification => !notification.read).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  // Enhanced markAsRead function with navigation
  const markAsRead = async (notification) => {
    try {
      // First mark as read
      await api.patch(`/api/notifications/${notification._id}/read`);
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => n._id === notification._id ? {...n, read: true} : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      // Close notification dropdown
      setShowNotifications(false);
      
      // Navigate based on notification type
      if (notification.type === 'invitation' || 
          notification.relatedInvitation || 
          (notification.message && notification.message.toLowerCase().includes('invite'))) {
        navigate('/invitations');
      } else if (notification.relatedWorkspace) {
        navigate(`/workspace/${notification.relatedWorkspace}`);
      } else if (notification.relatedProject) {
        navigate(`/project/${notification.relatedProject}`);
      } else if (notification.relatedTask) {
        navigate(`/task/${notification.relatedTask}`);
      } else if (notification.actionLink) {
        navigate(notification.actionLink);
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const clearNotifications = async () => {
    try {
      await api.delete('/api/notifications/clear');
      setNotifications([]);
      setUnreadCount(0);
      toast.success('All notifications cleared!');
    } catch (error) {
      console.error('Error clearing notifications:', error);
      toast.error('Failed to clear notifications.');
    }
  };

  const toggleNotifications = () => {
    setShowNotifications(prev => !prev);
  };

  const formatDate = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diff = (now - date) / 1000;

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)} days ago`;

    return date.toLocaleDateString();
  };

  const unreadNotifications = notifications.filter(notification => !notification.read);
  const readNotifications = notifications.filter(notification => notification.read);

  return (
    <div className="relative">
      {/* Notification Button */}
      <button 
        className="btn btn-ghost btn-circle" 
        onClick={toggleNotifications}
      >
<div className="indicator relative">
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
  {unreadCount > 0 && (
    <span className="absolute -top-1 -left-1 text-[10px] min-w-[16px] h-[16px] px-1 rounded-full bg-error text-white flex items-center justify-center shadow">
      {unreadCount}
    </span>
  )}
</div>

      </button>

      {/* Notification Sidebar */}
      {showNotifications && (
        <div className="z-50 card compact dropdown-content shadow bg-base-100 rounded-box w-80 absolute right-0 mt-2">
          <div className="card-body">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold text-lg">Notifications</h3>
              <div className="flex gap-2">
                {/* Clear All Button */}
                <button 
                  className="btn btn-xs btn-error"
                  onClick={clearNotifications}
                >
                  Clear All
                </button>
                {/* Close Button */}
                <button 
                  className="btn btn-xs btn-ghost"
                  onClick={toggleNotifications}
                >
                  Close
                </button>
              </div>
            </div>

            <div className="divider my-0"></div>

            <div className="overflow-y-auto max-h-96">
              {/* Unread Notifications */}
              {unreadNotifications.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm mb-2">Unread</h4>
                  {unreadNotifications.map(notification => (
                    <div 
                      key={notification._id} 
                      className="py-2 px-1 border-b hover:bg-base-300 cursor-pointer bg-base-200"
                      onClick={() => markAsRead(notification)} 
                    >
                      <p className="text-sm font-semibold">{notification.message}</p>
                      <p className="text-xs text-gray-500 mt-1">{formatDate(notification.createdAt)}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Read Notifications */}
              {readNotifications.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-semibold text-sm mb-2">Read</h4>
                  {readNotifications.map(notification => (
                    <div 
                      key={notification._id} 
                      className="py-2 px-1 border-b hover:bg-base-300 cursor-pointer opacity-60"
                      onClick={() => markAsRead(notification)} 
                    >
                      <p className="text-sm">{notification.message}</p>
                      <p className="text-xs text-gray-500 mt-1">{formatDate(notification.createdAt)}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* No Notifications */}
              {notifications.length === 0 && (
                <div className="text-center py-4 text-gray-500">
                  No notifications
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationSystem;