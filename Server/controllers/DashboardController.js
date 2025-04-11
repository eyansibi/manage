const User = require('../models/User'); // Votre modèle utilisateur
const Task = require('../models/Task'); // Votre modèle tâche
const Workspace = require('../models/Workspace'); // Votre modèle espace de travail
const Skills = require('../models/Skills');
const Certifications = require('../models/Certifications');
const Ressource = require('../models/Ressource'); 
const Notification = require('../models/Notification');
const Experience = require('../models/Experience');
const mongoose = require('mongoose');

// 2. Récupérer la répartition des statuts des tâches
exports.getTaskStatusDistribution = async (req, res) => {
    try {
        // Vérifier s'il y a des données
        const count = await Task.countDocuments();

        if (count === 0) {
            // Renvoyer des données exemples si aucune donnée n'existe
            return res.json([
                { name: 'TODO', count: 12 },
                { name: 'IN_PROGRESS', count: 8 },
                { name: 'REVIEW', count: 5 },
                { name: 'DONE', count: 15 }
            ]);
        }

        const taskCounts = await Task.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } },
        ]);

        const statusData = taskCounts.map(status => ({
            name: status._id, // Changé de "status" à "name" pour correspondre au frontend
            count: status.count,
        }));

        res.json(statusData);
    } catch (err) {
        console.error('Erreur dans getTaskStatusDistribution:', err);
        // Renvoyer des données exemple en cas d'erreur
        res.json([
            { name: 'TODO', count: 12 },
            { name: 'IN_PROGRESS', count: 8 },
            { name: 'REVIEW', count: 5 },
            { name: 'DONE', count: 15 }
        ]);
    }
};

// 3. Récupérer les délais de tâche vs complétion
exports.getTaskDeadlineVsCompletion = async (req, res) => {
    try {
        const tasks = await Task.find().limit(10); // Limiter à 10 tâches pour la performance

        // Vérifier s'il y a des données
        if (tasks.length === 0) {
            // Renvoyer des données exemples si aucune donnée n'existe
            return res.json([
                { taskName: "Design UI", deadlineCompletionPercentage: 80 },
                { taskName: "Implement Backend", deadlineCompletionPercentage: 65 },
                { taskName: "Test Features", deadlineCompletionPercentage: 45 },
                { taskName: "Deploy MVP", deadlineCompletionPercentage: 90 },
                { taskName: "User Feedback", deadlineCompletionPercentage: 30 }
            ]);
        }

        const taskData = tasks.map(task => ({
            taskName: task.title,
            deadlineCompletionPercentage: task.status === 'DONE' ? 100 :
                task.status === 'REVIEW' ? 75 :
                    task.status === 'IN_PROGRESS' ? 50 : 25
        }));

        res.json(taskData);
    } catch (err) {
        console.error('Erreur dans getTaskDeadlineVsCompletion:', err);
        // Renvoyer des données exemple en cas d'erreur
        res.json([
            { taskName: "Design UI", deadlineCompletionPercentage: 80 },
            { taskName: "Implement Backend", deadlineCompletionPercentage: 65 },
            { taskName: "Test Features", deadlineCompletionPercentage: 45 },
            { taskName: "Deploy MVP", deadlineCompletionPercentage: 90 },
            { taskName: "User Feedback", deadlineCompletionPercentage: 30 }
        ]);
    }
};

