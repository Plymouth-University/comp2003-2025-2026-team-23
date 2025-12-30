const express = require("express");
const router = express.Router();
const controller = require("./controller");

// Multer - used for endpoints that require file storage
const multer = require("multer");
const multerStorage = multer.diskStorage({
    destination: (req, file, cb) => {cb(null, "uploads/")},
    filename: (req, file, cb) => {cb(null, `upload_${Math.round(Math.random()*1E10)}.pdf`)}
})
const multerInstance = multer({storage: multerStorage});

router.get("/ping", controller.ping);
router.post("/prompt", multerInstance.single("sentPDF"), controller.prompt);

module.exports = router;
