import multer from "multer";

const upload = multer({
  storage: multer.diskStorage({
    destination: "./src/uploads",
    filename: (_req, file, cb) => {
      cb(null, `${Date.now()}-${file.originalname}`);
    },
  }),
  limits: { fileSize: 15 * 1024 * 1024 },
});

export default upload;
