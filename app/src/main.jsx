import { PendingChangesProvider } from "./context/PendingChangesContext";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./styles/tokens.css";
import App from "./App.jsx";
import { AuthProvider } from "./auth/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";

// Data router permite bloquear navegação e o botão Voltar com edição pendente.
const router = createBrowserRouter([
  {
    path: "*",
    element: (
      <ThemeProvider>
        <AuthProvider>
          <PendingChangesProvider>
            <App />
          </PendingChangesProvider>
        </AuthProvider>
      </ThemeProvider>
    ),
  },
]);

createRoot(document.getElementById("root")).render(
  <StrictMode><RouterProvider router={router} /></StrictMode>
);
