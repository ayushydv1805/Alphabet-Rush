import { BrowserRouter, Route, Routes } from "react-router-dom";
import SoundToggle from "../components/common/SoundToggle";
import ThemeToggle from "../components/common/ThemeToggle";
import CreateRoom from "../pages/CreateRoom";
import Game from "../pages/Game";
import Home from "../pages/Home";
import JoinRoom from "../pages/JoinRoom";
import Leaderboard from "../pages/Leaderboard";
import NotFound from "../pages/NotFound";
import RoundResult from "../pages/RoundResult";
import WaitingRoom from "../pages/WaitingRoom";

function App() {
  return (
    <BrowserRouter>
      <SoundToggle />
      <ThemeToggle />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/create-room" element={<CreateRoom />} />
        <Route path="/join-room" element={<JoinRoom />} />
        <Route path="/waiting-room" element={<WaitingRoom />} />
        <Route path="/game" element={<Game />} />
        <Route path="/round-result" element={<RoundResult />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
