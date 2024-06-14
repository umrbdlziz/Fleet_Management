import { useEffect, useContext, useState, useCallback } from "react";
import {
  Paper,
  Typography,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  MenuItem,
} from "@mui/material";
import LoadingButton from "@mui/lab/LoadingButton";
import PlaylistAddIcon from "@mui/icons-material/PlaylistAdd";
import CircularProgress from "@mui/material/CircularProgress";
import io from "socket.io-client";
import axios from "axios";
import PropTypes from "prop-types";

import { ServerContext } from "../context";
import { CustomSnackbar } from "../utils";

const TaskBar = ({ waypoints }) => {
  const { SERVER_URL } = useContext(ServerContext);
  const [tasks, setTasks] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [taskType, setTaskType] = useState("");
  const [destination, setDestination] = useState("");
  const [tempTasks, setTempTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // state for snackbar
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [filteredWaypoints, setFilteredWaypoints] = useState([]);

  useEffect(() => {
    const waypointsWithName = waypoints.filter(
      (waypoint) => waypoint.name !== ""
    );
    setFilteredWaypoints(waypointsWithName);
  }, [waypoints]);

  useEffect(() => {
    const socket = io(SERVER_URL);

    // use for troubleshooting connection
    // socket.on("connect", () => {
    //   console.log(`Connected to server with id ${socket.id}`);
    // });

    tasks.forEach((task) => {
      socket.on(`${task.booking.id}_state`, (data) => {
        setTempTasks((prevTasks) => {
          const existingTaskIndex = prevTasks.findIndex(
            (task) => task.booking.id === data.booking.id
          );
          if (existingTaskIndex !== -1) {
            // If the task already exists, update it
            const updatedTasks = [...prevTasks];
            updatedTasks[existingTaskIndex] = data;
            return updatedTasks;
          } else {
            // If the task doesn't exist, add it
            return [...prevTasks, data];
          }
        });
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [SERVER_URL, tasks]);

  const dispatchTask = () => {
    if (!taskType || !destination) {
      setSnackbarOpen(true);
      return;
    }

    axios
      .post(`${SERVER_URL}/dispatch_task`, {
        task_type: taskType,
        destination: destination,
      })
      .then(() => {
        setIsLoading(true);
        setTimeout(() => {
          setOpenDialog(false);
          fetchTasks();
          setIsLoading(false);
          setTaskType("");
          setDestination("");
        }, 5000);
      })
      .catch((err) => console.error(err));
  };

  const fetchTasks = useCallback(() => {
    axios
      .get(`${SERVER_URL}/get_tasks`)
      .then((res) => {
        setTasks(res.data.tasks);
      })
      .catch((err) => {
        console.error(err);
      });
  }, [SERVER_URL]);

  useEffect(() => {
    fetchTasks();
  }, [SERVER_URL, fetchTasks]);

  return (
    <>
      <Paper
        sx={{
          padding: "15px",
          height: "85vh",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          overflowY: "scroll",
        }}
      >
        <Typography variant="h4">Tasks</Typography>
        <Button
          variant="contained"
          startIcon={<PlaylistAddIcon />}
          color="info"
          onClick={() => setOpenDialog(true)}
        >
          Add Task
        </Button>
        <Box display="flex" flexDirection="column" gap={5}>
          {tasks.length !== 0 ? (
            [...tempTasks].reverse().map((task) => (
              <Box key={task.booking.id}>
                <Box>
                  <Typography variant="body1" component="div">
                    Task ID: {task.booking.id}
                  </Typography>
                </Box>
                <Box>
                  <Typography color="textSecondary" variant="caption">
                    Requester: {task.booking.requester}
                  </Typography>
                </Box>
                <Box>
                  <Typography color="textSecondary" variant="caption">
                    Category: {task.category}
                  </Typography>
                </Box>
                <Box>
                  <Typography color="textSecondary" variant="caption">
                    Robot Name: {task.assigned_to.name}
                  </Typography>
                </Box>
                <Box>
                  <Typography color="textSecondary" variant="caption">
                    Status: {task.status}
                  </Typography>
                </Box>
              </Box>
            ))
          ) : (
            <Box
              display="flex"
              justifyContent="center"
              alignItems="center"
              height="50vh"
            >
              <Typography variant="body1">No tasks available</Typography>
            </Box>
          )}
        </Box>
      </Paper>

      {/**Dialog to add new tasks */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle sx={{ width: "500px" }}>Create Task</DialogTitle>
        <DialogContent>
          <TextField
            select
            autoFocus
            margin="dense"
            id="name"
            label="Task Type"
            fullWidth
            onChange={(e) => setTaskType(e.target.value)}
            value={taskType}
          >
            <MenuItem value="patrol" key="patrol">
              Patrol
            </MenuItem>
          </TextField>
          <TextField
            select
            autoFocus
            margin="dense"
            id="name"
            label="Place Name"
            type="text"
            fullWidth
            onChange={(e) => setDestination(e.target.value)}
            value={destination}
          >
            {filteredWaypoints.map((filteredWaypoint) => (
              <MenuItem
                key={filteredWaypoint.name}
                value={filteredWaypoint.name}
              >
                {filteredWaypoint.name}
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button
            variant="outlined"
            color="secondary"
            onClick={() => setOpenDialog(false)}
          >
            Close
          </Button>
          <LoadingButton
            variant="contained"
            loading={isLoading}
            onClick={dispatchTask}
            color="secondary"
            loadingIndicator={<CircularProgress color="secondary" size={20} />}
          >
            <span>Submit</span>
          </LoadingButton>
        </DialogActions>
      </Dialog>

      <CustomSnackbar
        open={snackbarOpen}
        onClose={() => setSnackbarOpen(false)}
        message="Please fill all fields"
        severity="error"
      />
    </>
  );
};

TaskBar.propTypes = {
  waypoints: PropTypes.array.isRequired,
};

export default TaskBar;
