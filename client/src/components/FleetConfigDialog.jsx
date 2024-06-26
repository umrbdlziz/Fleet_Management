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
  Chip,
  Stack,
} from "@mui/material";
import PropTypes from "prop-types";

const FleetConfigDialog = ({ open, handleClose, handleCreateConfig }) => {
  const [fileName, setFileName] = useState("config.yaml");
  const [fleetName, setFleetName] = useState("NanoBot");
  const [ip, setIp] = useState("http://192.168.1.90:5000");
  const [finishingRequest, setFinishingRequest] = useState("nothing");
  const [actionCategories, setActionCategories] = useState([
    "amr_jack",
    "pgv_dock",
  ]);
  const [actionCategory, setActionCategory] = useState("");

  const handleAddCategory = () => {
    if (actionCategory && !actionCategories.includes(actionCategory)) {
      setActionCategories([...actionCategories, actionCategory]);
      setActionCategory(""); // Clear the input field after adding
    }
  };

  const handleDeleteCategory = (categoryToDelete) => {
    setActionCategories(
      actionCategories.filter((category) => category !== categoryToDelete)
    );
  };

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
        <TextField
          margin="dense"
          label="Action Category"
          type="text"
          fullWidth
          variant="outlined"
          value={actionCategory}
          onChange={(e) => setActionCategory(e.target.value)}
        />
        <Button
          onClick={handleAddCategory}
          color="info"
          style={{ marginTop: "10px" }}
        >
          Add Category
        </Button>
        {actionCategories.length > 0 && (
          <Stack direction="row" spacing={1} style={{ marginTop: "10px" }}>
            {actionCategories.map((category, index) => (
              <Chip
                key={index}
                label={category}
                onDelete={() => handleDeleteCategory(category)}
              />
            ))}
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="secondary">
          Cancel
        </Button>
        <Button
          onClick={() =>
            handleCreateConfig(
              fileName,
              fleetName,
              ip,
              finishingRequest,
              actionCategories
            )
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
