import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";
import socket from "./socket";
import Home from "./pages/Home";
import CreateRoom from "./pages/CreateRoom";
import JoinRoom from "./pages/JoinRoom";
import WaitingRoom from "./pages/WaitingRoom";
import Game from "./pages/Game";
import RoundResult from "./pages/RoundResult";
import Leaderboard from "./pages/Leaderboard";
function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route path="/" element={<Home />} />

        <Route path="/create-room" element={<CreateRoom />} />

        <Route path="/join-room" element={<JoinRoom />} />
<Route path="/game" element={<Game />} />
<Route path="/round-result" element={<RoundResult />} />
<Route path="/waiting-room" element={<WaitingRoom />} />
<Route path="/leaderboard" element={<Leaderboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;