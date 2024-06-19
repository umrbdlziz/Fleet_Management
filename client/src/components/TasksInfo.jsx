import { useContext, useEffect, useState } from "react";
import { PieChart } from "@mui/x-charts/PieChart";
import { Typography, Paper } from "@mui/material";
import axios from "axios";

import { ServerContext } from "../context";

const processData = (data) => {
  const statusCounts = {
    completed: 0,
    canceled: 0,
    queued: 0,
    underway: 0,
  };
  data.forEach((task) => {
    if (task.status === "completed") {
      statusCounts.completed += 1;
    } else if (task.status === "canceled") {
      statusCounts.canceled += 1;
    } else if (task.status === "queued") {
      statusCounts.queued += 1;
    } else if (task.status === "underway") {
      statusCounts.underway += 1;
    }
  });

  return Object.entries(statusCounts).map(([label, value]) => ({
    label,
    value,
  }));
};

const TasksInfo = () => {
  const { SERVER_URL } = useContext(ServerContext);
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    axios
      .get(`${SERVER_URL}/get_tasks`)
      .then((res) => {
        setTasks(res.data.tasks);
      })
      .catch((err) => {
        console.log(err);
      });
  }, [SERVER_URL]);
  const data = processData(tasks);

  const COLORS = ["#4ECBFF", "#FF8042", "#4CFFBE", "#FF4E50"];

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
      <Typography variant="h6">Tasks</Typography>
      <PieChart
        width={500}
        height={300}
        colors={COLORS}
        series={[
          {
            arcLabelMinAngle: 45,
            labelOffset: 600,
            data,
          },
        ]}
      ></PieChart>
    </Paper>
  );
};

export default TasksInfo;
