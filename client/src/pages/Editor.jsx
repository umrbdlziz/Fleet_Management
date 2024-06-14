import { useContext, useEffect, useState } from "react";
import { Box } from "@mui/material";
import LoadingButton from "@mui/lab/LoadingButton";
import CircularProgress from "@mui/material/CircularProgress";
import io from "socket.io-client";
import axios from "axios";

import { ServerContext } from "../context";
import { CustomSnackbar } from "../utils";

const Editor = () => {
  const { SERVER_URL } = useContext(ServerContext);
  const [isLoading, setIsLoading] = useState(false);
  const [tfLoading, setTfLoading] = useState(false);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState({
    message: "",
    severity: "",
  });

  useEffect(() => {
    const socket = io(SERVER_URL);

    // use for troubleshooting connection
    // socket.on("connect", () => {
    //   console.log(`Connected to server with id ${socket.id}`);
    // });

    socket.on("colconBuildComplete", (data) => {
      if (data.code == 0) {
        setIsLoading(false);
        setOpenSnackbar(true);
        setSnackbarMessage({
          message: "Build complete",
          severity: "success",
        });
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [SERVER_URL]);

  const openEditor = async () => {
    setTfLoading(true);
    try {
      const response = await axios.post(`${SERVER_URL}/run-traffic-editor`);
      console.log(response.data);
    } catch (error) {
      console.error("Error starting Traffic Editor:", error);
    } finally {
      setTfLoading(false);
    }
  };
  const buildMap = async () => {
    try {
      const response = await axios.post(`${SERVER_URL}/restart_ros`);
      console.log(response.data);
      setIsLoading(true);
    } catch (error) {
      console.error("Error restarting ROS: ", error);
    }
  };

  return (
    <>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          justifyContent: "center",
          alignItems: "center",
          height: "90vh",
        }}
      >
        <LoadingButton
          loading={tfLoading}
          variant="contained"
          color="info"
          onClick={openEditor}
        >
          Start Traffic Editor
        </LoadingButton>
        <LoadingButton
          variant="contained"
          loading={isLoading}
          onClick={buildMap}
          color="info"
          loadingIndicator={<CircularProgress color="info" size={20} />}
        >
          <span>Build</span>
        </LoadingButton>
      </Box>

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

export default Editor;