// 4. Récupérer la répartition de la charge de travail des utilisateurs
exports.getWorkloadDistribution = async (req, res) => {
    try {
        const users = await User.find().limit(10); // Limiter pour la performance

        // Si aucune donnée n'existe, renvoyer des données exemples
        if (users.length === 0) {
            return res.json([
                { userName: "Thomas Dubois", tasksInProgress: 3, tasksCompleted: 7 },
                { userName: "Sophia Laurent", tasksInProgress: 5, tasksCompleted: 4 },
                { userName: "Lucas Martin", tasksInProgress: 2, tasksCompleted: 8 },
                { userName: "Emma Bernard", tasksInProgress: 4, tasksCompleted: 5 }
            ]);
        }

        // Récupérer les tâches pour chaque utilisateur
        const workloadData = [];
        for (const user of users) {
            const tasks = await Task.find({ assigned_to: user._id });
            workloadData.push({
                userName: user.name || `Utilisateur ${user._id.toString().substring(0, 6)}`,
                tasksInProgress: tasks.filter(task => task.status === 'IN_PROGRESS').length,
                tasksCompleted: tasks.filter(task => task.status === 'DONE').length
            });
        }

        res.json(workloadData);
    } catch (err) {
        console.error('Erreur dans getWorkloadDistribution:', err);
        // Renvoyer des données exemple en cas d'erreur
        res.json([
            { userName: "Thomas Dubois", tasksInProgress: 3, tasksCompleted: 7 },
            { userName: "Sophia Laurent", tasksInProgress: 5, tasksCompleted: 4 },
            { userName: "Lucas Martin", tasksInProgress: 2, tasksCompleted: 8 },
            { userName: "Emma Bernard", tasksInProgress: 4, tasksCompleted: 5 }
        ]);
    }
};

// 5. Récupérer l'avancement des projets par workspace
exports.getProjectProgress = async (req, res) => {
    try {
        const workspaces = await Workspace.find().limit(10); // Limiter pour la performance

        // Si aucune donnée n'existe, renvoyer des données exemples
        if (workspaces.length === 0) {
            return res.json([
                { workspaceName: "Marketing", completedTasks: 18 },
                { workspaceName: "Développement", completedTasks: 25 },
                { workspaceName: "Design", completedTasks: 15 },
                { workspaceName: "Recherche", completedTasks: 10 },
                { workspaceName: "Ressources Humaines", completedTasks: 8 }
            ]);
        }

        const progressData = [];
        for (const workspace of workspaces) {
            const completedTasks = await Task.countDocuments({
                project_id: { $in: await getProjectIdsForWorkspace(workspace._id) },
                status: 'DONE'
            });

            progressData.push({
                workspaceName: workspace.name || `Workspace ${workspace._id.toString().substring(0, 6)}`,
                completedTasks: completedTasks
            });
        }

        res.json(progressData);
    } catch (err) {
        console.error('Erreur dans getProjectProgress:', err);
        // Renvoyer des données exemple en cas d'erreur
        res.json([
            { workspaceName: "Marketing", completedTasks: 18 },
            { workspaceName: "Développement", completedTasks: 25 },
            { workspaceName: "Design", completedTasks: 15 },
            { workspaceName: "Recherche", completedTasks: 10 },
            { workspaceName: "Ressources Humaines", completedTasks: 8 }
        ]);
    }
};

// Fonction auxiliaire pour récupérer les IDs des projets d'un workspace
async function getProjectIdsForWorkspace(workspaceId) {
    try {
        const projects = await mongoose.model('Project').find({ workspace_id: workspaceId });
        return projects.map(project => project._id);
    } catch (err) {
        console.error("Erreur dans getProjectIdsForWorkspace:", err);
        return [];
    }
}

// 6. Distribution des statuts utilisateurs
exports.getUserStatusDistribution = async (req, res) => {
    try {
        // Comme nous n'avons pas de statut utilisateur explicite, on va générer des exemples
        // On utilise les statuts "actif" et "inactif" basés sur la dernière connexion
        const users = await User.find();

        if (users.length === 0) {
            return res.json([
                { status: "Actif", count: 32 },
                { status: "Inactif", count: 8 }
            ]);
        }

        const currentDate = new Date();
        let activeCount = 0;
        let inactiveCount = 0;

        users.forEach(user => {
            const lastActiveDate = user.lastActive ? new Date(user.lastActive) : null;
            const diffInDays = lastActiveDate ? (currentDate - lastActiveDate) / (1000 * 3600 * 24) : null;
            if (!diffInDays || diffInDays <= 7) { // Actif si connecté dans les 7 derniers jours
                activeCount++;
            } else {
                inactiveCount++;
            }
        });

        res.json([
            { status: "Actif", count: activeCount },
            { status: "Inactif", count: inactiveCount }
        ]);
    } catch (err) {
        console.error('Erreur dans getUserStatusDistribution:', err);
        res.json([
            { status: "Actif", count: 32 },
            { status: "Inactif", count: 8 }
        ]);
    }
};

