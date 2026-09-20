import { io } from "socket.io-client";

const isLocalDev =
  typeof window !== "undefined" &&
  ["localhost", "127.0.0.1"].includes(window.location.hostname);

const socketUrl =
  import.meta.env.VITE_SOCKET_URL ||
  (isLocalDev
    ? "http://localhost:5000"
    : "https://alphabet-rush-server.onrender.com");

const socket = io(socketUrl, {
  transports: ["polling", "websocket"],
});

export default socket;
