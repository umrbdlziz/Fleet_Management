import { useEffect, useContext, useState } from "react";
import { Grid, Paper, Typography } from "@mui/material";
import io from "socket.io-client";

import {
  MapContainer,
  ImageOverlay,
  Marker,
  Popup,
  Circle,
  Polyline,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-rotatedmarker";

import { ServerContext } from "../context";
import TaskBar from "../components/TaskBar";
import arrowIcon from "../assets/arrow.png";

const LiveMap = () => {
  const { SERVER_URL } = useContext(ServerContext);

  const [robotState, setRobotState] = useState([{}]);
  const [mapUrl, setMapUrl] = useState("");
  const [imgXY, setImgXY] = useState({ x: 0, y: 0 });
  const [bounds, setBounds] = useState([
    [0, 0],
    [0, 0],
  ]);
  const [waypoints, setWaypoints] = useState([]);
  const [edges, setEdges] = useState([]);

  useEffect(() => {
    const socket = io(SERVER_URL);
    socket.on("connect", () => {
      console.log(`Connected to server with id ${socket.id}`);
    });

    socket.on("tinyRobot_state", (data) => {
      setRobotState(data.robots);
    });

    socket.on("building_map", (data) => {
      setMapUrl(data.levels[0].images[0].data);
      setWaypoints(data.levels[0].nav_graphs[0].vertices);
      setEdges(data.levels[0].nav_graphs[0].edges);
    });

    return () => {
      socket.disconnect();
    };
  }, [SERVER_URL]);

  useEffect(() => {
    const img = new Image();
    img.src = mapUrl;
    img.onload = () => {
      setImgXY({ x: img.width, y: img.height });
      setBounds([
        [0, 0],
        [img.height, img.width],
      ]);
    };
  }, [mapUrl]);

  const myIcon = L.icon({
    iconUrl: arrowIcon,
    iconSize: [30, 30],
  });

  const scale = 0.008465494960546494; // Scale factor to adjust coordinates

  const robotMarkers = Object.values(robotState).map((robot) => {
    if (!robot.location) return null;
    const { x, y, yaw } = robot.location;
    const scaledX = x / scale;
    const scaledY = imgXY.y - y / -scale;

    const { name, status } = robot;

    return (
      <Marker
        key={`${name}-${yaw}`}
        position={[scaledY, scaledX]}
        icon={myIcon}
        rotationAngle={yaw * (180 / Math.PI) + 90} // rotate the marker
        rotationOrigin={"center center"} // rotate around the center
      >
        <Popup>
          <strong>{name}</strong>
          <br />
          Status: {status}
          <br />
          Battery: {robot.battery * 100}%
        </Popup>
      </Marker>
    );
  });

  const waypointMarkers = waypoints.map((waypoint, index) => {
    const scaledX = waypoint.x / scale;
    const scaledY = imgXY.y - waypoint.y / -scale;

    return (
      <Circle
        key={index}
        center={[scaledY, scaledX]}
        radius={40}
        fillColor="blue"
        fillOpacity={0.5}
        stroke={false}
      >
        <Popup>{waypoint.name || "Unnamed waypoint"}</Popup>
      </Circle>
    );
  });

  const edgeLines = edges.map((edge, index) => {
    const v1 = waypoints[edge.v1_idx];
    const v2 = waypoints[edge.v2_idx];

    const v1ScaledX = v1.x / scale;
    const v1ScaledY = imgXY.y - v1.y / -scale;
    const v2ScaledX = v2.x / scale;
    const v2ScaledY = imgXY.y - v2.y / -scale;

    return (
      <Polyline
        key={index}
        positions={[
          [v1ScaledY, v1ScaledX],
          [v2ScaledY, v2ScaledX],
        ]}
        color="green"
      >
        <Popup>{`Edge from ${edge.v1_idx} to ${edge.v2_idx}`}</Popup>
      </Polyline>
    );
  });

  return (
    <Grid container spacing={3} p={2}>
      <Grid item xs={12} md={9}>
        <Paper sx={{ padding: "10px" }}>
          <Typography variant="h4">Live Map</Typography>
          {robotState && (
            <MapContainer
              center={{ lat: 1000, lng: 1500 }}
              zoom={-2}
              minZoom={-5}
              style={{ height: "80vh", width: "100%" }}
              crs={L.CRS.Simple}
            >
              <ImageOverlay url={mapUrl} bounds={bounds} />
              {robotMarkers}
              {waypointMarkers}
              {edgeLines}
            </MapContainer>
          )}
        </Paper>
      </Grid>
      <Grid item xs={12} md={3}>
        <TaskBar />
      </Grid>
    </Grid>
  );
};

export default LiveMap;
