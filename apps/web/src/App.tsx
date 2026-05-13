import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { CharacterDashboardPage } from "./pages/CharacterDashboardPage";
import { MyCharactersPage } from "./pages/MyCharactersPage";
import { CreateCharacterPage } from "./pages/CreateCharacterPage";
import { EditCharacterPage } from "./pages/EditCharacterPage";
import { getSelectedCharacterId } from "./features/characters/utils/selectedCharacter";

function HomeRedirect() {
  const selectedCharacterId = getSelectedCharacterId();

  if (selectedCharacterId) {
    return <Navigate to={`/characters/${selectedCharacterId}`} replace />;
  }

  return <Navigate to="/characters" replace />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomeRedirect />} />
        <Route path="/characters" element={<MyCharactersPage />} />
        <Route path="/characters/new" element={<CreateCharacterPage />} />
        <Route path="/characters/:characterId" element={<CharacterDashboardPage />} />
        <Route path="/characters/:characterId/edit" element={<EditCharacterPage />} />
        <Route path="*" element={<Navigate to="/characters" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
