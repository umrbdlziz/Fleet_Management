import { useEffect, useContext, useState } from "react";
import { BarChart } from "@mui/x-charts/BarChart";
import { Paper, Typography } from "@mui/material";
import io from "socket.io-client";

import { ServerContext } from "../context";

const RobotRuntime = () => {
  const { SERVER_URL } = useContext(ServerContext);
  const [robots, setRobots] = useState({});

  useEffect(() => {
    const socket = io(SERVER_URL);

    socket.on("connect", () => {
      console.log(`Connected to server with id ${socket.id}`);
    });

    socket.on("tinyRobot_state", (message) => {
      setRobots(message.robots);
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from server");
    });

    return () => socket.disconnect();
  }, [SERVER_URL]);

  // Prepare data for the BarChart
  const robotNames = Object.keys(robots);
  const robotData = robotNames.map(
    (robot) => robots[robot].unix_millis_time / 3600000
  );

  return (
    <Paper
      sx={{
        padding: "10px",
        height: "420px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Typography variant="h6">Robot Runtime</Typography>
      <BarChart
        xAxis={[{ scaleType: "band", data: robotNames }]}
        series={[
          {
            data: robotData,
            label: "Robot runtime (hours)",
          },
        ]}
        width={550}
        height={400}
      />
    </Paper>
  );
};

export default RobotRuntime;
