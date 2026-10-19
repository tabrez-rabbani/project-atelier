import { Router } from "express";
import multer from "multer";
import {
    getActiveHeroSlidesController,
    getAllHeroSlidesController,
    getHeroSlideByIdController,
    createHeroSlideController,
    updateHeroSlideController,
    toggleHeroStatusController,
    deleteHeroSlideController,
} from "../controllers/hero.controller.js";
import { authenticateSeller } from "../middlewares/authMiddleware.js";

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
});

const heroUpload = upload.fields([
    { name: "desktopImage", maxCount: 1 },
    { name: "mobileImage", maxCount: 1 },
]);

const heroRouter = Router();

heroRouter.get("/", getActiveHeroSlidesController);
heroRouter.get("/admin/all", authenticateSeller, getAllHeroSlidesController);
heroRouter.get("/:id", authenticateSeller, getHeroSlideByIdController);
heroRouter.post("/", authenticateSeller, heroUpload, createHeroSlideController);
heroRouter.put("/:id", authenticateSeller, heroUpload, updateHeroSlideController);
heroRouter.patch("/:id/toggle", authenticateSeller, toggleHeroStatusController);
heroRouter.delete("/:id", authenticateSeller, deleteHeroSlideController);

export default heroRouter;
