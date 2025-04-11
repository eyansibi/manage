import { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import api from '../../utils/Api';
import useSession from '../../hooks/useSession';
import { hasPermission } from '../../utils/permissionUtils';

const WorkspaceSettings = () => {
  const { workspace, refreshWorkspace } = useOutletContext() || {};
  const { user } = useSession();
  const navigate = useNavigate();
  
  const [isLoading, setIsLoading] = useState(false);
  const [generalSettings, setGeneralSettings] = useState({
    name: workspace?.name || '',
    description: workspace?.description || '',
    visibility: workspace?.visibility || 'private',
  });
  
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  
// Fix: Handle both object and string formats of workspace.owner
useEffect(() => {
  if (workspace && user) {

    const ownerId = typeof workspace.owner === 'object' 
      ? workspace.owner?._id?.toString() 
      : workspace.owner?.toString();
      
    const userId = user._id?.toString();

    
    if (ownerId !== userId) {
      toast.error("Only the workspace owner can access settings");
      navigate(`/workspace/${workspace._id}/overview`);
    }
  }
}, [workspace, user, navigate]);
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setGeneralSettings(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSaveGeneral = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Validate required fields
      if (!generalSettings.name.trim()) {
        toast.error('Workspace name is required');
        setIsLoading(false);
        return;
      }
      
      // Create data object in the same format as your working implementation
      const workspaceData = {
        name: generalSettings.name.trim(),
        description: generalSettings.description.trim(),
        // Include the owner ID - this is likely required by your API
        owner: typeof workspace.owner === 'object' 
          ? workspace.owner._id 
          : workspace.owner
      };
      
      console.log("Sending data:", workspaceData);
      
      // Use the same endpoint and data format that works in WorkspaceOverview
      const response = await api.put(`/api/workspaces/updateWorkspace/${workspace._id}`, workspaceData);
      
      if (response.data) {
        toast.success("Workspace settings updated successfully");
        refreshWorkspace();
      }
    } catch (error) {
      console.error("Error updating workspace:", error);
      // Use the same error handling that works in WorkspaceOverview
      if (error.response?.data?.errors) {
        error.response.data.errors.forEach(msg => toast.error(msg));
      } else {
        toast.error(error.response?.data?.message || "Failed to update workspace settings");
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDeleteWorkspace = async () => {
    if (deleteConfirmation !== workspace.name) {
      toast.error("Workspace name doesn't match");
      return;
    }
    
    setIsDeleting(true);
    try {
      await api.delete(`/api/workspaces/${workspace._id}`);
      toast.success("Workspace deleted successfully");
      navigate("/acceuil");
    } catch (error) {
      console.error("Error deleting workspace:", error);
      toast.error(error.response?.data?.message || "Failed to delete workspace");
      setIsDeleting(false);
    }
  };
  
  return (
    <div className="space-y-8">
      <ToastContainer />
      
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-base-100 rounded-lg shadow-xl p-6 max-w-md w-full">
            <h3 className="font-bold text-lg text-error mb-4">Delete Workspace</h3>
            <p className="mb-6">
              This action cannot be undone. This will permanently delete the <strong>{workspace.name}</strong> workspace and all associated projects, tasks, and data.
            </p>
            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text">Please type <strong>{workspace.name}</strong> to confirm</span>
              </label>
              <input
                type="text"
                value={deleteConfirmation}
                onChange={e => setDeleteConfirmation(e.target.value)}
                placeholder="Enter workspace name"
                className="input input-bordered w-full"
              />
            </div>
            <div className="flex justify-end gap-4">
              <button 
                className="btn btn-outline" 
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button 
                className="btn btn-error" 
                onClick={handleDeleteWorkspace}
                disabled={deleteConfirmation !== workspace.name || isDeleting}
              >
                {isDeleting ? (
                  <>
                    <span className="loading loading-spinner loading-xs"></span>
                    Deleting...
                  </>
                ) : "Delete Workspace"}
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Workspace Settings</h1>
      </div>
      
      {/* General Settings */}
      <div className="card bg-base-200 shadow-xl">
        <div className="card-body">
          <h2 className="card-title text-xl mb-4">General Settings</h2>
          <form onSubmit={handleSaveGeneral}>
            <div className="space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Workspace Name</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={generalSettings.name}
                  onChange={handleInputChange}
                  className="input input-bordered w-full"
                  required
                />
              </div>
              
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Description</span>
                </label>
                <textarea
                  name="description"
                  value={generalSettings.description}
                  onChange={handleInputChange}
                  className="textarea textarea-bordered h-24"
                />
              </div>
              
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Visibility</span>
                </label>
                <select 
                  name="visibility"
                  value={generalSettings.visibility}
                  onChange={handleInputChange}
                  className="select select-bordered w-full"
                >
                  <option value="private">Private - Only invited members can access</option>
                  <option value="public">Public - Anyone with the link can view</option>
                </select>
              </div>
              
              <div className="form-control mt-6">
                <button 
                  className="btn btn-primary" 
                  type="submit"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <span className="loading loading-spinner loading-xs"></span>
                      Saving...
                    </>
                  ) : "Save Changes"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
      
      {/* Advanced */}
      <div className="card bg-base-200 shadow-xl">
        <div className="card-body">
          <h2 className="card-title text-xl mb-4">Advanced Settings</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">Export Workspace Data</h3>
              <p className="text-sm opacity-70 mb-3">
                Download all workspace data including projects, tasks, and comments.
              </p>
              <button className="btn btn-outline btn-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Export Data
              </button>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">Archive Workspace</h3>
              <p className="text-sm opacity-70 mb-3">
                Archive this workspace to hide it from active workspaces. You can restore it later.
              </p>
              <button className="btn btn-outline btn-warning btn-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
                Archive Workspace
              </button>
            </div>
            
            <div className="pt-4 border-t border-base-300">
              <h3 className="font-semibold text-error mb-2">Danger Zone</h3>
              <p className="text-sm opacity-70 mb-3">
                Permanently delete this workspace and all of its contents.
                This action cannot be undone.
              </p>
              <button 
                className="btn btn-error btn-sm"
                onClick={() => setShowDeleteModal(true)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete Workspace
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Notifications */}
      <div className="card bg-base-200 shadow-xl">
        <div className="card-body">
          <h2 className="card-title text-xl mb-4">Notification Settings</h2>
          
          <div className="space-y-4">
            <div className="form-control">
              <label className="cursor-pointer label justify-start gap-4">
                <input type="checkbox" className="toggle toggle-primary" defaultChecked />
                <span>Email notifications for new comments</span>
              </label>
            </div>
            
            <div className="form-control">
              <label className="cursor-pointer label justify-start gap-4">
                <input type="checkbox" className="toggle toggle-primary" defaultChecked />
                <span>Email notifications for task assignments</span>
              </label>
            </div>
            
            <div className="form-control">
              <label className="cursor-pointer label justify-start gap-4">
                <input type="checkbox" className="toggle toggle-primary" defaultChecked />
                <span>Email digests for workspace activity</span>
              </label>
            </div>
            
            <div className="form-control">
              <label className="cursor-pointer label justify-start gap-4">
                <input type="checkbox" className="toggle toggle-primary" />
                <span>Push notifications for deadlines</span>
              </label>
            </div>
          </div>
        </div>
      </div>
      
      {/* Integrations */}
      <div className="card bg-base-200 shadow-xl">
        <div className="card-body">
          <h2 className="card-title text-xl mb-4">Integrations</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="card bg-base-100">
              <div className="card-body">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-blue-100 p-3">
                    <svg className="w-6 h-6 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-9.294h-3.128v-3.622h3.128v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12v9.293h6.116c.73 0 1.323-.593 1.323-1.325v-21.35c0-.732-.593-1.325-1.325-1.325z"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold">Connect with Slack</h3>
                    <p className="text-xs opacity-70">Get notifications in your Slack channels</p>
                  </div>
                </div>
                <div className="card-actions justify-end mt-4">
                  <button className="btn btn-sm btn-outline">Connect</button>
                </div>
              </div>
            </div>
            
            <div className="card bg-base-100">
              <div className="card-body">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-blue-100 p-3">
                    <svg className="w-6 h-6 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold">Connect with GitHub</h3>
                    <p className="text-xs opacity-70">Link repositories to your projects</p>
                  </div>
                </div>
                <div className="card-actions justify-end mt-4">
                  <button className="btn btn-sm btn-outline">Connect</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Appearance */}
      <div className="card bg-base-200 shadow-xl mb-8">
        <div className="card-body">
          <h2 className="card-title text-xl mb-4">Appearance</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Theme</h3>
              <div className="flex gap-3">
                <button className="btn btn-sm btn-outline">Light</button>
                <button className="btn btn-sm btn-outline">Dark</button>
                <button className="btn btn-sm btn-outline">System</button>
              </div>
            </div>
            

            <div>
              <h3 className="font-semibold mb-2">Accent Color</h3>
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-primary cursor-pointer border-2 border-base-content"></div>
                <div className="w-8 h-8 rounded-full bg-secondary cursor-pointer"></div>
                <div className="w-8 h-8 rounded-full bg-accent cursor-pointer"></div>
                <div className="w-8 h-8 rounded-full bg-info cursor-pointer"></div>
                <div className="w-8 h-8 rounded-full bg-success cursor-pointer"></div>
                <div className="w-8 h-8 rounded-full bg-warning cursor-pointer"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkspaceSettings;