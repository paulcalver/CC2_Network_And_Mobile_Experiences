import express from "express";
import http from "http";
import { Server } from "socket.io";

//// REMOVE IF YOU PUT ON RENDER //////
//import open, {openApp, apps} from 'open';//only needed for a simple development tool remove if hosting online see above
//// REMOVE IF YOU PUT ON RENDER //////

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const port = process.env.PORT || 3500;

app.use(express.static("public"));

io.on("connection", (socket) => {
  console.log("device connected:", socket.id);
  
  // Receive motion data from any phone
  socket.on("motion", (data) => {
    // Broadcast to ALL other clients (all other phones)
    socket.broadcast.emit("motion", data);
  });

  socket.on("disconnect", () => {
    console.log("device disconnected:", socket.id);
  });
});

server.listen(port, () => {
  console.log("listening on: " + port);
});

//// REMOVE IF YOU PUT ON RENDER //////
//open in browser: dev environment only!
//await open(`http://localhost:${port}`);//opens in your default browser
//// REMOVE IF YOU PUT ON RENDER //////