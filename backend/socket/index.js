import { io } from "socket.io-client";

// 🔌 socket instance (single source)
export const socket = io("http://localhost:5000", {
  autoConnect: false, // 🔥 manual control
});

// 🔴 CONNECT
export const connectSocket = () => {
  if (!socket.connected) {
    socket.connect();
  }
};

// 🔴 DISCONNECT
export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
  }
};