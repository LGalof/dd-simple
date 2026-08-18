import { Suspense, lazy } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "./components/routing/ProtectedRoute";
import { AuthProvider } from "./features/auth/AuthContext";

const AuthPage = lazy(() =>
  import("./pages/AuthPage").then((module) => ({ default: module.AuthPage })),
);
const CharacterDashboardPage = lazy(() =>
  import("./pages/CharacterDashboardPage").then((module) => ({
    default: module.CharacterDashboardPage,
  })),
);
const CreateCharacterPage = lazy(() =>
  import("./pages/CreateCharacterPage").then((module) => ({
    default: module.CreateCharacterPage,
  })),
);
const MyCharactersPage = lazy(() =>
  import("./pages/MyCharactersPage").then((module) => ({
    default: module.MyCharactersPage,
  })),
);
const TacticalBoardPage = lazy(() =>
  import("./pages/TacticalBoardPage").then((module) => ({
    default: module.TacticalBoardPage,
  })),
);
const CreateRoomPage = lazy(() =>
  import("./pages/CreateRoomPage").then((module) => ({
    default: module.CreateRoomPage,
  })),
);
const JoinRoomPage = lazy(() =>
  import("./pages/JoinRoomPage").then((module) => ({
    default: module.JoinRoomPage,
  })),
);
const MyRoomsPage = lazy(() =>
  import("./pages/MyRoomsPage").then((module) => ({
    default: module.MyRoomsPage,
  })),
);

function RouteFallback() {
  return <div className="page-shell">Loading...</div>;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/login" element={<AuthPage mode="login" />} />
            <Route path="/register" element={<AuthPage mode="register" />} />
            <Route path="/prijava" element={<Navigate to="/login" replace />} />
            <Route path="/registracija" element={<Navigate to="/register" replace />} />
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
              path="/rooms"
              element={
                <ProtectedRoute>
                  <MyRoomsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/rooms/create"
              element={
                <ProtectedRoute>
                  <CreateRoomPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/rooms/join"
              element={
                <ProtectedRoute>
                  <JoinRoomPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/room/:roomCode/character"
              element={
                <ProtectedRoute>
                  <CharacterDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/room/:roomCode"
              element={
                <ProtectedRoute>
                  <TacticalBoardPage roomMode />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/register" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
