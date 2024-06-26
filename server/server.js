const express = require("express");
const { spawn, exec } = require("child_process");
const cors = require("cors");
const multer = require("multer");
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
      .catch((err) => console.log(err.message));

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
      .catch((err) => console.log(err.message));

    subscribeToRoom("/building_map");
    socket.on("/building_map", handleMapData);
  } catch (err) {
    console.log(err.message);
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

// Ensure the target directory exists, create if not
const targetDir = process.env.IMG_DIR;
// fs.existsSync(targetDir) || fs.mkdirSync(targetDir, { recursive: true });

// Configure multer for file storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, targetDir);
  },
  filename: (req, file, cb) => {
    // Use the original file name, or you can rename the file here
    cb(null, file.originalname);
  },
});

const upload = multer({ storage: storage });

// Function to start ROS launch
let rosProcess = null;
let rosProcess2 = null;
let dockerComposeProcess = null;
let rmfApiServer = null;

const startRos = () => {
  if (!rosProcess) {
    const command = `source ${process.env.SOURCE_DIR} && ros2 launch ${process.env.ROS_COMMAD}`;
    rosProcess = spawn("bash", ["-c", command]);

    rosProcess.stdout.on("data", (data) => {
      // console.log(`ROS stdout: ${data}`);
    });

    rosProcess.stderr.on("data", (data) => {
      console.error(`ROS stderr: ${data}`);
    });

    rosProcess.on("close", (code) => {
      console.log(`ROS process exited with code ${code}`);
      rosProcess = null;
    });

    console.log("ROS started");
  } else {
    console.log("ROS process is already running");
  }
};

const startRos2 = () => {
  if (!rosProcess2) {
    const command = `source ${process.env.SOURCE_DIR} && ros2 launch ${process.env.ROS_COMMAD2}`;
    rosProcess2 = spawn("bash", ["-c", command]);

    rosProcess2.stdout.on("data", (data) => {
      // console.log(`Another Package stdout: ${data}`);
    });

    rosProcess2.stderr.on("data", (data) => {
      console.error(`Another Package stderr: ${data}`);
    });

    rosProcess2.on("close", (code) => {
      console.log(`Another Package process exited with code ${code}`);
      rosProcess2 = null;
    });

    console.log("Another ROS package launched");
  } else {
    console.log("Another ROS package process is already running");
  }
};

const shutdownProcesses = () => {
  if (rosProcess) {
    rosProcess.kill("SIGINT"); // Send SIGINT to gracefully shut down the process
    console.log("Shutting down ROS process...");
    rosProcess = null; // Reset the variable to indicate the process is no longer running
  } else {
    console.log("ROS process is not running.");
  }

  if (rosProcess2) {
    rosProcess2.kill("SIGINT"); // Send SIGINT to gracefully shut down the process
    console.log("Shutting down Another ROS package process...");
    rosProcess2 = null; // Reset the variable to indicate the process is no longer running
  } else {
    console.log("Another ROS package process is not running.");
  }
};

const startRmfApiServer = () => {
  if (!rmfApiServer) {
    rmfApiServer = spawn("npm", ["start"], {
      cwd: process.env.API_SERVER,
    });

    rmfApiServer.stdout.on("data", (data) => {
      console.log(`Rmf api-server stdout: ${data}`);
    });

    rmfApiServer.stderr.on("data", (data) => {
      console.error(`Rmf api-server stderr: ${data}`);
    });

    rmfApiServer.on("close", (code) => {
      console.log(`Rmf api-server process exited with code ${code}`);
      rmfApiServer = null;
    });

    console.log("Rmf api-server started");
  } else {
    console.log("Rmf api-server process is already running");
  }
};

const startDockerCompose = () => {
  if (!dockerComposeProcess) {
    const command = `docker compose -f mission_dispatch_services.yaml up`;
    dockerComposeProcess = spawn("bash", ["-c", command], {
      cwd: "/home/nanofleet/isaac_mission_dispatch/docker_compose",
    });

    dockerComposeProcess.stdout.on("data", (data) => {
      console.log(`Docker Compose stdout: ${data}`);
    });

    dockerComposeProcess.stderr.on("data", (data) => {
      console.error(`Docker Compose stderr: ${data}`);
    });

    dockerComposeProcess.on("close", (code) => {
      console.log(`Docker Compose process exited with code ${code}`);
      dockerComposeProcess = null;
    });

    console.log("Docker Compose started");
  } else {
    console.log("Docker Compose process is already running");
  }
};

const shutdownDockerCompose = () => {
  if (dockerComposeProcess) {
    console.log("Shutting down Docker Compose...");
    const downCommand = `docker compose -f mission_dispatch_services.yaml down`;
    spawn("bash", ["-c", downCommand], {
      cwd: "/home/nanofleet/isaac_mission_dispatch/docker_compose",
    });
  }
};

