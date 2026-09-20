require("dotenv").config();

const { createApp } = require("./src/app");

const PORT = process.env.PORT || 5000;
const { server } = createApp();

server.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