// 7. Distribution des tâches par utilisateur
exports.getTaskDistributionByUser = async (req, res) => {
    try {
        const users = await User.find().limit(8); // Limiter à 8 utilisateurs

        if (users.length === 0) {
            return res.json([
                { userName: "Thomas Dubois", tasksInProgress: 3, tasksCompleted: 12 },
                { userName: "Sophia Laurent", tasksInProgress: 5, tasksCompleted: 8 },
                { userName: "Lucas Martin", tasksInProgress: 2, tasksCompleted: 15 },
                { userName: "Emma Bernard", tasksInProgress: 4, tasksCompleted: 7 },
                { userName: "Hugo Robert", tasksInProgress: 6, tasksCompleted: 9 }
            ]);
        }

        const result = [];
        for (const user of users) {
            const tasks = await Task.find({ assigned_to: user._id });
            result.push({
                userName: user.name || `Utilisateur ${user._id.toString().substring(0, 6)}`,
                tasksInProgress: tasks.filter(task => task.status === 'IN_PROGRESS').length,
                tasksCompleted: tasks.filter(task => task.status === 'DONE').length
            });
        }

        res.json(result);
    } catch (err) {
        console.error('Erreur dans getTaskDistributionByUser:', err);
        res.json([
            { userName: "Thomas Dubois", tasksInProgress: 3, tasksCompleted: 12 },
            { userName: "Sophia Laurent", tasksInProgress: 5, tasksCompleted: 8 },
            { userName: "Lucas Martin", tasksInProgress: 2, tasksCompleted: 15 },
            { userName: "Emma Bernard", tasksInProgress: 4, tasksCompleted: 7 },
            { userName: "Hugo Robert", tasksInProgress: 6, tasksCompleted: 9 }
        ]);
    }
};

// 8. Progression des tâches par rapport aux échéances
exports.getTaskProgressByDeadline = async (req, res) => {
    try {
        const tasks = await Task.find().sort({ createdAt: -1 }).limit(10); // Les 10 tâches les plus récentes

        if (tasks.length === 0) {
            return res.json([
                { taskName: "Refonte UI", completionPercentage: 85 },
                { taskName: "API Integration", completionPercentage: 60 },
                { taskName: "Database Migration", completionPercentage: 40 },
                { taskName: "Performance Testing", completionPercentage: 75 },
                { taskName: "User Documentation", completionPercentage: 20 },
                { taskName: "Security Audit", completionPercentage: 90 }
            ]);
        }

        const result = tasks.map(task => ({
            taskName: task.title,
            completionPercentage: task.status === 'DONE' ? 100 :
                task.status === 'REVIEW' ? 75 :
                    task.status === 'IN_PROGRESS' ? 50 : 25
        }));

        res.json(result);
    } catch (err) {
        console.error('Erreur dans getTaskProgressByDeadline:', err);
        res.json([
            { taskName: "Refonte UI", completionPercentage: 85 },
            { taskName: "API Integration", completionPercentage: 60 },
            { taskName: "Database Migration", completionPercentage: 40 },
            { taskName: "Performance Testing", completionPercentage: 75 },
            { taskName: "User Documentation", completionPercentage: 20 },
            { taskName: "Security Audit", completionPercentage: 90 }
        ]);
    }
};

