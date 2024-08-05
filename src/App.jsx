import { useState } from "react";
import { useLocation, Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import "./App.css";
import Main from "./pages/Main";
import SignUp from "./pages/SignUp";
import Login from "./components/Login";

function App() {
  const location = useLocation();
  const hideHeaderPaths = ["/signup"];
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const openLogin = () => setIsLoginOpen(true);
  const closeLogin = () => setIsLoginOpen(false);
  return (
    <div>
      {!hideHeaderPaths.includes(location.pathname) && (
        <Header openLogin={openLogin} />
      )}
      <Login isOpen={isLoginOpen} onClose={closeLogin} />
      <Routes>
        <Route path="signup" element={<SignUp />} />
        <Route path="/" element={<Main />} />
      </Routes>
    </div>
  );
}

export default App;