import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import ApiError from "../utils/ApiError.js";

// ─── Ensure upload directory exists ────────────────────────────
const UPLOAD_DIR = path.join(process.cwd(), "uploads");
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// ─── Storage engine ────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Organize by category: uploads/hotels, uploads/rooms, uploads/guests, etc.
    const category = req.uploadCategory || "misc";
    const dir = path.join(UPLOAD_DIR, category);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const unique = crypto.randomBytes(8).toString("hex");
    cb(null, `${Date.now()}-${unique}${ext}`);
  },
});

// ─── File filter ───────────────────────────────────────────────
const fileFilter = (allowedTypes) => (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new ApiError(400, `Only ${allowedTypes.join(", ")} files are allowed`));
  }
};

// ─── Image upload config ───────────────────────────────────────
export const uploadImage = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: fileFilter([".jpg", ".jpeg", ".png", ".webp", ".gif"]),
});

// ─── Document upload config (IDs, PDFs) ────────────────────────
export const uploadDocument = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: fileFilter([".pdf", ".jpg", ".jpeg", ".png", ".doc", ".docx"]),
});

// ─── Mixed config ──────────────────────────────────────────────
export const uploadAny = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
});

// ─── Convenience middleware ────────────────────────────────────

/** Single image: field name 'image' */
export const singleImage = uploadImage.single("image");

/** Multiple images: field name 'images', max 10 */
export const multipleImages = uploadImage.array("images", 10);

/** Guest ID proof */
export const uploadIdProof = uploadDocument.single("idProof");

/** Hotel photo gallery: field name 'gallery', max 20 */
export const hotelGallery = uploadImage.array("gallery", 20);

/** Room photos: field name 'photos', max 10 */
export const roomPhotos = uploadImage.array("photos", 10);

// ─── Cleanup helper ────────────────────────────────────────────
export const deleteUploadedFile = (filePath) => {
  try {
    const fullPath = path.join(process.cwd(), filePath.replace(/^\//, ""));
    if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
  } catch (err) {
    console.error("Failed to delete file:", err.message);
  }
};

// ─── Category setter middleware ────────────────────────────────
export const setUploadCategory = (category) => (req, res, next) => {
  req.uploadCategory = category;
  next();
};