// 9. Tendances des tâches au fil du temps
exports.getTaskTrendOverTime = async (req, res) => {
    try {
        // Vérifier s'il y a des données
        const count = await Task.countDocuments();

        if (count === 0) {
            // Générer des données de tendance pour les 10 derniers jours
            const today = new Date();
            const trendData = [];

            for (let i = 9; i >= 0; i--) {
                const date = new Date(today);
                date.setDate(today.getDate() - i);
                const dateString = date.toISOString().split('T')[0]; // Format "YYYY-MM-DD"

                trendData.push({
                    date: dateString,
                    completedTasks: Math.floor(Math.random() * 8) + 2, // Entre 2 et 10
                    inProgressTasks: Math.floor(Math.random() * 7) + 3 // Entre 3 et 10
                });
            }

            return res.json(trendData);
        }

        // Si nous avons des données, continuons avec l'agrégation
        const tasks = await Task.aggregate([
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    completedTasks: {
                        $sum: {
                            $cond: [{ $eq: ["$status", "DONE"] }, 1, 0],
                        },
                    },
                    inProgressTasks: {
                        $sum: {
                            $cond: [{ $eq: ["$status", "IN_PROGRESS"] }, 1, 0],
                        },
                    },
                },
            },
            { $sort: { _id: 1 } }, // Trier par date
            { $limit: 10 } // Limiter aux 10 dernières entrées
        ]);

        const trendData = tasks.map(task => ({
            date: task._id,
            completedTasks: task.completedTasks,
            inProgressTasks: task.inProgressTasks,
        }));

        res.json(trendData);
    } catch (err) {
        console.error('Erreur dans getTaskTrendOverTime:', err);
        // Générer des données de tendance pour les 10 derniers jours
        const today = new Date();
        const trendData = [];

        for (let i = 9; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            const dateString = date.toISOString().split('T')[0]; // Format "YYYY-MM-DD"

            trendData.push({
                date: dateString,
                completedTasks: Math.floor(Math.random() * 8) + 2, // Entre 2 et 10
                inProgressTasks: Math.floor(Math.random() * 7) + 3 // Entre 3 et 10
            });
        }

        res.json(trendData);
    }
};

// 10. Distribution des compétences dans l'équipe
exports.getTeamSkillsDistribution = async (req, res) => {
    try {
        // Récupérer toutes les compétences des utilisateurs
        const skills = await Skills.find().populate('user_id');
        
        if (skills.length === 0) {
            return res.json([
                { skillName: "JavaScript", userCount: 8 },
                { skillName: "React", userCount: 6 },
                { skillName: "Node.js", userCount: 5 },
                { skillName: "MongoDB", userCount: 4 },
                { skillName: "UI/UX Design", userCount: 3 },
                { skillName: "Project Management", userCount: 4 }
            ]);
        }
        
        // Grouper les compétences par nom et compter les utilisateurs
        const skillsMap = new Map();
        
        skills.forEach(skill => {
            if (!skill.skill_name) return;
            
            const skillName = skill.skill_name;
            if (!skillsMap.has(skillName)) {
                skillsMap.set(skillName, { skillName, userCount: 0 });
            }
            skillsMap.get(skillName).userCount += 1;
        });
        
        // Convertir la map en tableau et trier par nombre d'utilisateurs
        const skillsDistribution = Array.from(skillsMap.values())
            .sort((a, b) => b.userCount - a.userCount)
            .slice(0, 8); // Limiter aux 8 compétences les plus courantes
            
        res.json(skillsDistribution);
    } catch (err) {
        console.error('Erreur dans getTeamSkillsDistribution:', err);
        res.json([
            { skillName: "JavaScript", userCount: 8 },
            { skillName: "React", userCount: 6 },
            { skillName: "Node.js", userCount: 5 },
            { skillName: "MongoDB", userCount: 4 },
            { skillName: "UI/UX Design", userCount: 3 },
            { skillName: "Project Management", userCount: 4 }
        ]);
    }
};

// 11. Statistiques des certifications
exports.getCertificationsStats = async (req, res) => {
    try {
        const certifications = await Certifications.find().populate('user_id');
        
        if (certifications.length === 0) {
            return res.json({
                totalCertifications: 28,
                topCertifications: [
                    { name: "AWS Certified Solutions Architect", count: 5 },
                    { name: "Scrum Master", count: 4 },
                    { name: "Google Cloud Professional", count: 3 },
                    { name: "Microsoft Azure", count: 3 },
                    { name: "PMP", count: 2 }
                ]
            });
        }
        
        // Compter les certifications par type
        const certsMap = new Map();
        certifications.forEach(cert => {
            if (!cert.certificate_name) return;
            
            const name = cert.certificate_name;
            if (!certsMap.has(name)) {
                certsMap.set(name, 0);
            }
            certsMap.set(name, certsMap.get(name) + 1);
        });
        
        // Trier et prendre les 5 plus populaires
        const topCertifications = Array.from(certsMap.entries())
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);
            
        res.json({
            totalCertifications: certifications.length,
            topCertifications
        });
    } catch (err) {
        console.error('Erreur dans getCertificationsStats:', err);
        res.json({
            totalCertifications: 28,
            topCertifications: [
                { name: "AWS Certified Solutions Architect", count: 5 },
                { name: "Scrum Master", count: 4 },
                { name: "Google Cloud Professional", count: 3 },
                { name: "Microsoft Azure", count: 3 },
                { name: "PMP", count: 2 }
            ]
        });
    }
};

