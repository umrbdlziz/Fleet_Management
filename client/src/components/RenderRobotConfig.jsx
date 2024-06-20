import { Typography, Paper, Divider, Button, Box } from "@mui/material";
import PropTypes from "prop-types";

const RenderRobotConfig = ({ robotName, config, deleteRobot }) => {
  return (
    <Paper sx={{ padding: "16px", marginBottom: "16px" }} key={robotName}>
      <Typography variant="h6">{robotName}</Typography>

      <Divider sx={{ margin: "8px 0" }} />
      <Typography variant="subtitle1">RMF Config</Typography>
      <Typography variant="body1">
        State Update Frequency: {config.rmf_config.robot_state_update_frequency}{" "}
        seconds
      </Typography>
      <Typography variant="body1">
        Start:
        <br />
        &nbsp;&nbsp;Map Name: {config.rmf_config.start.map_name}
        <br />
        &nbsp;&nbsp;Waypoint: {config.rmf_config.start.waypoint}
        <br />
        &nbsp;&nbsp;Orientation: {config.rmf_config.start.orientation} radians
      </Typography>
      <Typography variant="body1">
        Charger Waypoint: {config.rmf_config.charger.waypoint}
      </Typography>
      <Box display="flex" justifyContent="flex-end">
        <Button color="error" onClick={() => deleteRobot(robotName)}>
          Delete
        </Button>
      </Box>
    </Paper>
  );
};

RenderRobotConfig.propTypes = {
  robotName: PropTypes.string.isRequired,
  config: PropTypes.object.isRequired,
  deleteRobot: PropTypes.func.isRequired,
};

export default RenderRobotConfig;
