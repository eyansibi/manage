const Experience = require("../models/Experience");
const { validateExperience } = require("../validators/experienceValidator");

// Créer une nouvelle expérience
exports.createExperience = async (req, res) => {
  console.log("Requête reçue, en-têtes :", req.headers);
  console.log("Données reçues dans req.body :", req.body);

  const { error } = validateExperience(req.body);
  if (error) {
    console.log("Erreurs de validation :", error.details);
    return res
      .status(400)
      .json({ errors: error.details.map((err) => err.message) });
  }

  if (!req.user || !req.user._id) {
    console.log("Utilisateur non authentifié, req.user :", req.user);
    return res.status(401).json({ message: "User not authenticated" });
  }

  try {
    console.log(
      "Création de l'expérience avec les données :",
      req.body,
      "pour userId :",
      req.user._id
    );
    const newExperience = new Experience({
      ...req.body,
      userId: req.user._id,
    });
    await newExperience.save();
    res.status(201).json(newExperience);
  } catch (err) {
    console.error(
      "Erreur lors de la création de l'expérience :",
      err.message,
      err.stack
    );
    res
      .status(500)
      .json({ message: "Failed to create experience", error: err.message });
  }
};

// Obtenir toutes les expériences (pour admin ou usage global si nécessaire)
exports.getAllExperiences = async (req, res) => {
  try {
    const experiences = await Experience.find();
    res.status(200).json(experiences);
  } catch (err) {
    console.error(
      "Erreur lors de la récupération de toutes les expériences :",
      err.message
    );
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Obtenir toutes les expériences de l'utilisateur connecté
exports.getUserExperiences = async (req, res) => {
  console.log("Requête reçue, en-têtes :", req.headers);
  console.log("Utilisateur de la requête :", req.user);

  if (!req.user || !req.user._id) {
    console.log(
      "Utilisateur non authentifié, req.user :",
      req.user,
      "En-têtes :",
      req.headers
    );
    return res.status(401).json({ message: "User not authenticated" });
  }

  try {
    const experiences = await Experience.find({ userId: req.user._id });
    console.log(
      "Expériences trouvées pour userId :",
      req.user._id,
      experiences
    );
    if (!experiences.length) {
      return res
        .status(200)
        .json({
          message: "No experiences found for this user",
          experiences: [],
        });
    }
    res.status(200).json(experiences);
  } catch (err) {
    console.error(
      "Erreur lors de la récupération des expériences de l'utilisateur :",
      err.message,
      err.stack
    );
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Obtenir une expérience par ID
exports.getExperienceById = async (req, res) => {
  try {
    const experience = await Experience.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });
    if (!experience) {
      return res
        .status(404)
        .json({ message: "Experience not found or unauthorized" });
    }
    res.status(200).json(experience);
  } catch (err) {
    console.error(
      "Erreur lors de la récupération de l'expérience par ID :",
      err.message
    );
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Mettre à jour une expérience
exports.updateExperience = async (req, res) => {
  const { error } = validateExperience(req.body);
  if (error) {
    console.log("Erreurs de validation :", error.details);
    return res
      .status(400)
      .json({ errors: error.details.map((err) => err.message) });
  }

  try {
    console.log(
      "Mise à jour de l'expérience avec ID :",
      req.params.id,
      "Données :",
      req.body
    );
    const experience = await Experience.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });
    if (!experience) {
      return res
        .status(404)
        .json({ message: "Experience not found or unauthorized" });
    }

    const updatedExperience = await Experience.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.status(200).json(updatedExperience);
  } catch (err) {
    console.error(
      "Erreur lors de la mise à jour de l'expérience :",
      err.message
    );
    res
      .status(500)
      .json({ message: "Failed to update experience", error: err.message });
  }
};

// Supprimer une expérience
exports.deleteExperience = async (req, res) => {
  try {
    const experience = await Experience.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });
    if (!experience) {
      return res
        .status(404)
        .json({ message: "Experience not found or unauthorized" });
    }

    await Experience.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Experience deleted successfully" });
  } catch (err) {
    console.error(
      "Erreur lors de la suppression de l'expérience :",
      err.message
    );
    res
      .status(500)
      .json({ message: "Failed to delete experience", error: err.message });
  }
};
