const express = require('express');
const routes = require("./src/routes")
const app = express();
const port = (process.env.port || 3000);


app.use("/api", routes);

app.listen(port, () => console.log(`Api running on port ${port}`))
module.exports = app;