import { useContext, useEffect, useState, useRef } from "react";
import { Box, Button, Typography, TextField } from "@mui/material";
import LoadingButton from "@mui/lab/LoadingButton";
import CircularProgress from "@mui/material/CircularProgress";
import io from "socket.io-client";
import axios from "axios";

import { ServerContext } from "../context";
import { CustomSnackbar } from "../utils";

const Editor = () => {
  const { SERVER_URL } = useContext(ServerContext);
  const fileInputRef = useRef(null);

  const [isLoading, setIsLoading] = useState(false);
  const [tfLoading, setTfLoading] = useState(false);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState({
    message: "",
    severity: "",
  });
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("");

  useEffect(() => {
    const socket = io(SERVER_URL);

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
    setIsLoading(true);
    try {
      await axios.post(`${SERVER_URL}/colcon_build`, {
        params: "rmf_draft",
      });
    } catch (error) {
      console.error("Error building rmf draft: ", error);
    }
  };
  const handleFileSelect = async () => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post(`${SERVER_URL}/upload_map`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      setOpenSnackbar(true);
      setSnackbarMessage({
        message: response.data.message,
        severity: "success",
      });
    } catch (error) {
      console.error("Error uploading map: ", error.message);
    }
  };

  return (
    <>
      <Box p={2} display="flex" justifyContent="space-between">
        <Box display="flex" gap={1}>
          <input
            style={{ display: "none" }} // Hide the input
            ref={fileInputRef}
            accept=".png"
            id="file-input"
            type="file"
            onChange={(event) => {
              setFile(event.target.files[0]);
              setFileName(event.target.files[0].name); // Assuming setFileName updates the state for the file name
            }}
          />
          <TextField size="small" color="secondary" value={fileName} readOnly />
          <Button
            variant="outlined"
            color="secondary"
            onClick={() => fileInputRef.current.click()} // Trigger file input click
          >
            Upload PNG File
          </Button>
          <Button
            variant="contained"
            color="secondary"
            onClick={handleFileSelect}
          >
            Add PNG File
          </Button>
        </Box>
        <LoadingButton
          variant="contained"
          loading={isLoading}
          onClick={buildMap}
          color="secondary"
          loadingIndicator={<CircularProgress color="secondary" size={20} />}
        >
          <span>Build</span>
        </LoadingButton>
      </Box>
      <Box
        component="form"
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          justifyContent: "center",
          alignItems: "center",
          height: "80vh",
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
        <Typography variant="caption">
          note: the file name need to be msf.building.yaml
        </Typography>
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
