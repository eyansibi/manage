import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/Api';
import { toast } from 'react-hot-toast';
import { FiEdit, FiUser, FiMail, FiPhone, FiFileText, FiLock, FiShield, FiImage, FiSave, FiX } from 'react-icons/fi';

const AdminProfile = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone_number: '',
        bio: '',
        role: '',
        two_factor_enabled: false,
        profile_picture: '',
    });

    // Simplification : utiliser la même logique que Dashboard.jsx et Listusers.jsx
    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await api.get('/api/users/getMe');
                
                if (response.data) {
                    setUser(response.data);
                    setFormData({
                        name: response.data.name || '',
                        email: response.data.email || '',
                        phone_number: response.data.phone_number || '',
                        bio: response.data.bio || '',
                        role: response.data.role || 'user',
                        two_factor_enabled: response.data.two_factor_enabled || false,
                        profile_picture: response.data.profile_picture || '',
                    });
                }
            } catch (error) {
                console.error("Erreur lors de la récupération des données utilisateur:", error);
                toast.error('Vous n\'êtes pas authentifié. Redirection vers la page de connexion.', {
                    style: {
                        background: '#f44336',
                        color: '#fff',
                        padding: '16px',
                        borderRadius: '0px'
                    }
                });
                navigate('/login');
            } finally {
                setLoading(false);
            }
        };
        
        fetchUser();
    }, [navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        toast.loading('Mise à jour du profil...', {
            style: {
                background: '#3498db',
                color: '#fff',
                padding: '16px',
                borderRadius: '0px'
            }
        });

        try {
            const response = await api.put('/api/users/updateMe', {
                name: formData.name,
                email: formData.email,
                phone_number: formData.phone_number,
                bio: formData.bio,
                profile_picture: formData.profile_picture
            });

            if (response.data) {
                const updatedUser = response.data.user || response.data;
                
                setUser(updatedUser);
                setFormData(prev => ({
                    ...prev,
                    ...updatedUser
                }));
                setIsEditing(false);

                toast.dismiss();
                toast.success('Profil mis à jour avec succès', {
                    style: {
                        background: '#4CAF50',
                        color: '#fff',
                        padding: '16px',
                        borderRadius: '0px'
                    }
                });
            }
        } catch (error) {
            console.error('Update error:', error);
            const errorMessage = error.response?.data?.error || 'Échec de la mise à jour du profil';

            toast.dismiss();
            toast.error(errorMessage, {
                style: {
                    background: '#f44336',
                    color: '#fff',
                    padding: '16px',
                    borderRadius: '0px'
                }
            });

            // Si l'erreur est due à une session expirée, rediriger après avoir montré le message
            if (error.response?.status === 401) {
                setTimeout(() => navigate('/login'), 2000);
            }
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-gradient-to-r from-[#0C0A1F] to-[#3C0B64] flex items-center justify-center">
            <div className="text-white text-xl font-semibold animate-pulse flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-10 w-10 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Chargement du profil...
            </div>
        </div>
    );

    // S'il n'y a toujours pas d'utilisateur après chargement, afficher un message d'erreur
    if (!user) {
        return (
            <div className="min-h-screen bg-gradient-to-r from-[#0C0A1F] to-[#3C0B64] flex items-center justify-center">
                <div className="bg-slate-800/80 p-8 rounded-xl max-w-md text-center">
                    <h2 className="text-2xl font-bold text-white mb-4">Session non valide</h2>
                    <p className="text-gray-300 mb-6">
                        Votre session semble être expirée ou vous n'êtes pas connecté.
                    </p>
                    <button
                        onClick={() => navigate('/login')}
                        className="btn btn-primary"
                    >
                        Se connecter
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-r from-[#0C0A1F] to-[#3C0B64] font-poppins">
            <div className="hero min-h-screen">
                <div className="hero-content flex-col lg:flex-row-reverse lg:gap-16 w-full max-w-6xl">
                    {/* Left Side - Profile Overview */}
                    <div className="text-center lg:text-left lg:w-1/2">
                        <div className="space-y-6">
                            <h1 className="text-4xl font-bold gradient-text">Profil Administrateur</h1>
                            <p className="py-4 text-lg text-white">
                                Gérez vos informations personnelles et vos paramètres de sécurité depuis cette page.
                            </p>

                            {!isEditing && (
                                <div className="mockup-window bg-base-300">
                                    <div className="flex flex-col items-center justify-center px-6 py-8 bg-base-200">
                                        <div className="avatar mb-6">
                                            <div className="w-28 h-28 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2 flex items-center justify-center bg-gradient-to-r from-purple-600 to-pink-600 text-4xl text-white font-bold">
                                                {formData.profile_picture ? (
                                                    <img src={formData.profile_picture} alt="Profile" className="w-full h-full object-cover" />
                                                ) : (
                                                    user.name?.charAt(0).toUpperCase() || 'A'
                                                )}
                                            </div>
                                        </div>
                                        <h2 className="text-2xl font-bold text-white mb-2">{user.name}</h2>
                                        <div className="badge badge-primary font-medium mb-4 capitalize">{user.role}</div>
                                        <p className="text-gray-300">{user.email}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Side - Profile Form */}
                    <div className="card flex-shrink-0 w-full lg:w-1/2 shadow-2xl bg-base-100 bg-opacity-20 backdrop-blur-sm">
                        <div className="card-body p-8 lg:p-10">
                            <div className="flex justify-between items-center mb-8">
                                <h2 className="text-2xl font-bold text-white">
                                    {isEditing ? "Modifier le profil" : "Informations du profil"}
                                </h2>
                                {!isEditing && (
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="btn btn-sm btn-primary gap-2"
                                    >
                                        <FiEdit /> Modifier
                                    </button>
                                )}
                            </div>

                            {!isEditing ? (
                                <div className="space-y-6">
                                    <InfoField icon={<FiUser />} label="Nom" value={user.name} />
                                    <InfoField icon={<FiMail />} label="Email" value={user.email} />
                                    <InfoField icon={<FiPhone />} label="Téléphone" value={user.phone_number || 'Non renseigné'} />
                                    <InfoField icon={<FiFileText />} label="Biographie" value={user.bio || 'Aucune biographie'} />
                                    <InfoField icon={<FiLock />} label="Rôle" value={user.role} isCapitalized={true} />
                                    <InfoField
                                        icon={<FiShield />}
                                        label="Authentification à deux facteurs"
                                        value={user.two_factor_enabled ? 'Activée' : 'Désactivée'}
                                        isColored={true}
                                        isEnabled={user.two_factor_enabled}
                                    />
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text text-white flex items-center gap-2">
                                                <FiUser /> Nom
                                            </span>
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                                            className="input input-bordered bg-base-200 text-white"
                                            required
                                        />
                                    </div>

                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text text-white flex items-center gap-2">
                                                <FiMail /> Email
                                            </span>
                                        </label>
                                        <input
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                                            className="input input-bordered bg-base-200 text-white"
                                            required
                                        />
                                    </div>

                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text text-white flex items-center gap-2">
                                                <FiPhone /> Téléphone
                                            </span>
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.phone_number}
                                            onChange={(e) => setFormData({...formData, phone_number: e.target.value})}
                                            className="input input-bordered bg-base-200 text-white"
                                        />
                                    </div>

                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text text-white flex items-center gap-2">
                                                <FiFileText /> Biographie
                                            </span>
                                        </label>
                                        <textarea
                                            value={formData.bio}
                                            onChange={(e) => setFormData({...formData, bio: e.target.value})}
                                            className="textarea textarea-bordered bg-base-200 text-white"
                                            rows="3"
                                        />
                                    </div>

                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text text-white flex items-center gap-2">
                                                <FiImage /> URL de l'image de profil
                                            </span>
                                        </label>

                                    </div>

                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text text-white flex items-center gap-2">
                                                <FiLock /> Rôle
                                            </span>
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.role}
                                            className="input input-bordered bg-base-200 text-white opacity-70"
                                            disabled
                                        />
                                        <label className="label">
                                            <span className="label-text-alt text-gray-400">Le rôle ne peut pas être modifié</span>
                                        </label>
                                    </div>

                                    <div className="flex gap-4 mt-8">
                                        <button
                                            type="button"
                                            onClick={() => setIsEditing(false)}
                                            className="btn btn-outline flex-1 gap-2"
                                        >
                                            <FiX /> Annuler
                                        </button>
                                        <button
                                            type="submit"
                                            className="btn btn-primary flex-1 gap-2"
                                        >
                                            <FiSave /> Enregistrer
                                        </button>
                                    </div>
                                </form>
                            )}

                            <div className="divider my-8">Naviguer</div>

                            <div className="flex flex-col space-y-3">
                                <Link to="/dashboard" className="btn btn-outline btn-primary w-full">
                                    Retour au tableau de bord
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Style pour le texte en dégradé */}
            <style>{`
                .gradient-text {
                    background: linear-gradient(
                        to right,
                        #4f46e5, /* Indigo */
                        #8b5cf6, /* Violet */
                        #ec4899, /* Pink */
                        #3b82f6, /* Blue */
                        #4f46e5  /* Back to indigo */
                    );
                    background-size: 200% auto;
                    color: transparent;
                    -webkit-background-clip: text;
                    background-clip: text;
                    animation: shine 8s linear infinite;
                    transition: all 0.3s ease;
                }

                @keyframes shine {
                    to {
                        background-position: 200% center;
                    }
                }

                .gradient-text:hover {
                    animation-duration: 3s;
                }

                .gradient-text {
                    text-shadow: 0 2px 10px rgba(79, 70, 229, 0.15);
                }
            `}</style>
        </div>
    );
};

// Composant pour afficher les champs d'information
const InfoField = ({ icon, label, value, isCapitalized = false, isColored = false, isEnabled = false }) => {
    return (
        <div className="p-4 bg-base-300 bg-opacity-50 rounded-lg">
            <label className="text-sm text-gray-400 flex items-center gap-2 mb-1">
                {icon} {label}
            </label>
            <p className={`font-medium text-white ${isCapitalized ? 'capitalize' : ''} ${isColored ? (isEnabled ? 'text-green-400' : 'text-yellow-400') : ''}`}>
                {value}
            </p>
        </div>
    );
};

export default AdminProfile;
