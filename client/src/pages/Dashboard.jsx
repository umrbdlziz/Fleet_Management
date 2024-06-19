import { Grid, Box } from "@mui/material";

import RobotInfo from "../components/RobotInfo";
import RobotRuntime from "../components/RobotRuntime";
import TaskInfo from "../components/TasksInfo";
import RobotPerformance from "../components/RobotPerformance";

const Dashboard = () => {
  return (
    <Box m={2}>
      <Grid container spacing={2}>
        <Grid item sm={12} md={6}>
          <RobotInfo />
        </Grid>
        <Grid item sm={12} md={6}>
          <RobotRuntime />
        </Grid>
        <Grid item sm={12} md={6}>
          <TaskInfo />
        </Grid>
        <Grid item sm={12} md={6}>
          <RobotPerformance />
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
