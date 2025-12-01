const express = require("express");
const router = express.Router();
const controller = require("./controller")

router.get("/ping", controller.ping)

module.exports = router;