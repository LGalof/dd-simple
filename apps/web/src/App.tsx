import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "./components/routing/ProtectedRoute";
import { AuthProvider } from "./features/auth/AuthContext";
import { AuthPage } from "./pages/AuthPage";
import { CharacterDashboardPage } from "./pages/CharacterDashboardPage";
import { CreateCharacterPage } from "./pages/CreateCharacterPage";
import { InventorySandboxPage } from "./pages/InventorySandboxPage";
import { MyCharactersPage } from "./pages/MyCharactersPage";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/prijava" element={<AuthPage mode="login" />} />
          <Route path="/registracija" element={<AuthPage mode="register" />} />
          <Route path="/login" element={<Navigate to="/prijava" replace />} />
          <Route path="/register" element={<Navigate to="/registracija" replace />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <CharacterDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/characters"
            element={
              <ProtectedRoute>
                <MyCharactersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/characters/new"
            element={
              <ProtectedRoute>
                <CreateCharacterPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/inventory"
            element={
              <ProtectedRoute>
                <InventorySandboxPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