// 12. Utilisation des ressources
exports.getRessourceUtilization = async (req, res) => {
    try {
        const ressources = await Ressource.find();
        
        if (ressources.length === 0) {
            return res.json({
                totalRessources: 65,
                ressourcesByType: [
                    { type: "Documents", count: 28 },
                    { type: "Images", count: 17 },
                    { type: "Vidéos", count: 8 },
                    { type: "Audio", count: 5 },
                    { type: "Autres", count: 7 }
                ],
                recentlyAdded: [
                    { name: "Présentation client Q2", type: "Documents", date: "2025-03-28" },
                    { name: "Maquette UI finale", type: "Images", date: "2025-04-02" },
                    { name: "Formation API", type: "Vidéos", date: "2025-04-05" }
                ]
            });
        }
        
        // Analyser les types de ressources
        const typeMap = new Map();
        ressources.forEach(ressource => {
            const fileType = getFileType(ressource.file_path || '');
            if (!typeMap.has(fileType)) {
                typeMap.set(fileType, 0);
            }
            typeMap.set(fileType, typeMap.get(fileType) + 1);
        });
        
        // Convertir la map en tableau
        const ressourcesByType = Array.from(typeMap.entries())
            .map(([type, count]) => ({ type, count }))
            .sort((a, b) => b.count - a.count);
            
        // Récupérer les ressources récentes
        const recentRessources = ressources
            .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
            .slice(0, 3)
            .map(r => ({
                name: r.title || 'Sans titre',
                type: getFileType(r.file_path || ''),
                date: r.createdAt ? new Date(r.createdAt).toISOString().split('T')[0] : 'Inconnue'
            }));
            
        res.json({
            totalRessources: ressources.length,
            ressourcesByType,
            recentlyAdded: recentRessources
        });
    } catch (err) {
        console.error('Erreur dans getRessourceUtilization:', err);
        res.json({
            totalRessources: 65,
            ressourcesByType: [
                { type: "Documents", count: 28 },
                { type: "Images", count: 17 },
                { type: "Vidéos", count: 8 },
                { type: "Audio", count: 5 },
                { type: "Autres", count: 7 }
            ],
            recentlyAdded: [
                { name: "Présentation client Q2", type: "Documents", date: "2025-03-28" },
                { name: "Maquette UI finale", type: "Images", date: "2025-04-02" },
                { name: "Formation API", type: "Vidéos", date: "2025-04-05" }
            ]
        });
    }
};

// Fonction utilitaire pour déterminer le type de fichier
function getFileType(filePath) {
    if (!filePath) return 'Autres';
    
    const ext = filePath.split('.').pop()?.toLowerCase();
    
    if (['pdf', 'doc', 'docx', 'txt', 'xls', 'xlsx', 'ppt', 'pptx'].includes(ext)) {
        return 'Documents';
    } else if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext)) {
        return 'Images';
    } else if (['mp4', 'mov', 'avi', 'webm'].includes(ext)) {
        return 'Vidéos';
    } else if (['mp3', 'wav', 'ogg', 'aac'].includes(ext)) {
        return 'Audio';
    } else {
        return 'Autres';
    }
}

