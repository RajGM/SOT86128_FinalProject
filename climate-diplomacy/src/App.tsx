import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AudioUnlockOverlay } from "./components/audio/AudioUnlockOverlay";
import { LandingPage } from "./pages/LandingPage";
import { LobbyPage } from "./pages/LobbyPage";
import { GamePage } from "./pages/GamePage";
import { TestPage } from "./pages/TestPage";

function App() {
  return (
    <BrowserRouter>
      <AudioUnlockOverlay />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/lobby/:roomId" element={<LobbyPage />} />
        <Route path="/game/:roomId" element={<GamePage />} />
        <Route path="/test" element={<TestPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
