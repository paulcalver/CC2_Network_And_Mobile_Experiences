import express from "express";
import { Server } from "socket.io";
import https from "https";
import http from "http";
import fs from "fs";
import open from 'open';

const app = express();
const isProduction = process.env.NODE_ENV === 'production';

// Create server based on environment
let server;
if (isProduction) {
  // Production: Use HTTP (Render handles HTTPS)
  server = http.createServer(app);
  console.log("Running in production mode (HTTP)");
} else {
  // Development: Use HTTPS with self-signed certificate (required for iOS device motion)
  const serverOptions = {
    key: fs.readFileSync('./server.key'),
    cert: fs.readFileSync('./server.cert')
  };
  server = https.createServer(serverOptions, app);
  console.log("Running in development mode (HTTPS)");
}

const io = new Server(server);
const port = process.env.PORT || 3000;

app.use(express.static("public"));

// Track all connected users and their latest motion
let connectedUsers = {};

io.on("connection", (socket) => {
  console.log("device connected:", socket.id);
  
  // Send existing users to the new joiner
  socket.emit("existing_users", connectedUsers);
  
  // Receive motion data from any phone
  socket.on("motion", (data) => {
    // Store this user's latest motion with all the data
    connectedUsers[socket.id] = {
      // Ball position (for rendering)
      x: data.x,
      y: data.y,
      col: data.col,
      
      // Raw sensor data (in case you want to use it later)
      accX: data.accX || 0,
      accY: data.accY || 0,
      accZ: data.accZ || 0,
      rrateX: data.rrateX || 0,
      rrateY: data.rrateY || 0,
      rrateZ: data.rrateZ || 0,
      alpha: data.alpha || 0,
      beta: data.beta || 0,
      gamma: data.gamma || 0,
      
      timestamp: Date.now()
    };
    
    // Broadcast to ALL other clients
    socket.broadcast.emit("motion", {
      id: socket.id,
      x: data.x,
      y: data.y,
      col: data.col,
      
      // Include raw sensor data in broadcast
      accX: data.accX || 0,
      accY: data.accY || 0,
      accZ: data.accZ || 0,
      rrateX: data.rrateX || 0,
      rrateY: data.rrateY || 0,
      rrateZ: data.rrateZ || 0,
      alpha: data.alpha || 0,
      beta: data.beta || 0,
      gamma: data.gamma || 0
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
  console.log("Server listening on port: " + port);

  // Auto-open browser in development only
  if (!isProduction) {
    open(`https://localhost:${port}`);
  }
});