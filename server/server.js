const express = require("express");
const cors = require("cors");
const path = require("path");
const app = express();
require("dotenv").config();
require("events").EventEmitter.defaultMaxListeners = 20;

// get data from rmf-web api-server and send to client
const http = require("http");
const socketIo = require("socket.io");
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL, // Remove trailing slash
    credentials: true,
  },
});
const clientIO = require("socket.io-client");

const axios = require("axios");

io.on("connection", (socket) => {
  console.log("New client connected");
  try {
    const socket = clientIO(process.env.RMF_URL);

    function subscribeToRoom(roomName) {
      console.log(`Subscribing to room ${roomName}`);
      socket.emit("subscribe", { room: roomName });
    }

    function handleMapData(message) {
      io.emit("building_map", message);
    }

    // Fetch fleet names from the /fleet endpoint
    axios
      .get(`${process.env.RMF_URL}/fleets`)
      .then((response) => {
        const fleetNames = response.data; // assuming the response data is an array of fleet names

        // Subscribe to each fleet's state
        fleetNames.forEach((fleetName) => {
          subscribeToRoom(`/fleets/${fleetName.name}/state`);
          socket.on(`/fleets/${fleetName.name}/state`, (message) => {
            io.emit(`${fleetName.name}_state`, message);
          });
        });
      })
      .catch((err) => console.log(err));

    // Fetch tasks id from the /tasks endpoint
    axios
      .get(`${process.env.RMF_URL}/tasks`)
      .then((response) => {
        const tasksId = response.data; // assuming the response data is an array of fleet names

        // Subscribe to each fleet's state
        tasksId.forEach((task) => {
          subscribeToRoom(`/tasks/${task.booking.id}/state`);
          socket.on(`/tasks/${task.booking.id}/state`, (message) => {
            io.emit(`${task.booking.id}_state`, message);
          });
        });
      })
      .catch((err) => console.log(err));

    subscribeToRoom("/building_map");
    socket.on("/building_map", handleMapData);
  } catch (err) {
    console.log(err);
  }

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(
  cors({
    origin: process.env.CLIENT_URL, // Remove trailing slash
    credentials: true,
  })
);

app.get("/", (req, res) => {
  res.send("Hello, welcome to my server!");
});

app.get("/get_tasks", async (req, res) => {
  let data = {};

  try {
    const taskResponse = await fetch(`${process.env.RMF_URL}/tasks`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!taskResponse.ok) {
      throw new Error("Network response was not ok");
    }

    const taskData = await taskResponse.json();

    data = {
      tasks: taskData,
    };

    res.send(data);
  } catch (error) {
    console.error("Error getting map:", error.message);
    return;
  }
});

app.post("/dispatch_task", async (req, res) => {
  const { task_type, destination } = req.body;

  try {
    const response = await fetch(`${process.env.RMF_URL}/tasks/dispatch_task`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "dispatch_task_request",
        request: {
          unix_millis_earliest_start_time: 0,
          unix_millis_request_time: 1715315298891,
          priority: {
            type: "binary",
            value: 0,
          },
          category: task_type,
          description: {
            places: [destination],
            rounds: 1,
          },
          labels: null,
          requester: "stub",
        },
      }),
    });

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    res.send("Task dispatched");
  } catch (error) {
    console.error("Error dispatching task:", error.message);
    return;
  }
});

const port = process.env.PORT;
if (!port) {
  console.error("Error: The PORT environment variable is not defined.");
  process.exit(1);
}

// Any that are not found / default
app.use(function (req, res) {
  res.sendStatus(404);
});

server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
