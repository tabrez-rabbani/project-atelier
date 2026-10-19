import { Router } from "express";
import multer from "multer";
import { createCategory, updateCategory, getAllCategories, removeCategory } from "../controllers/category.controller.js";
import { authenticateSeller } from "../middlewares/authMiddleware.js";

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024
    }
});

const categoryRouter = Router();

categoryRouter.post("/", authenticateSeller, upload.single("image"), createCategory);
categoryRouter.put("/:id", authenticateSeller, upload.single("image"), updateCategory);
categoryRouter.get("/", getAllCategories);
categoryRouter.delete("/:id", authenticateSeller, removeCategory);

export default categoryRouter;
