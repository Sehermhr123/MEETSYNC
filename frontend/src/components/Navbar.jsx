import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Home, Info, Briefcase, ListCheck, LogOut } from "lucide-react";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const navItems = [
    { name: "Home", path: "/", icon: <Home size={20} /> },
    { name: "About", path: "/about", icon: <Info size={20} /> },
    { name: "Services", path: "/services", icon: <Briefcase size={20} /> },
    { name: "All Todos", path: "/todopage", icon: <ListCheck size={20} /> },
  ];

  // ✅ Logout function
  const handleLogout = () => {
    localStorage.removeItem("user");
    window.location.href = "/auth";
  };

  return (
    <nav className="fixed w-full top-0 z-50 bg-gradient-to-r from-blue-600 to-purple-500 bg-opacity-80 backdrop-blur-lg text-white shadow-lg">
      <div className="container mx-auto flex justify-between items-center px-6 py-3">
        
        {/* Logo */}
        <Link to="/" className="text-2xl font-extrabold tracking-wide text-white drop-shadow-md">
          MeetSync
        </Link>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden focus:outline-none text-white hover:text-gray-300 transition-all"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X size={28} /> : <Menu size={28} />}
        </button>

        {/* Navigation Menu */}
        <ul
          className={`absolute md:static top-16 left-0 w-full md:w-auto bg-white/10 md:bg-transparent shadow-md md:shadow-none md:flex md:space-x-6 backdrop-blur-md 
          transition-all duration-300 ease-in-out transform rounded-lg md:rounded-none border border-white/20 
          ${isOpen ? "scale-y-100" : "scale-y-0 md:scale-y-100"} origin-top`}
        >
          {navItems.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                onClick={() => setIsOpen(false)} // ✅ close menu on click
                className={`flex items-center space-x-2 p-4 md:p-2 rounded-lg md:rounded-none transition-all duration-200 font-medium text-white 
                ${
                  location.pathname === item.path
                    ? "bg-white/20 shadow-md shadow-blue-500/50"
                    : "hover:bg-white/10 hover:text-gray-200"
                }`}
              >
                {item.icon}
                <span>{item.name}</span>
              </Link>
            </li>
          ))}

          {/* 👤 User Info */}
          {user && (
            <li className="flex items-center px-4 md:px-2">
              <span className="text-sm font-semibold">
                👋 {user.name}
              </span>
            </li>
          )}

          {/* 🚪 Logout Button */}
          <li>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 p-4 md:p-2 text-red-200 hover:text-red-400 transition"
            >
              <LogOut size={20} />
              <span>Logout</span>
            </button>
          </li>
        </ul>
      </div>
    </nav>
  );
}