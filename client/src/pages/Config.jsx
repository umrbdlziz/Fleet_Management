import { useEffect, useState, useContext } from "react";
import io from "socket.io-client";
import axios from "axios";
import {
  Typography,
  Grid,
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
import DataYaml from "../components/DataYaml";
import FleetConfigDialog from "../components/FleetConfigDialog";
import RenderRobotConfig from "../components/RenderRobotConfig";

const Config = () => {
  const { SERVER_URL } = useContext(ServerContext);
  const [robots, setRobots] = useState({});
  const [yamlData, setYamlData] = useState({});
  const [waypoints, setWaypoints] = useState([]);
  const [chargerStation, setChargerStation] = useState([]);
  const [errMessage, setErrMessage] = useState(false);

  const [fleetDialog, setFleetDialog] = useState(false);
  const [fileName, setFileName] = useState("config.yaml");

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

  // useEffect to listen to colcon build complete event in socket io
  useEffect(() => {
    const socket = io(SERVER_URL);

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

    return () => {
      socket.disconnect();
    };
  }, [SERVER_URL]);

  // useEffect to get the config file
  useEffect(() => {
    axios
      .get(`${SERVER_URL}/config?filename=${fileName}`)
      .then((res) => {
        if (res.data.error) {
          setErrMessage(true);
        } else {
          setRobots(res.data.robots);
          setYamlData(res.data);
        }
      })
      .catch((err) => console.log("Error reading config YAML file: ", err));
  }, [SERVER_URL, yamlData, fileName]);

  // useEffect to get the waypoints and charger stations in yaml building map
  useEffect(() => {
    axios
      .get(`${SERVER_URL}/get_yaml_map`)
      .then((res) => {
        setWaypoints(findWaypoints(res.data.levels.L1.vertices));
        setChargerStation(findChargers(res.data.levels.L1.vertices));
      })
      .catch((err) => {
        console.log(err);
      });
  }, [SERVER_URL]);

  const findChargers = (waypoints) => {
    return waypoints.filter(
      (waypoint) => waypoint[4] && waypoint[4].is_charger
    );
  };

  const findWaypoints = (waypoints) => {
    return waypoints.filter((waypoint) => waypoint[3] !== "");
  };

  const addRobot = () => {
    if (!robots[robotName]) {
      // Add new robot configuration
      yamlData.robots[robotName] = {
        robot_config: {
          max_delay: 15,
        },
        rmf_config: {
          robot_state_update_frequency: 10,
          start: {
            map_name: "L1",
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
        setSnackbarMessage({
          message: res.data,
          severity: "success",
        });
        setOpenSnackbar(true);
        setDialogOpen(false);
        setYamlData({}); // Force reload
      });
    } else {
      console.error(`Robot ${robotName} already exists!`);
    }
  };

  const deleteRobot = (robotname) => {
    // Delete robot configuration
    delete yamlData.robots[robotname];
    console.log(`Deleting robot ${robotname}`, yamlData);
    axios.post(`${SERVER_URL}/update_config`, yamlData).then((res) => {
      setSnackbarMessage({
        message: res.data,
        severity: "success",
      });
      setOpenSnackbar(true);
      setYamlData({}); // Force reload
    });
  };

  const colconBuild = async () => {
    try {
      const response = await axios.post(`${SERVER_URL}/colcon_build`, {
        params: "fleet_rmf_nanogrind",
      });
      console.log(response.data);
      setIsLoading(true);
    } catch (error) {
      console.error("Error restarting ROS: ", error);
    }
  };

  const handleCreateConfig = async (
    filename,
    name,
    ip,
    finishing_request,
    actionCategories
  ) => {
    try {
      const response = await axios.post(`${SERVER_URL}/create_config`, {
        filename: filename,
        content: DataYaml(name, ip, finishing_request, actionCategories),
      });
      setFileName(filename);
      setOpenSnackbar(true);
      setSnackbarMessage({
        message: response.data,
        severity: "success",
      });
      setFleetDialog(false);
      setErrMessage(false);
      setYamlData({}); // Force reload
    } catch (error) {
      console.error("Error creating config: ", error);
    }
  };

  return (
    <>
      <Box p={2} display="flex" flexDirection="column" gap={2}>
        <Typography variant="h4" gutterBottom>
          Robot Configurations
        </Typography>

        <Box display="flex" justifyContent="space-between">
          <Button
            variant="contained"
            color="secondary"
            onClick={() => setFleetDialog(true)}
          >
            Start Configuration
          </Button>

          <Box display="flex" flexDirection="row-reverse" gap={2}>
            <LoadingButton
              variant="contained"
              loading={isLoading}
              startIcon={<SettingsApplicationsIcon />}
              onClick={colconBuild}
              color="info"
              loadingIndicator={<CircularProgress color="info" size={20} />}
            >
              <span>Build</span>
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
        </Box>
        {errMessage ? (
          <Typography>No configuration file in the directory</Typography>
        ) : (
          <Grid container spacing={3}>
            {Object.keys(robots).length > 0 ? (
              Object.entries(robots).map(([robotName, config]) => (
                <Grid item xs={12} md={4} lg={3} key={robotName}>
                  <RenderRobotConfig
                    robotName={robotName}
                    config={config}
                    deleteRobot={deleteRobot}
                  />{" "}
                </Grid>
              ))
            ) : (
              <Grid item xs={12}>
                <Typography variant="body1">
                  No robots found in the configuration file...
                </Typography>
              </Grid>
            )}
          </Grid>
        )}
      </Box>

      {/**Dialog for fleet configuration */}
      <FleetConfigDialog
        open={fleetDialog}
        handleClose={() => setFleetDialog(false)}
        handleCreateConfig={handleCreateConfig}
      />

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
              <MenuItem key={waypoint[3]} value={waypoint[3]}>
                {waypoint[3]}
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
              <MenuItem key={charger[3]} value={charger[3]}>
                {charger[3]}
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
          <Button variant="contained" color="secondary" onClick={addRobot}>
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
