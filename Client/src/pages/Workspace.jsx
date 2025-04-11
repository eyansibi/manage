import { useState, useEffect } from 'react';
import { useParams, Outlet, useNavigate, NavLink, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import useSession from '../hooks/useSession';
import api from '../utils/Api';

const WorkspaceLayout = () => {
  const { id } = useParams();
  const { user } = useSession();
  const [workspace, setWorkspace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const refreshWorkspace = async () => {
    try {
      const response = await api.get(`/api/workspaces/${id}?populate=projects`);
      setWorkspace(response.data);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to refresh workspace');
    }
  };

  useEffect(() => {
    const controller = new AbortController();
  
    const fetchWorkspace = async () => {
      try {
        const response = await api.get(`/api/workspaces/${id}?populate=projects`, {
          signal: controller.signal,
        });
        setWorkspace(response.data);
      } catch (err) {
        // Check for cancellation errors from Axios
        if (
          err.name === 'AbortError' ||
          err.code === 'ERR_CANCELED' ||
          (err.message && err.message.toLowerCase() === 'canceled')
        ) {
          return;
        }
        setError(err.response?.data?.error || 'Failed to load workspace');
        toast.error(err.response?.data?.error || 'Failed to load workspace');
        navigate('/acceuil');
      } finally {
        setLoading(false);
      }
    };
  
    fetchWorkspace();
  
    return () => controller.abort();
  }, [id, navigate]);
  

  if (loading) return <div className="text-center p-8">Loading workspace...</div>;
  if (error) return <div className="text-center p-8 text-error">{error}</div>;

  return (
    <div className="min-h-screen bg-base-100 font-poppins">
      {/* Main Navigation Bar */}
      <nav className="navbar bg-base-100 shadow-sm px-6">
        <div className="flex-1">
          <Link to="/acceuil" className="btn btn-ghost normal-case text-xl text-primary">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            
PlaniFy
          </Link>
        </div>
        
        <div className="flex-none gap-4">
          <div className="dropdown dropdown-end">
          <label tabIndex={0} className="btn btn-ghost btn-circle avatar">
  <div className="w-10 h-10 rounded-full bg-primary text-white overflow-hidden">
    {user?.profile_picture ? (
      <img src={user.profile_picture} alt="Profile" className="w-full h-full object-cover" />
    ) : (
      <div className="avatar">
      <div className="w-10 rounded-full">
        <span className="bg-primary text-white flex items-center justify-center h-full">
          {user?.name?.charAt(0).toUpperCase() || 'U'}
        </span>
      </div>
      </div>
    )}
  </div>
</label>
            <ul tabIndex={0} className="mt-3 z-[1] p-2 shadow menu menu-sm dropdown-content bg-base-100 rounded-box w-52">
              <li className="px-4 py-2 border-b">
                <span className="font-bold">{user?.name}</span>
              </li>
              <li><Link to="/profile">Profile Settings</Link></li>
              <li><Link to="/acceuil">Back to Dashboard</Link></li>
            </ul>
          </div>
        </div>
      </nav>

      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 min-h-screen bg-base-200 shadow-lg p-4 flex flex-col">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-primary mb-2">{workspace?.name}</h1>
            <p className="text-sm text-base-content opacity-75">{workspace?.description}</p>
          </div>

          <nav className="flex-1 space-y-2">
            <NavLink 
              to={`/workspace/${id}`} 
              end 
              className={({ isActive }) => 
                `flex items-center p-3 rounded-lg transition-colors ${
                  isActive ? 'bg-primary text-white' : 'hover:bg-base-300'
                }`
              }
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Overview
            </NavLink>

            <NavLink 
              to={`/workspace/${id}/projects`}
              className={({ isActive }) => 
                `flex items-center p-3 rounded-lg transition-colors ${
                  isActive ? 'bg-primary text-white' : 'hover:bg-base-300'
                }`
              }
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Projects
            </NavLink>

            <NavLink 
              to={`/workspace/${id}/tasks`}
              className={({ isActive }) => 
                `flex items-center p-3 rounded-lg transition-colors ${
                  isActive ? 'bg-primary text-white' : 'hover:bg-base-300'
                }`
              }
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              Tasks
            </NavLink>

                      <NavLink 
              to={`/workspace/${id}/members`}
              className={({ isActive }) => 
                `flex items-center p-3 rounded-lg transition-colors ${
                  isActive ? 'bg-primary text-white' : 'hover:bg-base-300'
                }`
              }
          >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              Members
          </NavLink>

            {workspace?.owner?._id === user?._id && (
              <NavLink 
                to={`/workspace/${id}/settings`}
                className={({ isActive }) => 
                  `flex items-center p-3 rounded-lg transition-colors ${
                    isActive ? 'bg-primary text-white' : 'hover:bg-base-300'
                  }`
                }
              >
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Settings
              </NavLink>
            )}
          </nav>

          <div className="mt-auto pt-4 border-t border-base-300">
            <div className="flex items-center space-x-3">
              <div className="avatar">
              <div className="w-10 rounded-full">
                {workspace?.owner?.profile_picture ? 
                  <img src={workspace.owner.profile_picture} alt="Profile" className="w-full h-full object-cover" />
                  : 
                <span className="bg-primary text-white flex items-center justify-center h-full">
                  {workspace?.owner?.name?.charAt(0).toUpperCase() || 'O'}
                </span> }
                </div>
              </div>
              <div>
                <p className="text-sm font-medium">Workspace Owner</p>
                <p className="text-sm text-base-content opacity-75">{workspace?.owner?.name}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8 bg-base-100">
          <div className="max-w-6xl mx-auto">
            <Outlet context={{ workspace, setWorkspace, refreshWorkspace }} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkspaceLayout;