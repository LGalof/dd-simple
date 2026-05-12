import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { CharacterDashboardPage } from "./pages/CharacterDashboardPage";
import { MyCharactersPage } from "./pages/MyCharactersPage";
import { CreateCharacterPage } from "./pages/CreateCharacterPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<CharacterDashboardPage />} />
        <Route path="/characters" element={<MyCharactersPage />} />
        <Route path="/characters/new" element={<CreateCharacterPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
