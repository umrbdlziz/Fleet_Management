import { CircularProgress, Box, Typography } from "@mui/material";
import PropTypes from "prop-types";

const LoadingSpinner = ({ text, size = 80 }) => {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
      }}
    >
      <CircularProgress size={size} color="secondary" />
      <Box sx={{ width: 500, margin: "10px" }}>
        <Typography variant="h6">{text}</Typography>
      </Box>
    </Box>
  );
};

LoadingSpinner.propTypes = {
  text: PropTypes.string,
  size: PropTypes.number,
};

export default LoadingSpinner;
