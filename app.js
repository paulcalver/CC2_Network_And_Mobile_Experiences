import express from "express";
import http from "http";
import { Server } from "socket.io";

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const port = process.env.PORT || 3500;

app.use(express.static("public"));

// Track all connected users and their latest motion
let connectedUsers = {};

io.on("connection", (socket) => {
  console.log("device connected:", socket.id);
  
  // Send existing users to the new joiner
  socket.emit("existing_users", connectedUsers);
  
  // Receive motion data from any phone
  socket.on("motion", (data) => {
    // Store this user's latest motion
    connectedUsers[socket.id] = {
      x: data.x,
      y: data.y,
      z: data.z,
      col: data.col,
      timestamp: Date.now()
    };
    
    // Broadcast to ALL other clients
    socket.broadcast.emit("motion", {
      id: socket.id,
      x: data.x,
      y: data.y,
      z: data.z,
      col: data.col
    });
  });

  socket.on("disconnect", () => {
    console.log("device disconnected:", socket.id);
    // Remove user from tracking
    delete connectedUsers[socket.id];
    // Tell everyone else this user left
    io.emit("user_left", socket.id);
  });
});

server.listen(port, () => {
  console.log("listening on: " + port);
});