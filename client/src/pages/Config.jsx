import { useEffect, useState, useContext } from "react";
import { ServerContext } from "../context";
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
  Select,
  MenuItem,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SettingsApplicationsIcon from "@mui/icons-material/SettingsApplications";

const Config = () => {
  const { SERVER_URL } = useContext(ServerContext);
  const [robots, setRobots] = useState({});
  const [yamlData, setYamlData] = useState({});

  // state for dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [robotName, setRobotName] = useState("");
  const [waypoint, setWaypoint] = useState("");
  const [orientation, setOrientation] = useState("");
  const [charger, setCharger] = useState("");

  useEffect(() => {
    axios
      .get(`${SERVER_URL}/config`)
      .then((res) => {
        setRobots(res.data.robots);
        setYamlData(res.data);
      })
      .catch((err) => console.log(err));
  }, [SERVER_URL, yamlData]);

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
          <Button
            variant="contained"
            color="secondary"
            startIcon={<SettingsApplicationsIcon />}
            onClick={modifyYamlData}
          >
            Config
          </Button>
          <Button
            variant="contained"
            color="secondary"
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
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
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
          <Select
            label="Waypoint"
            margin="dense"
            id="waypoint"
            fullWidth
            value={waypoint}
            onChange={(e) => setWaypoint(e.target.value)}
          >
            <MenuItem value="tinyRobot3_charger">tinyRobot3_charger</MenuItem>
          </Select>
          <TextField
            label="Orientation"
            margin="dense"
            id="orientation"
            type="text"
            fullWidth
            onChange={(e) => setOrientation(e.target.value)}
          />
          <Select
            label="Charger"
            margin="dense"
            id="charger"
            type="text"
            fullWidth
            onChange={(e) => setCharger(e.target.value)}
            value={charger}
          >
            <MenuItem value="tinyRobot3_charger">tinyRobot3_charger</MenuItem>
          </Select>
        </DialogContent>
        <DialogActions>
          <Button color="secondary" onClick={() => setDialogOpen(false)}>
            Cancel
          </Button>
          <Button color="secondary">Add</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default Config;
