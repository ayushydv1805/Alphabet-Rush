const { createClient } = require("redis");
const { createAdapter } = require("@socket.io/redis-adapter");

async function configureRedisAdapter(io) {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) return { enabled: false, close: async () => {} };

  const pubClient = createClient({ url: redisUrl });
  const subClient = pubClient.duplicate();

  pubClient.on("error", (error) => {
    console.error(JSON.stringify({ event: "redis_pub_error", message: error.message }));
  });
  subClient.on("error", (error) => {
    console.error(JSON.stringify({ event: "redis_sub_error", message: error.message }));
  });

  await Promise.all([pubClient.connect(), subClient.connect()]);
  io.adapter(createAdapter(pubClient, subClient));

  return {
    enabled: true,
    close: async () => {
      await Promise.allSettled([pubClient.quit(), subClient.quit()]);
    },
  };
}

module.exports = { configureRedisAdapter };
