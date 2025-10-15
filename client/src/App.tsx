import React from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Home from "./components/page_templates/Home";
import Login from "./components/page_templates/Login";
import Verification from "./components/page_templates/Verification";
import AdministratorPanel from "./components/page_templates/AdministratorPanel";
import { AuthProvider } from "./context/AuthContext";
import { SidebarProvider } from "./context/SidebarContext";
import PrivateRoute from "./components/routes/PrivateRoute";

const APP_PREFIX = import.meta.env.VITE_APP_PREFIX;

function App() {
  return (
    <AuthProvider>
      <SidebarProvider>
        <BrowserRouter basename={APP_PREFIX}>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/verification" element={<Verification />} />

            {/* Protected routes */}
            <Route element={<PrivateRoute />}>
              <Route path="/admin/*" element={<AdministratorPanel />} />
            </Route>

            {/* Fallback route */}
            <Route path="*" element={<Navigate to="." replace />} />
          </Routes>
        </BrowserRouter>
      </SidebarProvider>
    </AuthProvider>
  );
}

export default App;
