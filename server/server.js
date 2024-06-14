const express = require("express");
const { spawn, exec } = require("child_process");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const yaml = require("yaml");
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
      // console.log(`Subscribing to room ${roomName}`);
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

let rosProcess = null;

// Function to start ROS launch
const startRos = () => {
  if (!rosProcess) {
    rosProcess = spawn("bash", [
      "-c",
      "source /home/msf1/rmf_ws/install/setup.bash && ros2 launch rmf_demos_gz_classic office.launch.xml",
      { shell: true },
    ]);

    rosProcess.stdout.on("data", (data) => {
      //console.log(`stdout: ${data}`);
    });

    rosProcess.stderr.on("data", (data) => {
      console.error(`stderr: ${data}`);
    });

    rosProcess.on("close", (code) => {
      console.log(`ROS process exited with code ${code}`);
      rosProcess = null;
    });

    console.log("ROS launch started");
  } else {
    console.log("ROS is already running");
  }
};

// Function to stop ROS launch and rebuild
const restartRos = () => {
  if (rosProcess) {
    rosProcess.kill();
    rosProcess = null;

    const colconBuild = spawn("colcon", ["build"], {
      cwd: "/home/msf1/rmf_ws",
    });

    colconBuild.stdout.on("data", (data) => {
      console.log(`stdout: ${data}`);
    });

    colconBuild.stderr.on("data", (data) => {
      console.error(`stderr: ${data}`);
    });

    colconBuild.on("close", (code) => {
      console.log(`Colcon build exited with code ${code}`);

      io.emit("colconBuildComplete", { code }); // Emit an event to the client side indicating that the colcon build has completed
      startRos();
    });
  } else {
    console.log("No ROS process running");
  }
};

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

app.get("/config", (req, res) => {
  // Path to the YAML file
  const yamlFilePath =
    "/home/msf1/rmf_ws/src/rmf_demos/rmf_demos/config/office/tinyRobot_config.yaml";

  // Function to read the YAML file
  try {
    const file = fs.readFileSync(yamlFilePath, "utf8");

    if (!file) {
      console.error("Error: The YAML file is empty.");
      return "Error: The YAML file is empty";
    }

    const data = yaml.parse(file);
    res.send(data);
  } catch (e) {
    console.error(`Error reading YAML file: ${e}`);
    return null;
  }
});

app.post("/update_config", (req, res) => {
  const data = req.body;
  // Path to the YAML file
  const yamlFilePath =
    "/home/msf1/rmf_ws/src/rmf_demos/rmf_demos/config/office/tinyRobot_config.yaml";

  // Function to write to the YAML file
  try {
    const yamlStr = yaml.stringify(data, { indent: 2 });
    fs.writeFileSync(yamlFilePath, yamlStr, "utf8");
    res.send("YAML file updated successfully");
  } catch (e) {
    console.error(`Error writing YAML file: ${e}`);
  }
});

app.post("/run-traffic-editor", (req, res) => {
  exec("traffic-editor", (error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing traffic-editor: ${error}`);
      return res.status(500).send("Failed to run Traffic Editor");
    }
    if (stderr) {
      console.error(`stderr: ${stderr}`);
    }
    console.log(`stdout: ${stdout}`);
    res.send("Traffic Editor started");
  });
});

app.post("/restart_ros", async (req, res) => {
  try {
    restartRos();
    res.send("Building started");
  } catch (error) {
    console.log(error);
  }
});

app.post("/light", async (req, res) => {
  // const data = req.body;
  console.log("Light command received:", req.body);

  try {
    res.send({ Result: 1, Message: "Command received successfully!" });
  } catch (error) {
    console.log("Error changing light:", error.message);
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
  startRos();
});
