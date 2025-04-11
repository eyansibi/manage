/**
 * Get the user's role in a workspace
 * @param {Object} workspace - The workspace object
 * @param {String} userId - The user's ID
 * @returns {String} - 'owner', 'admin', 'editor', 'viewer' or null
 */
export const getUserRole = (workspace, userId) => {
    if (!workspace || !userId) return null;
    
    // Check if user is the owner
    if (workspace.owner === userId || 
        workspace.owner?._id === userId || 
        workspace.owner?.toString() === userId) {
      return 'owner';
    }
    
    // Check user's role in members array
    const member = workspace.members?.find(m => 
      m.user === userId || 
      m.user?._id === userId || 
      m.user?.toString() === userId
    );
    
    return member?.role || null;
  };
  
  /**
   * Check if user has specific permission
   * @param {String} permission - 'view', 'edit', 'delete', 'invite'
   * @param {Object} workspace - Workspace object
   * @param {String} userId - User ID
   * @returns {Boolean} - Whether user has permission
   */
  export const hasPermission = (permission, workspace, userId) => {
    const role = getUserRole(workspace, userId);
    
    if (!role) return false;
    
    const permissions = {
      owner: ['view', 'edit', 'delete', 'invite'],
      admin: ['view', 'edit', 'invite'],
      editor: ['view', 'edit', 'invite'],
      viewer: ['view']
    };
    
    return permissions[role]?.includes(permission) || false;
  };