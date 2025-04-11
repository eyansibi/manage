const express = require("express");
const router = express.Router();
const experienceController = require("../controllers/ExperienceController");
const authController = require("../controllers/AuthController");

// Routes protégées avec authController.protection
router.get(
  "/",
  authController.protection,
  experienceController.getUserExperiences
); // Récupère les expériences de l'utilisateur connecté
router.get(
  "/:id",
  authController.protection,
  experienceController.getExperienceById
); // Récupère une expérience spécifique
router.post(
  "/add",
  authController.protection,
  experienceController.createExperience
); // Ajoute une nouvelle expérience
router.put(
  "/update/:id",
  authController.protection,
  experienceController.updateExperience
); // Met à jour une expérience
router.delete(
  "/:id",
  authController.protection,
  experienceController.deleteExperience
); // Supprime une expérience

// Optionnel : pour les admins, si besoin
router.get(
  "/all",
  authController.protection,
  experienceController.getAllExperiences
); // Récupère toutes les expériences (usage admin)

module.exports = router;
