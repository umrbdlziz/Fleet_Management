import { Snackbar, Alert } from "@mui/material";
import PropTypes from "prop-types";

const CustomSnackbar = ({ open, onClose, message, severity }) => {
  return (
    <Snackbar
      open={open}
      autoHideDuration={5000}
      onClose={onClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
    >
      <Alert onClose={onClose} severity={severity} sx={{ width: "100%" }}>
        {message}
      </Alert>
    </Snackbar>
  );
};

CustomSnackbar.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  message: PropTypes.string,
  severity: PropTypes.string,
};

export default CustomSnackbar;
