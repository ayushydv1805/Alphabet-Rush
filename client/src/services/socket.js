import { io } from "socket.io-client";

const socketUrl =
  import.meta.env.VITE_SOCKET_URL ||
  "https://alphabet-rush-server.onrender.com";

const socket = io(socketUrl);

export default socket;
