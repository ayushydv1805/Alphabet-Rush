import { io } from "socket.io-client";

const socket = io("https://alphabet-rush-server.onrender.com");
export default socket;