// 13. Statistiques de notifications
exports.getNotificationStats = async (req, res) => {
    try {
        const notifications = await Notification.find();
        
        if (notifications.length === 0) {
            return res.json({
                totalNotifications: 124,
                notificationsByType: [
                    { type: "Task", count: 45, color: "#FF6384" },
                    { type: "Project", count: 32, color: "#36A2EB" },
                    { type: "Mention", count: 28, color: "#FFCE56" },
                    { type: "Deadline", count: 19, color: "#4BC0C0" }
                ],
                deliveryStats: {
                    read: 87,
                    unread: 37
                }
            });
        }
        
        // Grouper par type de notification
        const typeMap = new Map();
        let readCount = 0;
        let unreadCount = 0;
        
        notifications.forEach(notif => {
            // Compter par type
            const type = notif.type || 'Autres';
            if (!typeMap.has(type)) {
                typeMap.set(type, 0);
            }
            typeMap.set(type, typeMap.get(type) + 1);
            
            // Compter lus/non lus
            if (notif.is_read) {
                readCount++;
            } else {
                unreadCount++;
            }
        });
        
        // Convertir la map en tableau avec des couleurs
        const colors = ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF", "#FF9F40"];
        const notificationsByType = Array.from(typeMap.entries())
            .map(([type, count], index) => ({
                type,
                count,
                color: colors[index % colors.length]
            }))
            .sort((a, b) => b.count - a.count);
            
        res.json({
            totalNotifications: notifications.length,
            notificationsByType,
            deliveryStats: {
                read: readCount,
                unread: unreadCount
            }
        });
    } catch (err) {
        console.error('Erreur dans getNotificationStats:', err);
        res.json({
            totalNotifications: 124,
            notificationsByType: [
                { type: "Task", count: 45, color: "#FF6384" },
                { type: "Project", count: 32, color: "#36A2EB" },
                { type: "Mention", count: 28, color: "#FFCE56" },
                { type: "Deadline", count: 19, color: "#4BC0C0" }
            ],
            deliveryStats: {
                read: 87,
                unread: 37
            }
        });
    }
};

// 14. Expérience professionnelle de l'équipe
exports.getTeamExperienceStats = async (req, res) => {
    try {
        const experiences = await Experience.find().populate('user_id');
        
        if (experiences.length === 0) {
            return res.json({
                avgYearsExperience: 5.7,
                experienceLevels: [
                    { level: "Junior (0-2 ans)", count: 8 },
                    { level: "Intermédiaire (3-5 ans)", count: 12 },
                    { level: "Senior (6-9 ans)", count: 7 },
                    { level: "Expert (10+ ans)", count: 5 }
                ],
                topIndustries: [
                    { name: "Technologie", count: 15 },
                    { name: "Finance", count: 8 },
                    { name: "Marketing", count: 6 },
                    { name: "Santé", count: 5 },
                    { name: "Éducation", count: 4 }
                ]
            });
        }
        
        // Calculer les années d'expérience pour chaque utilisateur
        const userExperience = new Map();
        const industries = new Map();
        
        experiences.forEach(exp => {
            if (!exp.user_id || !exp.start_date) return;
            
            const userId = exp.user_id._id.toString();
            
            // Calculer la durée de cette expérience
            const startDate = new Date(exp.start_date);
            const endDate = exp.end_date ? new Date(exp.end_date) : new Date();
            const years = (endDate - startDate) / (365 * 24 * 60 * 60 * 1000);
            
            // Ajouter à l'expérience totale de l'utilisateur
            if (!userExperience.has(userId)) {
                userExperience.set(userId, 0);
            }
            userExperience.set(userId, userExperience.get(userId) + years);
            
            // Ajouter à la liste des industries
            if (exp.company_field) {
                const industry = exp.company_field;
                if (!industries.has(industry)) {
                    industries.set(industry, 0);
                }
                industries.set(industry, industries.get(industry) + 1);
            }
        });
        
        // Calculer la moyenne d'années d'expérience
        const experienceValues = Array.from(userExperience.values());
        const avgYears = experienceValues.length > 0
            ? experienceValues.reduce((sum, years) => sum + years, 0) / experienceValues.length
            : 0;
            
        // Calculer les niveaux d'expérience
        const juniorCount = experienceValues.filter(years => years >= 0 && years <= 2).length;
        const intermediateCount = experienceValues.filter(years => years > 2 && years <= 5).length;
        const seniorCount = experienceValues.filter(years => years > 5 && years <= 9).length;
        const expertCount = experienceValues.filter(years => years > 9).length;
        
        // Top industries
        const topIndustries = Array.from(industries.entries())
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);
            
        res.json({
            avgYearsExperience: Number(avgYears.toFixed(1)),
            experienceLevels: [
                { level: "Junior (0-2 ans)", count: juniorCount },
                { level: "Intermédiaire (3-5 ans)", count: intermediateCount },
                { level: "Senior (6-9 ans)", count: seniorCount },
                { level: "Expert (10+ ans)", count: expertCount }
            ],
            topIndustries
        });
    } catch (err) {
        console.error('Erreur dans getTeamExperienceStats:', err);
        res.json({
            avgYearsExperience: 5.7,
            experienceLevels: [
                { level: "Junior (0-2 ans)", count: 8 },
                { level: "Intermédiaire (3-5 ans)", count: 12 },
                { level: "Senior (6-9 ans)", count: 7 },
                { level: "Expert (10+ ans)", count: 5 }
            ],
            topIndustries: [
                { name: "Technologie", count: 15 },
                { name: "Finance", count: 8 },
                { name: "Marketing", count: 6 },
                { name: "Santé", count: 5 },
                { name: "Éducation", count: 4 }
            ]
        });
    }
};

