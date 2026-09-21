import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";

import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import TodosPage from "./pages/TodosPage";
import About from "./pages/About";
import Services from "./pages/Services";
import AuthPage from "./pages/AuthPage";

function App() {
  const [user, setUser] = useState(null);

  // ✅ Check if user is logged in
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  return (
    <Router>
      {/* ✅ Show Navbar only if user logged in */}
      {user && <Navbar />}

      <div className={user ? "pt-16" : ""}>
        <Routes>

          {/* 🔐 Auth Route */}
          <Route
            path="/auth"
            element={!user ? <AuthPage /> : <Navigate to="/" />}
          />

          {/* 🔒 Protected Routes */}
          <Route
            path="/"
            element={user ? <Home /> : <Navigate to="/auth" />}
          />

          <Route
            path="/todopage"
            element={user ? <TodosPage /> : <Navigate to="/auth" />}
          />

          <Route
            path="/about"
            element={user ? <About /> : <Navigate to="/auth" />}
          />

          <Route
            path="/services"
            element={user ? <Services /> : <Navigate to="/auth" />}
          />

        </Routes>
      </div>
    </Router>
  );
}

export default App;