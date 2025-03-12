const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const fs = require("fs");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", 
    methods: ["GET", "POST"],
  },
});

app.use(cors());

let sensorData = [];
let index = 0;

fs.readFile("sensor_data.json", "utf-8", (err, data) => {
  if (err) {
    console.error("Error loading sensor data:", err);
    return;
  }
  try {
    sensorData = JSON.parse(data);
    console.log(`Loaded ${sensorData.length} sensor readings.`);
  } catch (jsonError) {
    console.error("Invalid JSON format in sensor_data.json:", jsonError);
  }
});


function sendNextSensorData() {
  if (index < sensorData.length - 1) {
    const currentData = sensorData[index];
    const nextData = sensorData[index + 1];

    const delay = (nextData.timestamp - currentData.timestamp)*10000 || 1000;

    io.emit("sensorUpdate", currentData); 
    index++;

    setTimeout(sendNextSensorData, delay); // Schedule next update
  } else {
    index = 0; 
  }
}

io.on("connection", (socket) => {
  console.log(`Client connected: ${socket.id}`);
  if (index === 0) sendNextSensorData();

  socket.on("disconnect", () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

server.listen(5000, () => {
  console.log("Server running on port 5000");
});
