// ProtectedRoute.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/Api';

const ProtectedRoute = ({ children, allowedRoles }) => {
    const navigate = useNavigate();
    const [authorized, setAuthorized] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const verifyAuth = async () => {
            try {
                // Use your existing endpoint from userRoutes.js
                const response = await api.get('/api/users/getMe');
                
                // Check if user role is allowed
                if (!allowedRoles.includes(response.data.role)) {
                    navigate('/unauthorized');
                    return;
                }
                
                setAuthorized(true);
            } catch (error) {
                // Handle 401 or other errors
                navigate('/login');
            } finally {
                setLoading(false);
            }
        };
        
        verifyAuth();
    }, [navigate, allowedRoles]);

    if (loading) return <div className="text-center p-8">Loading...</div>;
    
    return authorized ? children : null;
};

export default ProtectedRoute; // Added missing export