const express = require("express");
const router = express.Router();
const controller = require("./controller")

router.get("/ping", controller.ping)
router.get("/prompt", controller.prompt)

module.exports = router;
