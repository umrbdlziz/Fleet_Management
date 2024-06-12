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
  Select,
  MenuItem,
} from "@mui/material";
import LoadingButton from "@mui/lab/LoadingButton";
import PlaylistAddIcon from "@mui/icons-material/PlaylistAdd";
import CircularProgress from "@mui/material/CircularProgress";
import io from "socket.io-client";
import axios from "axios";

import { ServerContext } from "../context";
import { CustomSnackbar } from "../utils";

const TaskBar = () => {
  const { SERVER_URL } = useContext(ServerContext);
  const [tasks, setTasks] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [taskType, setTaskType] = useState("");
  const [destination, setDestination] = useState("");
  const [tempTasks, setTempTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // state for snackbar
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  useEffect(() => {
    const socket = io(SERVER_URL);
    socket.on("connect", () => {
      console.log(`Connected to server with id ${socket.id}`);
    });

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
          color="secondary"
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
            <Typography variant="body1">No tasks available</Typography>
          )}
        </Box>
      </Paper>

      {/**Dialog to add new tasks */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Create Task</DialogTitle>
        <DialogContent>
          <Select
            autoFocus
            margin="dense"
            id="name"
            label="Task Type"
            fullWidth
            onChange={(e) => setTaskType(e.target.value)}
            value={taskType}
          >
            <MenuItem value={"patrol"}>Patrol</MenuItem>
          </Select>
          <TextField
            autoFocus
            margin="dense"
            id="name"
            label="Place Name"
            type="text"
            fullWidth
            onChange={(e) => setDestination(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button color="secondary" onClick={() => setOpenDialog(false)}>
            Close
          </Button>
          <LoadingButton
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

export default TaskBar;
