import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../utils/Api';
import useSession from '../../hooks/useSession';

const InvitationResponse = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [invitation, setInvitation] = useState(null);
  const [error, setError] = useState(null);
  const { user, isAuthenticated } = useSession(); // Add this line

  useEffect(() => {
    const verifyInvitation = async () => {
      try {
        console.log('Verifying invitation token:', token);
        const response = await api.get(`/api/workspaces/invitations/${token}/verify`);
        console.log('Invitation verified:', response.data);
        setInvitation(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error verifying invitation:', err);
        setError(err.response?.data?.message || 'This invitation is invalid or has expired');
        setLoading(false);
      }
    };
  
    verifyInvitation();
  }, [token]);

  const handleAccept = async () => {
    if (!isAuthenticated) {
      handleLoginRedirect();
      return;
    }
    if (!emailMatchesInvitation()) {
      toast.error("You're logged in with a different email than the invitation was sent to");
      return;
    }
    setProcessing(true);
    try {
      console.log('Accepting invitation');
      const response = await api.post(`/api/workspaces/invitations/${token}/respond`, {
        action: 'accept'
      });
      
      toast.success('You have successfully joined the workspace!');
      
      // Navigate to the workspace - fix the path
      setTimeout(() => {
        navigate(`/workspace/${response.data.workspace}`);
      }, 1500);
    } catch (err) {
      console.error('Error accepting invitation:', err);
      toast.error(err.response?.data?.message || 'Failed to accept invitation');
      setProcessing(false);
    }
  };;

  const handleDecline = async () => {
    setProcessing(true);
    try {
      await api.post(`/api/workspaces/invitations/${token}/respond`, {
        action: 'decline'
      });
      
      toast.info('Invitation declined');
      
      // Navigate back to home page
      setTimeout(() => {
        navigate('/acceuil');
      }, 1500);
    } catch (err) {
      console.error('Error declining invitation:', err);
      toast.error(err.response?.data?.message || 'Failed to decline invitation');
      setProcessing(false);
    }
  };
  
// Add this function inside your component
const emailMatchesInvitation = () => {
  if (!user || !invitation) return false;
  return user.email === invitation.email;
};
// Add this function inside your component
const handleLoginRedirect = () => {
  sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
  navigate('/login');
};

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="card w-full max-w-md bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-error">Invitation Error</h2>
            <p>{error}</p>
            <div className="card-actions justify-end mt-4">
              <button 
                className="btn btn-primary" 
                onClick={() => navigate('/acceuil')}
              >
                Go to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="card w-full max-w-md bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">Workspace Invitation</h2>
          
          {!isAuthenticated && (
            <div className="alert alert-warning mt-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              <span>Please log in to accept this invitation</span>
            </div>
          )}
          
          {isAuthenticated && !emailMatchesInvitation() && (
            <div className="alert alert-error mt-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              <span>You're logged in with {user?.email} but this invitation was sent to {invitation?.email}</span>
            </div>
          )}
          
          <p className="py-2">
            You've been invited to join the workspace:
          </p>
          <p className="font-bold text-lg">
            {invitation?.workspace?.name || "Unnamed Workspace"}
          </p>
          
          {invitation?.workspace?.description && (
            <p className="text-sm opacity-70 mt-2">
              {invitation.workspace.description}
            </p>
          )}
          
          <p className="mt-4">
            <span className="opacity-70">Invitation sent to: </span>
            <span className="font-medium">{invitation?.email}</span>
          </p>
          
          <div className="card-actions justify-end mt-6">
            {!isAuthenticated ? (
              <button 
                className="btn btn-primary" 
                onClick={handleLoginRedirect}
              >
                Log in to respond
              </button>
            ) : !emailMatchesInvitation() ? (
              <button 
                className="btn btn-primary" 
                onClick={() => {
                  sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
                  // Log out and redirect to login
                  navigate('/login');
                }}
              >
                Switch Account
              </button>
            ) : (
              <>
                <button 
                  className="btn btn-outline" 
                  onClick={handleDecline}
                  disabled={processing}
                >
                  {processing ? 'Processing...' : 'Decline'}
                </button>
                <button 
                  className="btn btn-primary" 
                  onClick={handleAccept}
                  disabled={processing}
                >
                  {processing ? (
                    <>
                      <span className="loading loading-spinner loading-xs"></span>
                      Joining...
                    </>
                  ) : "Accept & Join"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvitationResponse;