// src/components/FleetConfigDialog.jsx
import { useState } from "react";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Button,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
} from "@mui/material";
import PropTypes from "prop-types";

const FleetConfigDialog = ({ open, handleClose, handleCreateConfig }) => {
  const [fileName, setFileName] = useState("config.yaml");
  const [fleetName, setFleetName] = useState("nanoBot");
  const [ip, setIp] = useState("");
  const [port, setPort] = useState("");
  const [finishingRequest, setFinishingRequest] = useState("nothing");

  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogTitle>Fleet Configuration</DialogTitle>
      <DialogContent>
        <TextField
          margin="dense"
          label="File Name"
          type="text"
          fullWidth
          variant="outlined"
          value={fileName}
          onChange={(e) => setFileName(e.target.value)}
        />
        <TextField
          margin="dense"
          label="Fleet Name"
          type="text"
          fullWidth
          variant="outlined"
          value={fleetName}
          onChange={(e) => setFleetName(e.target.value)}
        />
        <TextField
          margin="dense"
          label="IP"
          type="text"
          fullWidth
          variant="outlined"
          value={ip}
          onChange={(e) => setIp(e.target.value)}
        />
        <TextField
          margin="dense"
          label="Port"
          type="number"
          fullWidth
          variant="outlined"
          value={port}
          onChange={(e) => setPort(e.target.value)}
        />
        <FormControl fullWidth margin="dense" variant="outlined">
          <InputLabel>Finishing Request</InputLabel>
          <Select
            value={finishingRequest}
            onChange={(e) => setFinishingRequest(e.target.value)}
            label="Finishing Request"
          >
            <MenuItem value="park">Park</MenuItem>
            <MenuItem value="charge">Charge</MenuItem>
            <MenuItem value="nothing">Nothing</MenuItem>
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="secondary">
          Cancel
        </Button>
        <Button
          onClick={() =>
            handleCreateConfig(fileName, fleetName, ip, port, finishingRequest)
          }
          color="secondary"
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

FleetConfigDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  handleClose: PropTypes.func.isRequired,
  handleCreateConfig: PropTypes.func.isRequired,
};

export default FleetConfigDialog;
