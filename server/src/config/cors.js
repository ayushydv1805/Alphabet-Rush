const CLIENT_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:5175",
  "http://localhost:5176",
  "http://localhost:4173",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5175",
  "http://127.0.0.1:5176",
  "http://127.0.0.1:4173",
  "https://alphabet-rush.vercel.app",
];

function createCorsOptions() {
  return {
    origin: CLIENT_ORIGINS,
    methods: ["GET", "POST"],
  };
}

module.exports = { CLIENT_ORIGINS, createCorsOptions };
