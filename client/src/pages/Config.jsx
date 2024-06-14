import { useEffect, useState, useContext } from "react";
import io from "socket.io-client";
import axios from "axios";
import {
  Typography,
  Paper,
  Grid,
  Divider,
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  MenuItem,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SettingsApplicationsIcon from "@mui/icons-material/SettingsApplications";
import LoadingButton from "@mui/lab/LoadingButton";
import CircularProgress from "@mui/material/CircularProgress";

import { ServerContext } from "../context";
import { CustomSnackbar } from "../utils";

const Config = () => {
  const { SERVER_URL } = useContext(ServerContext);
  const [robots, setRobots] = useState({});
  const [yamlData, setYamlData] = useState({});
  const [waypoints, setWaypoints] = useState([]);
  const [chargerStation, setChargerStation] = useState([]);

  // state for dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [robotName, setRobotName] = useState("");
  const [waypoint, setWaypoint] = useState("");
  const [orientation, setOrientation] = useState("");
  const [charger, setCharger] = useState("");

  // state for snackbar
  const [isLoading, setIsLoading] = useState(false);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState({
    message: "",
    severity: "",
  });

  useEffect(() => {
    const socket = io(SERVER_URL);

    // use for troubleshooting connection
    // socket.on("connect", () => {
    //   console.log(`Connected to server with id ${socket.id}`);
    // });

    socket.on("colconBuildComplete", (data) => {
      if (data.code === 0) {
        setIsLoading(false);
        setOpenSnackbar(true);
        setSnackbarMessage({
          message: "Build complete",
          severity: "success",
        });
      } else {
        console.error("Build failed");
      }
    });

    socket.on("building_map", (data) => {
      setWaypoints(findWaypoints(data.levels[0].nav_graphs[0].vertices));
      setChargerStation(findChargers(data.levels[0].nav_graphs[0].vertices));
    });

    return () => {
      socket.disconnect();
    };
  }, [SERVER_URL]);

  useEffect(() => {
    axios
      .get(`${SERVER_URL}/config`)
      .then((res) => {
        setRobots(res.data.robots);
        setYamlData(res.data);
      })
      .catch((err) => console.log(err));
  }, [SERVER_URL, yamlData]);

  const findChargers = (waypoints) => {
    return waypoints
      .filter((waypoint) =>
        waypoint.params.some(
          (param) => param.name === "is_charger" && param.value_bool === true
        )
      )
      .map((waypoint) => waypoint.name);
  };

  const findWaypoints = (waypoints) => {
    return waypoints.filter((waypoint) => waypoint.name !== "");
  };

  const modifyYamlData = () => {
    if (!robots[robotName]) {
      // Add new robot configuration
      yamlData.robots[robotName] = {
        robot_config: {
          max_delay: 15,
        },
        rmf_config: {
          robot_state_update_frequency: 10,
          start: {
            map_name: "L2",
            waypoint: waypoint,
            orientation: orientation, // radians
          },
          charger: {
            waypoint: charger,
          },
        },
      };

      console.log(`Adding new robot ${robotName}`, yamlData);
      axios.post(`${SERVER_URL}/update_config`, yamlData).then((res) => {
        console.log(res.data);
        setYamlData({}); // Force reload
      });
    } else {
      console.error(`Robot ${robotName} already exists!`);
    }
  };

  const colconBuild = async () => {
    try {
      const response = await axios.post(`${SERVER_URL}/restart_ros`);
      console.log(response.data);
      setIsLoading(true);
    } catch (error) {
      console.error("Error restarting ROS: ", error);
    }
  };

  const renderRobotConfig = (robotName, config) => {
    return (
      <Paper sx={{ padding: "16px", marginBottom: "16px" }} key={robotName}>
        <Typography variant="h6">{robotName}</Typography>
        <Divider sx={{ marginBottom: "8px" }} />
        <Typography variant="subtitle1">Robot Config</Typography>
        <Typography variant="body2">
          Max Delay: {config.robot_config.max_delay} seconds
        </Typography>
        <Divider sx={{ margin: "8px 0" }} />
        <Typography variant="subtitle1">RMF Config</Typography>
        <Typography variant="body2">
          State Update Frequency:{" "}
          {config.rmf_config.robot_state_update_frequency} seconds
        </Typography>
        <Typography variant="body2">
          Start:
          <br />
          &nbsp;&nbsp;Map Name: {config.rmf_config.start.map_name}
          <br />
          &nbsp;&nbsp;Waypoint: {config.rmf_config.start.waypoint}
          <br />
          &nbsp;&nbsp;Orientation: {config.rmf_config.start.orientation} radians
        </Typography>
        <Typography variant="body2">
          Charger Waypoint: {config.rmf_config.charger.waypoint}
        </Typography>
      </Paper>
    );
  };

  return (
    <>
      <Box p={2}>
        <Typography variant="h4" gutterBottom>
          Robot Configurations
        </Typography>
        <Box display="flex" flexDirection="row-reverse" gap={2}>
          <LoadingButton
            variant="contained"
            loading={isLoading}
            startIcon={<SettingsApplicationsIcon />}
            onClick={colconBuild}
            color="info"
            loadingIndicator={<CircularProgress color="info" size={20} />}
          >
            <span>Config</span>
          </LoadingButton>
          <Button
            variant="contained"
            color="info"
            startIcon={<AddIcon />}
            onClick={() => setDialogOpen(true)}
          >
            Add Robot
          </Button>
        </Box>
        <Grid container spacing={3} p={2}>
          {Object.keys(robots).length > 0 ? (
            Object.entries(robots).map(([robotName, config]) => (
              <Grid item xs={12} md={4} lg={3} key={robotName}>
                {renderRobotConfig(robotName, config)}
              </Grid>
            ))
          ) : (
            <Typography variant="body1">
              Loading robot configurations...
            </Typography>
          )}
        </Grid>
      </Box>

      {/**Dialog to add robot */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        sx={{ padding: "100px" }}
      >
        <DialogTitle>Add Robot</DialogTitle>
        <DialogContent>
          <TextField
            label="Robot Name"
            margin="dense"
            id="name"
            type="text"
            fullWidth
            onChange={(e) => setRobotName(e.target.value)}
          />
          <TextField
            select
            label="Waypoint"
            margin="dense"
            id="waypoint"
            fullWidth
            value={waypoint}
            onChange={(e) => setWaypoint(e.target.value)}
          >
            {waypoints.map((waypoint) => (
              <MenuItem key={waypoint.name} value={waypoint.name}>
                {waypoint.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Orientation"
            margin="dense"
            id="orientation"
            type="text"
            fullWidth
            onChange={(e) => setOrientation(e.target.value)}
          />
          <TextField
            select
            label="Charger"
            margin="dense"
            id="charger"
            type="text"
            fullWidth
            onChange={(e) => setCharger(e.target.value)}
            value={charger}
          >
            {chargerStation.map((charger) => (
              <MenuItem key={charger} value={charger}>
                {charger}
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions sx={{ paddingRight: "20px", paddingBottom: "20px" }}>
          <Button
            variant="outlined"
            color="secondary"
            onClick={() => setDialogOpen(false)}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="secondary"
            onClick={modifyYamlData}
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>

      {/**Snack bar to display build complete */}
      <CustomSnackbar
        open={openSnackbar}
        onClose={() => setOpenSnackbar(false)}
        message={snackbarMessage.message}
        severity={snackbarMessage.severity}
      />
    </>
  );
};

export default Config;