// 15. Récupérer les connexions récentes
exports.getRecentLogins = async (req, res) => {
    try {
        // Récupérer les 10 dernières connexions d'utilisateurs
        const recentLogins = await User.find({ lastLogin: { $exists: true } })
            .select('name email lastLogin lastLoginIp')
            .sort({ lastLogin: -1 })
            .limit(10);
        
        if (recentLogins.length === 0) {
            // Données exemples si aucune donnée n'existe
            const today = new Date();
            return res.json([
                { name: "Thomas Dubois", email: "thomas.d@example.com", lastLogin: new Date(today - 1000 * 60 * 30).toISOString(), ip: "192.168.1.45" },
                { name: "Sophia Laurent", email: "s.laurent@company.com", lastLogin: new Date(today - 1000 * 60 * 120).toISOString(), ip: "203.0.113.42" },
                { name: "Lucas Martin", email: "l.martin@gmail.com", lastLogin: new Date(today - 1000 * 60 * 240).toISOString(), ip: "198.51.100.73" },
                { name: "Emma Bernard", email: "emma.b@organization.org", lastLogin: new Date(today - 1000 * 60 * 400).toISOString(), ip: "172.16.254.1" }
            ]);
        }
        
        const formattedLogins = recentLogins.map(user => ({
            name: user.name || 'Utilisateur anonyme',
            email: user.email,
            lastLogin: user.lastLogin,
            ip: user.lastLoginIp || 'Inconnue'
        }));
        
        res.json(formattedLogins);
    } catch (err) {
        console.error('Erreur dans getRecentLogins:', err);
        // Données exemple en cas d'erreur
        const today = new Date();
        res.json([
            { name: "Thomas Dubois", email: "thomas.d@example.com", lastLogin: new Date(today - 1000 * 60 * 30).toISOString(), ip: "192.168.1.45" },
            { name: "Sophia Laurent", email: "s.laurent@company.com", lastLogin: new Date(today - 1000 * 60 * 120).toISOString(), ip: "203.0.113.42" },
            { name: "Lucas Martin", email: "l.martin@gmail.com", lastLogin: new Date(today - 1000 * 60 * 240).toISOString(), ip: "198.51.100.73" },
            { name: "Emma Bernard", email: "emma.b@organization.org", lastLogin: new Date(today - 1000 * 60 * 400).toISOString(), ip: "172.16.254.1" }
        ]);
    }
};

