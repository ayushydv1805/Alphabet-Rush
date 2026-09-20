const CLIENT_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:5175",
  "https://alphabet-rush.vercel.app",
];

function createCorsOptions() {
  return {
    origin: CLIENT_ORIGINS,
    methods: ["GET", "POST"],
  };
}

module.exports = { CLIENT_ORIGINS, createCorsOptions };
