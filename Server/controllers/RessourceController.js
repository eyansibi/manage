const Ressource = require("../models/Ressource");
const { validateRessource } = require("../validators/validatorRessource");

// Créer une nouvelle ressource
exports.createRessource = async (req, res) => {
  const { error } = validateRessource(req.body);
  if (error) {
    return res
      .status(400)
      .json({ errors: error.details.map((err) => err.message) });
  }

  try {
    const newRessource = new Ressource(req.body);
    await newRessource.save();
    res.status(201).json(newRessource);
  } catch (err) {
    res.status(500).json({ message: "Failed to create resource", error: err });
  }
};

// Récupérer toutes les ressources
exports.getAllRessources = async (req, res) => {
  try {
    const ressources = await Ressource.find().populate("project_id");
    res.status(200).json(ressources);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
};

// Récupérer une ressource par ID
exports.getRessourceById = async (req, res) => {
  try {
    const ressource = await Ressource.findById(req.params.id).populate(
      "project_id"
    );
    if (!ressource)
      return res.status(404).json({ message: "Resource not found" });
    res.status(200).json(ressource);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
};

// Mettre à jour une ressource
exports.updateRessource = async (req, res) => {
  const { error } = validateRessource(req.body);
  if (error) {
    return res
      .status(400)
      .json({ errors: error.details.map((err) => err.message) });
  }

  try {
    const updatedRessource = await Ressource.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedRessource)
      return res.status(404).json({ message: "Resource not found" });
    res.status(200).json(updatedRessource);
  } catch (err) {
    res.status(500).json({ message: "Failed to update resource", error: err });
  }
};

// Supprimer une ressource
exports.deleteRessource = async (req, res) => {
  try {
    const deletedRessource = await Ressource.findByIdAndDelete(req.params.id);
    if (!deletedRessource)
      return res.status(404).json({ message: "Resource not found" });
    res.status(200).json({ message: "Resource deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete resource", error: err });
  }
};
