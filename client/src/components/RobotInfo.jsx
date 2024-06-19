import { useEffect, useContext, useState } from "react";
import {
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import io from "socket.io-client";

import { ServerContext } from "../context";

const RobotInfo = () => {
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

  return (
    <Paper sx={{ padding: "10px", height: "420px" }}>
      <Typography variant="h6">Robot Info</Typography>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                <Typography variant="body1">Robot</Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body1">Status</Typography>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {Object.keys(robots).map((robot) => (
              <TableRow key={robot}>
                <TableCell>
                  <Typography variant="body1">{robot}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body1">
                    {robots[robot].status}
                  </Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

export default RobotInfo;
