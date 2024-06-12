import { BrowserRouter as Router, Route, Routes } from "react-router-dom";

import { Dashboard, Editor, Config, LiveMap } from "./pages";
import { TopBar } from "./utils";
import { ServerContext } from "./context";

const SERVER_URL = "http://192.168.1.48:5002";

function App() {
  return (
    <ServerContext.Provider value={{ SERVER_URL }}>
      <Router>
        <TopBar />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/editor" element={<Editor />} />
          <Route path="/config" element={<Config />} />
          <Route path="/live-map" element={<LiveMap />} />
        </Routes>
      </Router>
    </ServerContext.Provider>
  );
}

export default App;