// Function to stop ROS launch and rebuild
// const restartRos = () => {
//   if (rosProcess) {
//     rosProcess.kill();
//     rosProcess = null;

//     const colconBuild = spawn("colcon", ["build"], {
//       cwd: "/home/msf1/rmf_ws",
//     });

//     colconBuild.stdout.on("data", (data) => {
//       console.log(`stdout: ${data}`);
//     });

//     colconBuild.stderr.on("data", (data) => {
//       console.error(`stderr: ${data}`);
//     });

//     colconBuild.on("close", (code) => {
//       console.log(`Colcon build exited with code ${code}`);

//       io.emit("colconBuildComplete", { code }); // Emit an event to the client side indicating that the colcon build has completed
//       startRos();
//     });
//   } else {
//     console.log("No ROS process running");
//   }
// };

app.get("/", (req, res) => {
  res.send("Hello, welcome to my server!");
});

app.get("/get_fleets", async (req, res) => {
  let data = {};

  try {
    const fleetResponse = await fetch(`${process.env.RMF_URL}/fleets`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!fleetResponse.ok) {
      throw new Error("Network response was not ok");
    }

    const fleetData = await fleetResponse.json();

    data = {
      fleets: fleetData,
    };

    res.send(data);
  } catch (error) {
    console.error("Error getting fleet:", error.message);
    return;
  }
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

app.get("/get_yaml_map", async (req, res) => {
  const yamlFilePath = path.join(
    process.env.BUILDING_DIR,
    process.env.BUILDING_FILENAME
  );

  try {
    const file = fs.readFileSync(yamlFilePath, "utf8");

    if (!file) {
      console.error("Error: The building YAML file is empty.");
      return "Error: The building YAML file is empty";
    }

    const data = yaml.parse(file);
    res.send(data);
  } catch (error) {
    console.error(`Error reading building YAML file: ${error}`);
    return null;
  }
});

app.get("/config", (req, res) => {
  const filename = req.query.filename;
  const yamlFilePath = path.join(process.env.CONFIG_DIR, filename);

  // Function to read the YAML file
  try {
    const file = fs.readFileSync(yamlFilePath, "utf8");

    if (!file) {
      console.error("Error: The config YAML file is empty.");
      return "Error: The config YAML file is empty";
    }

    const data = yaml.parse(file);
    res.send(data);
  } catch (e) {
    res.send({ error: e.message });
  }
});

app.post("/update_config", (req, res) => {
  const data = req.body;
  // Path to the YAML file
  const yamlFilePath = path.join(process.env.CONFIG_DIR, "config.yaml");

  // Function to write to the YAML file
  try {
    const yamlStr = yaml.stringify(data, { indent: 2 });
    fs.writeFileSync(yamlFilePath, yamlStr, "utf8");
    res.send("Fleet updated successfully");
  } catch (e) {
    console.error(`Error writing YAML file: ${e}`);
  }
});

app.post("/create_config", (req, res) => {
  const { filename, content } = req.body;

  const filePath = path.join(process.env.CONFIG_DIR, filename);

  const yamlContent = yaml.stringify(content, 4);

  fs.writeFile(filePath, yamlContent, (err) => {
    if (err) {
      return res.status(500).send("Error writing file");
    }
    res.send("File written successfully");
  });
});

app.post("/upload_map", upload.single("file"), (req, res) => {
  if (req.file) {
    res.send({
      message: "File uploaded successfully",
      filePath: req.file.path,
    });
  } else {
    res.status(400).send({ message: "Error uploading file" });
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

// endpoint to colcon build specific packages
app.post("/colcon_build", async (req, res) => {
  const params = req.body.params;

  try {
    const colconBuild = spawn(
      "colcon",
      ["build", "--packages-select", params],
      {
        cwd: process.env.CWD,
      }
    );

    colconBuild.stdout.on("data", (data) => {
      console.log(`stdout: ${data}`);
    });

    colconBuild.stderr.on("data", (data) => {
      console.error(`stderr: ${data}`);
    });

    colconBuild.on("close", (code) => {
      console.log(`Colcon build exited with code ${code}`);

      io.emit("colconBuildComplete", { code }); // Emit an event to the client side indicating that the colcon build has completed
    });
  } catch (error) {
    console.log("Error building packages: ", error);
  }
});

app.post("/launch_ros", async (req, res) => {
  try {
    startRos();
    startRos2();
  } catch (error) {
    console.log("Error launch Ros: ", error);
  }
});

app.post("/shutdown_ros", async (req, res) => {
  try {
    shutdownProcesses();
  } catch (error) {
    console.log("Error shutdown Ros: ", error);
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

// Listen for shutdown signals
// process.on("SIGINT", shutdownDockerCompose);
// process.on("SIGTERM", shutdownDockerCompose);

server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
