import express from "express";
import { allComment } from "../controllers/commentController.js";
import { protect } from "../controllers/authController.js";
const router = express.Router();

router.route("/").post(protect, allComment);

export default router;
