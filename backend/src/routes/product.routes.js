import { Router } from "express";
import multer from "multer";
import { createProduct, getAllProducts, getColors, getProductDetails, removeProduct, editProduct, getAdminProductById, searchProducts } from "../controllers/product.controller.js";
import { authenticateSeller } from "../middlewares/authMiddleware.js";
import { productValidator } from "../validators/productValidator.js";

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
});

const productRouter = Router();

productRouter.post("/", authenticateSeller, upload.any(), productValidator, createProduct);
productRouter.get("/", getAllProducts);
productRouter.get("/search", searchProducts);
productRouter.get("/colors", getColors);
productRouter.get("/detail/:slug", getProductDetails);
productRouter.get("/admin/:id", authenticateSeller, getAdminProductById);
productRouter.put("/:id", authenticateSeller, upload.any(), productValidator, editProduct);
productRouter.delete("/:id", authenticateSeller, removeProduct);

export default productRouter;