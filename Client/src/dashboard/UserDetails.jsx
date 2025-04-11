import api from '../utils/Api';
import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiHome, FiUser, FiSettings, FiLogOut, FiList, FiEdit, FiTrash2, FiCheck, FiMail, FiPhone, FiInfo, FiShield, FiCalendar, FiClock, FiLock } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

const UserDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [activeTab, setActiveTab] = useState('profile'); // 'profile', 'security', 'activity'
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone_number: '',
        bio: '',
        password: '',
        role: ''
    });

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await api.get(`/api/users/getUser/${id}`);
                setUser(response.data);
                setFormData({
                    name: response.data.name || '',
                    email: response.data.email || '',
                    phone_number: response.data.phone_number || '',
                    bio: response.data.bio || '',
                    password: '',
                    role: response.data.role || 'user'
                });
            } catch (err) {
                setError("Utilisateur non trouvé");
            } finally {
                setLoading(false);
            }
        };
        fetchUser();
    }, [id]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
    
        // Au lieu d'envoyer uniquement les champs modifiés, envoyer tous les champs
        // car la validation côté serveur attend tous les champs obligatoires
        const updatedData = {
            name: formData.name,
            email: formData.email,
            role: formData.role,
            phone_number: formData.phone_number || '',
            bio: formData.bio || ''
        };
        
        // N'ajouter le mot de passe que s'il a été fourni
        if (formData.password && formData.password.trim() !== '') {
            updatedData.password = formData.password;
        }
        
        // Log pour déboguer
        console.log('Updating user with:', updatedData);
        
        try {
            const response = await api.put(`/api/users/updateUser/${id}`, updatedData, {
                headers: { "Content-Type": "application/json" }
            });
            
            console.log('Update response:', response.data);
    
            // Show success notification
            const notification = document.getElementById('notification');
            notification.classList.remove('opacity-0');
            notification.classList.add('opacity-100');
    
            setTimeout(() => {
                notification.classList.remove('opacity-100');
                notification.classList.add('opacity-0');
            }, 3000);
    
            // Refresh user data
            const userResponse = await api.get(`/api/users/getUser/${id}`);
            setUser(userResponse.data);
            setShowForm(false);
        } catch (error) {
            console.error("Update error:", error);
            console.error("Error details:", error.response?.data || "No detailed error");
            alert("Erreur lors de la mise à jour: " + (error.response?.data?.message || error.message || "Erreur inconnue"));
        }
    };

    const handleDeleteUser = async () => {
        try {
            await api.delete(`/api/users/deleteUser/${id}`);
            navigate('/dashboard/listusers');
        } catch (error) {
            console.error("Erreur lors de la suppression:", error);
            alert("Erreur lors de la suppression: " + (error.response?.data?.message || "Erreur inconnue"));
        }
    };

    const handleLogout = async () => {
        try {
            await api.get('/api/auth/logout');
            navigate('/login');
        } catch (error) {
            console.error('Erreur lors de la déconnexion:', error);
        }
    };

    // Animation variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { duration: 0.4 }
        },
        exit: { opacity: 0 }
    };

    const formVariants = {
        hidden: { opacity: 0, y: -50 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                type: "spring",
                stiffness: 300,
                damping: 30
            }
        },
        exit: {
            opacity: 0,
            y: -50,
            transition: { duration: 0.2 }
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center min-h-screen bg-gradient-to-r from-[#0C0A1F] to-[#3C0B64]">
            <div className="text-white text-xl font-semibold animate-pulse flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-10 w-10 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Chargement des détails utilisateur...
            </div>
        </div>
    );

    if (error) return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-[#0C0A1F] to-[#3C0B64] p-6">
            <div className="bg-red-900/40 text-red-100 p-6 rounded-xl max-w-md text-center shadow-lg">
                <h2 className="text-2xl font-bold mb-4">Erreur</h2>
                <p className="mb-6">{error}</p>
                <Link
                    to="/dashboard/listusers"
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg inline-flex items-center transition-all duration-200"
                >
                    <FiArrowLeft className="mr-2" /> Retour à la liste
                </Link>
            </div>
        </div>
    );

    return (
        <div className="flex min-h-screen bg-gradient-to-r from-[#0C0A1F] to-[#3C0B64] font-poppins">
            {/* Notification de succès */}
            <div id="notification" className="fixed top-4 right-4 bg-green-500 text-white p-3 rounded-lg shadow-lg transition-opacity duration-300 opacity-0 z-50 flex items-center">
                <FiCheck className="mr-2" /> Profil mis à jour avec succès!
            </div>

            {/* Sidebar avec design amélioré */}
            <aside className="w-64 bg-slate-900 text-white shadow-md min-h-screen p-5 flex flex-col">
                <div className="mb-10">
                    <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">ProjectFlow</h2>
                    <p className="text-xs text-gray-400">Système d'administration</p>
                </div>

                <nav className="flex-grow">
                    <ul className="space-y-2">
                        <li>
                            <Link to="/dashboard" className="flex items-center p-3 hover:bg-purple-600 hover:bg-opacity-50 rounded-md transition-all duration-200">
                                <FiHome className="mr-2" /> Dashboard
                            </Link>
                        </li>
                        <li>
                            <Link to="/dashboard/listusers" className="flex items-center p-3 hover:bg-purple-600 hover:bg-opacity-50 rounded-md transition-all duration-200">
                                <FiList className="mr-2" /> Liste Utilisateurs
                            </Link>
                        </li>
                        <li>
                            <Link to="/dashboard/AdminProfile" className="flex items-center p-3 hover:bg-purple-600 hover:bg-opacity-50 rounded-md transition-all duration-200">
                                <FiUser className="mr-2" /> Profil
                            </Link>
                        </li>
                        <li>
                            <Link to="/settings" className="flex items-center p-3 hover:bg-purple-600 hover:bg-opacity-50 rounded-md transition-all duration-200">
                                <FiSettings className="mr-2" /> Paramètres
                            </Link>
                        </li>
                    </ul>
                </nav>

                <div className="mt-auto pt-5 border-t border-gray-700">
                    <button
                        onClick={handleLogout}
                        className="flex w-full items-center p-3 text-red-400 hover:bg-red-900 hover:bg-opacity-30 rounded-md transition-all duration-200"
                    >
                        <FiLogOut className="mr-2" /> Déconnexion
                    </button>
                </div>
            </aside>

            {/* Main Content avec design amélioré */}
            <div className="flex-1 p-6 overflow-y-auto">
                <header className="mb-8">
                    <div className="flex items-center mb-2">
                        <Link
                            to="/dashboard/listusers"
                            className="text-gray-400 hover:text-white flex items-center mr-4 transition-colors"
                        >
                            <FiArrowLeft className="mr-2" /> Retour
                        </Link>
                        <h1 className="text-3xl font-bold text-white bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
                            Profil Utilisateur
                        </h1>
                    </div>
                    <p className="text-gray-400">Détails et gestion du compte {user.name}</p>
                </header>

                {/* User Actions Bar */}
                <div className="flex flex-wrap justify-between items-center mb-8 gap-4">
                    <div className="flex items-center space-x-4">
                        <div className="bg-gradient-to-br from-purple-600 to-pink-600 h-16 w-16 rounded-xl flex items-center justify-center text-2xl font-bold text-white shadow-lg overflow-hidden">
                            {user.profile_picture ? (
                                <img
                                    src={user.profile_picture}
                                    alt={user.name}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.style.display = 'none';
                                        e.target.parentNode.innerHTML = `<div class="bg-gradient-to-br from-purple-600 to-blue-600 text-white flex items-center justify-center h-full w-full">${user.name.charAt(0).toUpperCase()}</div>`;
                                    }}
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    {user.name.charAt(0).toUpperCase()}
                                </div>
                            )}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white flex items-center">
                                {user.name}
                                {user.isVerified && (
                                    <span className="ml-2 bg-green-900/50 text-green-300 text-xs px-2 py-1 rounded-full">Vérifié</span>
                                )}
                            </h2>
                            <p className="text-gray-400">{user.email}</p>
                            <p className="text-sm text-gray-500">ID: {user._id}</p>
                        </div>
                    </div>
                    <div className="flex space-x-3">
                        <button
                            onClick={() => setShowForm(!showForm)}
                            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-2 rounded-lg flex items-center shadow-md hover:shadow-purple-500/20 transition-all duration-200"
                        >
                            <FiEdit className="mr-2"/> Modifier
                        </button>
                        <button
                            onClick={() => setShowDeleteConfirm(true)}
                            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center shadow-md transition-all duration-200"
                        >
                            <FiTrash2 className="mr-2"/> Supprimer
                        </button>
                    </div>
                </div>

                {/* Navigation tabs */}
                <div className="mb-6">
                    <div className="flex border-b border-gray-700">
                        <button
                            className={`px-6 py-3 font-medium ${activeTab === 'profile' ?
                                'text-purple-400 border-b-2 border-purple-400' :
                                'text-gray-400 hover:text-white'}`}
                            onClick={() => setActiveTab('profile')}
                        >
                            Profil
                        </button>
                        <button
                            className={`px-6 py-3 font-medium ${activeTab === 'security' ?
                                'text-purple-400 border-b-2 border-purple-400' :
                                'text-gray-400 hover:text-white'}`}
                            onClick={() => setActiveTab('security')}
                        >
                            Sécurité
                        </button>
                        <button
                            className={`px-6 py-3 font-medium ${activeTab === 'activity' ?
                                'text-purple-400 border-b-2 border-purple-400' :
                                'text-gray-400 hover:text-white'}`}
                            onClick={() => setActiveTab('activity')}
                        >
                            Activité
                        </button>
                    </div>
                </div>

                {/* Conditional content based on active tab */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        variants={containerVariants}
                    >
                        {activeTab === 'profile' && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Personal Info */}
                                <div
                                    className="bg-slate-800/60 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-700 hover:shadow-purple-900/10 transition-all duration-300">
                                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                                        <FiUser className="mr-2 text-purple-400"/> Informations personnelles
                                    </h3>
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-xs text-gray-400">Nom complet</p>
                                            <p className="font-medium text-white">{user.name}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400">Email</p>
                                            <div className="flex items-center">
                                                <p className="font-medium text-white mr-2">{user.email}</p>
                                                {user.isVerified ? (
                                                    <span
                                                        className="bg-green-900/50 text-green-300 text-xs px-2 py-0.5 rounded">Vérifié</span>
                                                ) : (
                                                    <span
                                                        className="bg-red-900/50 text-red-300 text-xs px-2 py-0.5 rounded">Non vérifié</span>
                                                )}
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400">Téléphone</p>
                                            <p className="font-medium text-white">{user.phone_number || "Non renseigné"}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400">Biographie</p>
                                            <p className="font-medium text-white bg-slate-700/50 p-3 rounded-lg">
                                                {user.bio || "Aucune biographie définie"}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Role & Status */}
                                <div
                                    className="bg-slate-800/60 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-700 hover:shadow-purple-900/10 transition-all duration-300">
                                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                                        <FiInfo className="mr-2 text-blue-400"/> Rôle et statut
                                    </h3>
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-xs text-gray-400">Rôle</p>
                                            <div className="font-medium">
                                                {user.role === 'admin' ?
                                                    <span
                                                        className="bg-purple-900/50 text-purple-300 px-2 py-1 rounded-lg">Administrateur</span> :
                                                    <span
                                                        className="bg-blue-900/50 text-blue-300 px-2 py-1 rounded-lg">Utilisateur</span>
                                                }
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400">Statut du compte</p>
                                            <div className="font-medium">
                                                {user.isActive ?
                                                    <span
                                                        className="bg-green-900/50 text-green-300 px-2 py-1 rounded-lg">Actif</span> :
                                                    <span
                                                        className="bg-red-900/50 text-red-300 px-2 py-1 rounded-lg">Inactif</span>
                                                }
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400">Date de création</p>
                                            <p className="font-medium text-white">
                                                {user.createdAt ? new Date(user.createdAt).toLocaleDateString('fr-FR', {
                                                    day: 'numeric',
                                                    month: 'long',
                                                    year: 'numeric'
                                                }) : "Non disponible"}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Workspace Info */}
                                <div
                                    className="bg-slate-800/60 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-700 hover:shadow-purple-900/10 transition-all duration-300">
                                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                                        <FiMail className="mr-2 text-amber-400"/> Espaces de travail
                                    </h3>
                                    <div>
                                        {user.workspaces && user.workspaces.length > 0 ? (
                                            <ul className="space-y-2">
                                                {user.workspaces.map((workspace) => (
                                                    <li key={workspace._id}
                                                        className="bg-slate-700/50 p-2 px-3 rounded-lg text-white">
                                                        {workspace.name}
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <div className="bg-slate-700/30 p-4 rounded-lg text-center">
                                                <p className="text-gray-400">Aucun espace de travail</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                            </div>
                        )}

                        {activeTab === 'security' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Authentication */}
                                <div
                                    className="bg-slate-800/60 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-700 hover:shadow-purple-900/10 transition-all duration-300">
                                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                                        <FiShield className="mr-2 text-purple-400"/> Authentification
                                    </h3>
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-xs text-gray-400">Méthode d'authentification</p>
                                            <p className="font-medium text-white">
                                                {user.authentication_method || "Standard"}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400">Authentification à deux facteurs</p>
                                            <p className="font-medium">
                                                {user.two_factor_enabled ?
                                                    <span className="text-green-400">Activée</span> :
                                                    <span className="text-yellow-400">Désactivée</span>
                                                }
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400">Dernière modification du mot de passe</p>
                                            <p className="font-medium text-white">
                                                {user.passwordChangedAt ?
                                                    new Date(user.passwordChangedAt).toLocaleString() :
                                                    "Jamais"}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Session Info */}
                                <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-700 hover:shadow-purple-900/10 transition-all duration-300">
                                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                                        <FiClock className="mr-2 text-blue-400" /> Informations de session
                                    </h3>
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-xs text-gray-400">Dernière connexion</p>
                                            <p className="font-medium text-white">
                                                {user.last_login ?
                                                    new Date(user.last_login).toLocaleString() :
                                                    "Jamais"}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400">Dernière activité</p>
                                            <p className="font-medium text-white">
                                                {user.lastActive ?
                                                    new Date(user.lastActive).toLocaleString() :
                                                    "Aucune activité enregistrée"}
                                            </p>
                                        </div>
                                        <div>
                                            <button className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg text-sm transition-colors mt-2">
                                                <FiLock className="inline mr-2"/> Réinitialiser le mot de passe
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'activity' && (
                            <div className="grid grid-cols-1 gap-6">
                                <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-700 hover:shadow-purple-900/10 transition-all duration-300">
                                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                                        <FiCalendar className="mr-2 text-amber-400" /> Activité récente
                                    </h3>
                                    <div className="space-y-4">
                                        <div className="flex flex-col space-y-4">
                                            {/* Ce serait idéal d'avoir de vraies données d'activité ici */}
                                            <div className="p-3 bg-slate-700/50 rounded-lg">
                                                <div className="flex justify-between">
                                                    <span className="text-white font-medium">Connexion réussie</span>
                                                    <span className="text-gray-400 text-sm">{user.last_login ? new Date(user.last_login).toLocaleString() : "N/A"}</span>
                                                </div>
                                                <p className="text-sm text-gray-400 mt-1">L'utilisateur s'est connecté avec succès au système</p>
                                            </div>

                                            <div className="p-3 bg-slate-700/50 rounded-lg">
                                                <div className="flex justify-between">
                                                    <span className="text-white font-medium">Modification du profil</span>
                                                    <span className="text-gray-400 text-sm">{user.updatedAt ? new Date(user.updatedAt).toLocaleString() : "N/A"}</span>
                                                </div>
                                                <p className="text-sm text-gray-400 mt-1">Des informations du profil ont été mises à jour</p>
                                            </div>

                                            <div className="p-3 bg-slate-700/50 rounded-lg">
                                                <div className="flex justify-between">
                                                    <span className="text-white font-medium">Création du compte</span>
                                                    <span className="text-gray-400 text-sm">{user.createdAt ? new Date(user.createdAt).toLocaleString() : "N/A"}</span>
                                                </div>
                                                <p className="text-sm text-gray-400 mt-1">Le compte utilisateur a été créé</p>
                                            </div>
                                        </div>
                                        <div className="text-center mt-4">
                                            <button className="text-purple-400 hover:text-purple-300 text-sm">
                                                Voir plus d'activités →
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>

                {/* Edit User Form (displayed when showForm is true) */}
                <AnimatePresence>
                    {showForm && (
                        <motion.div
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            variants={formVariants}
                            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4"
                        >
                            <div className="bg-slate-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                                <div className="p-6 border-b border-gray-700">
                                    <div className="flex justify-between items-center">
                                        <h2 className="text-xl font-semibold text-white flex items-center">
                                            <FiEdit className="mr-2 text-purple-400"/> Modifier l'utilisateur
                                        </h2>
                                        <button
                                            onClick={() => setShowForm(false)}
                                            className="text-gray-400 hover:text-white transition-colors text-xl"
                                        >
                                            &times;
                                        </button>
                                    </div>
                                </div>
                                <div className="p-6">
                                    <form onSubmit={handleUpdate}>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block mb-2 text-sm font-medium text-gray-300">Nom</label>
                                                <input
                                                    type="text"
                                                    name="name"
                                                    value={formData.name}
                                                    onChange={handleInputChange}
                                                    className="w-full p-2.5 bg-slate-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block mb-2 text-sm font-medium text-gray-300">Email</label>
                                                <input
                                                    type="email"
                                                    name="email"
                                                    value={formData.email}
                                                    onChange={handleInputChange}
                                                    className="w-full p-2.5 bg-slate-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block mb-2 text-sm font-medium text-gray-300">Téléphone</label>
                                                <input
                                                    type="text"
                                                    name="phone_number"
                                                    value={formData.phone_number}
                                                    onChange={handleInputChange}
                                                    className="w-full p-2.5 bg-slate-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                                />
                                            </div>
                                            <div>
                                                <label className="block mb-2 text-sm font-medium text-gray-300">Rôle</label>
                                                <select
                                                    name="role"
                                                    value={formData.role}
                                                    onChange={handleInputChange}
                                                    className="w-full p-2.5 bg-slate-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                                >
                                                    <option value="user">Utilisateur</option>
                                                    <option value="admin">Administrateur</option>
                                                </select>
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block mb-2 text-sm font-medium text-gray-300">Biographie</label>
                                                <textarea
                                                    name="bio"
                                                    value={formData.bio}
                                                    onChange={handleInputChange}
                                                    rows="3"
                                                    className="w-full p-2.5 bg-slate-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                                ></textarea>
                                            </div>
                                            <div>
                                                <label className="block mb-2 text-sm font-medium text-gray-300">
                                                    Nouveau mot de passe
                                                </label>
                                                <input
                                                    type="password"
                                                    name="password"
                                                    value={formData.password}
                                                    onChange={handleInputChange}
                                                    className="w-full p-2.5 bg-slate-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                                    placeholder="Laisser vide pour conserver le mot de passe actuel"
                                                />
                                                <p className="mt-1 text-xs text-gray-400">
                                                    Pour des raisons de sécurité, nous ne pouvons pas afficher le mot de passe existant.
                                                </p>
                                            </div>
                                        </div>
                                        <div className="mt-6 flex justify-end space-x-3">
                                            <button
                                                type="button"
                                                onClick={() => setShowForm(false)}
                                                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                                            >
                                                Annuler
                                            </button>
                                            <button
                                                type="submit"
                                                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition-colors"
                                            >
                                                Enregistrer
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Delete Confirmation Modal */}
                <AnimatePresence>
                    {showDeleteConfirm && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4"
                        >
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                className="bg-slate-800 rounded-xl shadow-xl max-w-md w-full p-6"
                            >
                                <h3 className="text-xl font-bold text-white mb-4">Confirmer la suppression</h3>
                                <p className="text-gray-300 mb-6">
                                    Êtes-vous sûr de vouloir supprimer l'utilisateur <span className="font-semibold text-white">{user.name}</span> ? Cette action est irréversible.
                                </p>
                                <div className="flex justify-end space-x-3">
                                    <button
                                        onClick={() => setShowDeleteConfirm(false)}
                                        className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
                                    >
                                        Annuler
                                    </button>
                                    <button
                                        onClick={handleDeleteUser}
                                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                                    >
                                        Supprimer
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default UserDetails;
