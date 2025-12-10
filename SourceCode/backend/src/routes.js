const express = require("express");
const router = express.Router();
const controller = require("./controller")

router.get("/ping", controller.ping)
router.get("/prompt", controller.ping)

module.exports = router;
