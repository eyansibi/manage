// Email verification component
import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const EmailVerification = () => {
    const [verificationCode, setVerificationCode] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    
    // Get userId from URL parameters or localStorage
    const userId = new URLSearchParams(window.location.search).get('userId') || localStorage.getItem('userId');
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        
        try {
            // Your verification API call
            const response = await api.post('/api/auth/verify-email', {
              code,
              userId: localStorage.getItem('userId')
            });
            
            // On successful verification
            toast.success('Email verified successfully!');
            
            // Clear any previous form data and state
            localStorage.removeItem('userId');
            
            // Redirect to login with a success param
            navigate('/login?verified=true');
          } catch (error) {
            toast.error('Verification failed. Please try again.');
          }finally {
            setLoading(false);
        }
    };
    
    return (
        <div className="verification-container">
            <h2>Vérification de votre adresse email</h2>
            <p>Veuillez saisir le code de vérification que nous avons envoyé à votre adresse email.</p>
            
            {error && <div className="error-message">{error}</div>}
            
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Code de vérification</label>
                    <input 
                        type="text" 
                        value={verificationCode} 
                        onChange={(e) => setVerificationCode(e.target.value)}
                        placeholder="Entrez le code à 6 chiffres"
                        required
                    />
                </div>
                
                <button type="submit" disabled={loading}>
                    {loading ? 'Vérification en cours...' : 'Vérifier'}
                </button>
            </form>
        </div>
    );
};

export default EmailVerification;