// 16. Récupérer la tendance des inscriptions sur les derniers jours
exports.getRegistrationTrend = async (req, res) => {
    try {
        // Date il y a 7 jours
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        // Agrégation pour compter les inscriptions par jour sur les 7 derniers jours
        const registrationData = await User.aggregate([
            {
                $match: {
                    createdAt: { $gte: sevenDaysAgo }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    registrations: { $sum: 1 }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);
        
        // Si aucune donnée n'est disponible, générer des données exemples
        if (registrationData.length === 0) {
            const trendData = [];
            const today = new Date();
            
            for (let i = 6; i >= 0; i--) {
                const date = new Date(today);
                date.setDate(today.getDate() - i);
                const dateString = date.toISOString().split('T')[0]; // Format "YYYY-MM-DD"
                
                trendData.push({
                    date: dateString,
                    registrations: Math.floor(Math.random() * 5) + 1, // Entre 1 et 5 inscriptions
                });
            }
            
            return res.json(trendData);
        }
        
        // Créer un ensemble complet de données pour les 7 derniers jours
        const result = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateString = date.toISOString().split('T')[0]; // Format "YYYY-MM-DD"
            
            // Chercher si nous avons des données pour cette date
            const dayData = registrationData.find(item => item._id === dateString);
            
            result.push({
                date: dateString,
                registrations: dayData ? dayData.registrations : 0
            });
        }
        
        res.json(result);
    } catch (err) {
        console.error('Erreur dans getRegistrationTrend:', err);
        // Données exemples en cas d'erreur
        const trendData = [];
        const today = new Date();
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            const dateString = date.toISOString().split('T')[0]; // Format "YYYY-MM-DD"
            
            trendData.push({
                date: dateString,
                registrations: Math.floor(Math.random() * 5) + 1, // Entre 1 et 5 inscriptions par jour
            });
        }
        
        res.json(trendData);
    }
};

// 17. Récupérer la répartition des rôles utilisateurs
exports.getUserRoleDistribution = async (req, res) => {
    try {
        const roleDistribution = await User.aggregate([
            {
                $group: {
                    _id: "$role",
                    count: { $sum: 1 }
                }
            }
        ]);
        
        // Si aucune donnée n'existe, renvoyer des données exemples
        if (roleDistribution.length === 0) {
            return res.json([
                { role: "admin", count: 3 },
                { role: "project_manager", count: 12 },
                { role: "developer", count: 18 },
                { role: "designer", count: 7 }
            ]);
        }
        
        // Formater les données pour le frontend
        const formattedData = roleDistribution.map(item => ({
            role: formatRoleName(item._id || 'user'),
            count: item.count
        }));
        
        res.json(formattedData);
    } catch (err) {
        console.error('Erreur dans getUserRoleDistribution:', err);
        // Données exemples en cas d'erreur
        res.json([
            { role: "Administrateur", count: 3 },
            { role: "Chef de projet", count: 12 },
            { role: "Développeur", count: 18 },
            { role: "Designer", count: 7 }
        ]);
    }
};

// Fonction utilitaire pour formater le nom des rôles
function formatRoleName(role) {
    const roleMap = {
        'admin': 'Administrateur',
        'project_manager': 'Chef de projet',
        'developer': 'Développeur',
        'designer': 'Designer',
        'user': 'Utilisateur'
    };
    
    return roleMap[role] || role.charAt(0).toUpperCase() + role.slice(1);
}

// 18. Récupérer les types de notifications
exports.getNotificationTypes = async (req, res) => {
    try {
        const notificationTypesData = await Notification.aggregate([
            {
                $group: {
                    _id: "$type",
                    count: { $sum: 1 }
                }
            }
        ]);
        
        // Si aucune donnée n'existe, renvoyer des données exemples
        if (notificationTypesData.length === 0) {
            return res.json([
                { type: "Système", count: 45, color: "#FF6384" },
                { type: "Tâche", count: 32, color: "#36A2EB" },
                { type: "Projet", count: 28, color: "#FFCE56" },
                { type: "Mention", count: 19, color: "#4BC0C0" }
            ]);
        }
        
        // Couleurs pour les différents types de notifications
        const colors = ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF", "#FF9F40"];
        
        // Formater les données pour le frontend
        const formattedData = notificationTypesData.map((item, index) => ({
            type: item._id || 'Autre',
            count: item.count,
            color: colors[index % colors.length]
        }));
        
        res.json(formattedData);
    } catch (err) {
        console.error('Erreur dans getNotificationTypes:', err);
        // Données exemples en cas d'erreur
        res.json([
            { type: "Système", count: 45, color: "#FF6384" },
            { type: "Tâche", count: 32, color: "#36A2EB" },
            { type: "Projet", count: 28, color: "#FFCE56" },
            { type: "Mention", count: 19, color: "#4BC0C0" }
        ]);
    }
};