import express from "express";
import { getDashboardSummary } from "../controller/dashboard.js";
import { verifyToken } from "../controller/user.js";

const router = express.Router();

router.use(verifyToken);
router.get("/summary", getDashboardSummary);

export default router;
