import { useState, useEffect } from 'react';
import api from '../utils/Api';
import { toast } from 'react-hot-toast';
import useSession from '../hooks/useSession';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import socketService from '../utils/SocketService';

const Invitations = () => {
  const [invitationNotifications, setInvitationNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState({});
  const { user, refreshUser } = useSession();
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    // Make sure socket is connected on component mount
    if (user && user._id) {
      // Force socket to initialize/check connection
      const socket = socketService.getSocket() || socketService.initialize(user._id);
      console.log('Invitations: Socket state:', socket?.connected ? 'connected' : 'disconnected');
      
      // If disconnected, try to reconnect
      if (socket && !socket.connected) {
        socketService.reconnect();
      }
    }
    
    fetchInvitationNotifications();
    
    // Set up refresh interval
    const interval = setInterval(() => {
      fetchInvitationNotifications();
    }, 15000);
    
    return () => clearInterval(interval);
  }, [user]);

  // Get invitation notifications
  const fetchInvitationNotifications = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const response = await api.get('/api/notifications');
      
      // Filter only invitation-type notifications
      const filtered = response.data.filter(notification => 
        notification.type === 'invitation' && notification.relatedInvitation
      );
      
      console.log('Invitation notifications:', filtered);
      setInvitationNotifications(filtered);
    } catch (error) {
      console.error('Error fetching invitation notifications:', error);
      toast.error('Failed to load invitations');
    } finally {
      setLoading(false);
    }
  };

  const handleInvitation = async (notificationId, invitationId, action) => {
    if (!invitationId) {
      toast.error('Invalid invitation reference');
      return;
    }
    
    try {
      setProcessing(prev => ({ ...prev, [notificationId]: true }));
      
      // Use the ID-based invitation response
      const response = await api.post(`/api/workspaces/invitations/respond/${invitationId}`, {
        action
      });
      
      toast.success(
        action === 'accept' 
          ? 'Invitation accepted successfully!' 
          : 'Invitation declined'
      );
      
      // Mark notification as read
      await api.patch(`/api/notifications/${notificationId}/read`);
      
      // Refresh invitations list
      fetchInvitationNotifications();
      
      // If accepted, refresh user data to get updated workspaces
      if (action === 'accept' && refreshUser) {
        await refreshUser();
        
        // Navigate to the workspace after success
        if (response.data && response.data.workspace) {
          toast.success('Redirecting to workspace...');
          // Use window.location for a full page navigation instead of React Router
          // This is more reliable for maintaining socket connections
          setTimeout(() => {
            window.location.href = `/workspace/${response.data.workspace}`;
          }, 1000);
        }
      }
    } catch (error) {
      console.error(`Error ${action}ing invitation:`, error);
      toast.error(`Failed to ${action} invitation: ${error.response?.data?.message || 'Unknown error'}`);
    } finally {
      setProcessing(prev => ({ ...prev, [notificationId]: false }));
    }
  };

  if (loading && invitationNotifications.length === 0) {
    return (
      <div className="flex justify-center items-center h-48">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Workspace Invitations</h1>
      
      {invitationNotifications.length === 0 ? (
        <div className="card bg-base-200 shadow-lg">
          <div className="card-body text-center">
            <h2 className="card-title justify-center">No Pending Invitations</h2>
            <p className="text-base-content opacity-80">
              You don't have any pending workspace invitations.
            </p>
            <div className="card-actions justify-center mt-4">
              <Link to="/acceuil" className="btn btn-primary">
                Go to Dashboard
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {invitationNotifications.map(notification => (
            <div key={notification._id} className="card bg-base-200 shadow-lg">
              <div className="card-body">
                <h2 className="card-title">
                  Workspace Invitation
                </h2>
                <p className="text-base-content opacity-80">
                  {notification.message}
                </p>
                <p className="text-sm text-base-content opacity-60">
                  Received: {new Date(notification.createdAt).toLocaleDateString()}
                </p>
                <div className="card-actions justify-end mt-4">
                  <button 
                    className="btn btn-error btn-outline"
                    onClick={() => handleInvitation(notification._id, notification.relatedInvitation, 'decline')}
                    disabled={processing[notification._id]}
                  >
                    {processing[notification._id] ? (
                      <span className="loading loading-spinner loading-xs"></span>
                    ) : 'Decline'}
                  </button>
                  <button 
                    className="btn btn-success"
                    onClick={() => handleInvitation(notification._id, notification.relatedInvitation, 'accept')}
                    disabled={processing[notification._id]}
                  >
                    {processing[notification._id] ? (
                      <span className="loading loading-spinner loading-xs"></span>
                    ) : 'Accept'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Invitations;