import { io } from "socket.io-client";

/* 🌐 SOCKET INSTANCE */
export const socket = io("http://localhost:5000", {
  autoConnect: false,       // ❗ manually connect control
  transports: ["websocket"], // ⚡ faster connection
});

/* 🔌 CONNECT FUNCTION */
export const connectSocket = () => {
  if (!socket.connected) {
    socket.connect();
    console.log("🟢 Socket Connected:", socket.id);
  }
};

/* ❌ DISCONNECT FUNCTION */
export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
    console.log("🔴 Socket Disconnected");
  }
};