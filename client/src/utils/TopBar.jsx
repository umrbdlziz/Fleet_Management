import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import {
  AppBar,
  Toolbar,
  IconButton,
  Box,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import DashboardIcon from "@mui/icons-material/Dashboard";
import SettingsIcon from "@mui/icons-material/Settings";
import BorderColorIcon from "@mui/icons-material/BorderColor";
import MapIcon from "@mui/icons-material/Map";

import NanoIcon from "../assets/NanoIcon.png";
import NanoLogo from "../assets/CompanyLogo.png";

const CustomDrawer = ({ drawerOpen, toggleDrawer }) => {
  const navigate = useNavigate();
  const handleUserClick = (page) => {
    toggleDrawer(false);
    navigate(page);
  };

  return (
    <Drawer anchor="left" open={drawerOpen} onClose={toggleDrawer(false)}>
      <Box
        sx={{
          width: 220,
          marginTop: 4,
        }}
        role="presentation"
        onClick={toggleDrawer(false)}
      >
        <IconButton edge="end" onClick={() => navigate("/")}>
          <img src={NanoLogo} alt="NanoLogo" style={{ width: "150px" }} />
        </IconButton>
        <List>
          <ListItem button onClick={() => handleUserClick("/")}>
            <ListItemIcon>
              <DashboardIcon style={{ color: "#EFF1ED" }} />
            </ListItemIcon>
            <ListItemText primary="Dashboard" />
          </ListItem>
          <ListItem button onClick={() => handleUserClick("/editor")}>
            <ListItemIcon>
              <BorderColorIcon style={{ color: "#EFF1ED" }} />
            </ListItemIcon>
            <ListItemText primary="Editor" />
          </ListItem>
          <ListItem button onClick={() => handleUserClick("/config")}>
            <ListItemIcon>
              <SettingsIcon style={{ color: "#EFF1ED" }} />
            </ListItemIcon>
            <ListItemText primary="Config" />
          </ListItem>
          <ListItem button onClick={() => handleUserClick("/live-map")}>
            <ListItemIcon>
              <MapIcon style={{ color: "#EFF1ED" }} />
            </ListItemIcon>
            <ListItemText primary="Live Map" />
          </ListItem>
        </List>
        <Divider />

        <List>
          <ListItem>
            <ListItemText secondary={`Version: 1.0.0`} />
          </ListItem>
        </List>
      </Box>
    </Drawer>
  );
};

const TopBar = () => {
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const toggleDrawer = (open) => (event) => {
    if (
      event.type === "keydown" &&
      (event.key === "Tab" || event.key === "Shift")
    ) {
      return;
    }
    setDrawerOpen(open);
  };

  return (
    <>
      <AppBar
        position="static"
        sx={{
          backgroundColor: "transparent",
          boxShadow: "none",
        }}
      >
        <Toolbar
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <IconButton
            edge="start"
            color="inherit"
            aria-label="menu"
            sx={{ mr: 2 }}
            onClick={toggleDrawer(true)}
          >
            <MenuIcon />
          </IconButton>
          <IconButton edge="end" onClick={() => navigate("/")}>
            <img src={NanoIcon} alt="NanoIcon" style={{ width: "40px" }} />
          </IconButton>
        </Toolbar>
      </AppBar>
      <CustomDrawer drawerOpen={drawerOpen} toggleDrawer={toggleDrawer} />
    </>
  );
};

CustomDrawer.propTypes = {
  drawerOpen: PropTypes.bool.isRequired,
  toggleDrawer: PropTypes.func.isRequired,
};

export default TopBar;
