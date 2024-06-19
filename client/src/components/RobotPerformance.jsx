import { useEffect, useContext, useState } from "react";
import { BarChart } from "@mui/x-charts/BarChart";
import { Paper, Typography } from "@mui/material";
import axios from "axios";

import { ServerContext } from "../context";

const RobotPerformance = () => {
  const { SERVER_URL } = useContext(ServerContext);
  const [fleets, setFleets] = useState({});
  const [tasks, setTasks] = useState([]);
  const [robotTaskCount, setRobotTaskCount] = useState({});

  useEffect(() => {
    axios
      .get(`${SERVER_URL}/get_fleets`)
      .then((res) => {
        setFleets(res.data.fleets[0].robots);
      })
      .catch((err) => console.log(err));
  }, [SERVER_URL]);

  useEffect(() => {
    axios
      .get(`${SERVER_URL}/get_tasks`)
      .then((res) => {
        setTasks(res.data.tasks);
      })
      .catch((err) => console.log(err));
  }, [SERVER_URL]); // Added missing dependency array

  useEffect(() => {
    // Calculate robotTaskCount whenever tasks or fleets change
    const count = {};
    tasks.forEach((task) => {
      const robotName = task.assigned_to.name;
      if (fleets[robotName]) {
        count[robotName] = (count[robotName] || 0) + 1;
      }
    });
    setRobotTaskCount(count);
  }, [tasks, fleets]);

  // Prepare data for BarChart
  const xAxisData = Object.keys(fleets);
  const seriesData = Object.values(robotTaskCount).map((count) => count);

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
      <Typography variant="h6">Robot Performance</Typography>
      <BarChart
        xAxis={[{ scaleType: "band", data: xAxisData }]}
        series={[
          {
            data: seriesData,
            stack: "A",
            label: "Tasks Assigned",
            color: "#4ECBFF", // Example: setting a specific color
          },
        ]}
        width={550}
        height={400}
      />
    </Paper>
  );
};

export default RobotPerformance;
