import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";

const APP_PREFIX = import.meta.env.VITE_APP_PREFIX || "";
const INSTANCE_NAME = import.meta.env.VITE_INSTANCE_NAME || "IT-LAB-UAI";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showNavbar, setShowNavbar] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, logout, adminName } = useAuth();

  const handleMore = () => {};
  const handleMenuToggle = () => setMenuOpen((prev) => !prev);
  const handleLogout = () => {
    logout();
    // No need to navigate as PrivateRoute will handle redirection
  };

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 50) {
        setShowNavbar(false);
      } else {
        setShowNavbar(true);
      }
      setLastScrollY(currentScrollY);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  return (
    <nav
      className={`w-full fixed top-0 left-0 z-30 transition-transform duration-1000 ${
        showNavbar ? "translate-y-0" : "-translate-y-full"
      }`}
      style={{
        background: "linear-gradient(90deg, #1e1b4b 0%, #312e81 100%)",
      }}
    >
      <div className="flex items-center justify-between px-6 py-4">
        {/* Left: Logo */}
        <div className="flex items-center gap-4">
          <a href="/lab/" className="font-bold text-2xl text-white">
            <img
              src={`/lab/CA_logo_trans.png`}
              alt="LAB Control Logo"
              className="h-16 w-auto filter invert brightness-0"
            />
          </a>
          <a
            onClick={() => {
              navigate("/");
              setMenuOpen(false);
            }}
            className="text-white hover:text-blue-200 font-medium cursor-pointer text-xl"
          >
            {INSTANCE_NAME}
          </a>
        </div>
        {/* Hamburger for mobile */}
        <div className="lg:hidden flex items-center">
          <button
            onClick={handleMenuToggle}
            className="text-white focus:outline-none"
            aria-label="Toggle menu"
          >
            <svg
              className="w-7 h-7"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d={
                  menuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"
                }
              />
            </svg>
          </button>
        </div>
        {/* Center: Navigation Links */}
        <div
          className={`flex-col lg:flex-row lg:flex items-center space-y-4 lg:space-y-0 lg:space-x-8 absolute lg:static top-full left-0 w-full lg:w-auto bg-transparent lg:bg-none px-6 lg:px-0 py-4 lg:py-0 transition-all duration-300 ${
            menuOpen ? "flex" : "hidden lg:flex"
          }`}
        >
          <a
            onClick={() => {
              navigate("/verification");
              setMenuOpen(false);
            }}
            className="text-white hover:text-blue-200 font-medium cursor-pointer"
          >
            Verification
          </a>
        </div>
        {/* Right: Login/Logout */}
        <div className="hidden lg:flex items-center space-x-4">
          {isAuthenticated ? (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen((prev) => !prev)}
                className="flex items-center text-white hover:text-blue-200 font-medium focus:outline-none"
              >
                {adminName}
                <svg
                  className="ml-1 w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                  <Link
                    to="/admin"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setDropdownOpen(false)}
                  >
                    Administrator Panel
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      setDropdownOpen(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Log Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/login"
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Login
            </Link>
          )}
        </div>
      </div>
      {/* Mobile Menu */}
      {menuOpen && (
        <div className="lg:hidden bg-transparent px-6 pt-2 pb-4 space-y-3">
          <a
            href="/"
            className="block text-white hover:text-blue-200 font-medium"
          >
            Home Page
          </a>
          <a
            href="/verification"
            className="block text-white hover:text-blue-200 font-medium"
          >
            Verification
          </a>
          <a
            href="/about"
            className="block text-white hover:text-blue-200 font-medium"
          >
            About Us
          </a>
          <a
            href="#"
            className="block text-white hover:text-blue-200 font-medium"
          >
            Contact Us
          </a>
          <a
            href="#"
            className="block text-white hover:text-blue-200 font-medium"
          >
            More Links
          </a>
          {isAuthenticated ? (
            <>
              <Link
                to="/administrator-panel"
                className="block text-white hover:text-blue-200 font-medium"
                onClick={() => setMenuOpen(false)}
              >
                {adminName}
              </Link>
              <button
                onClick={handleLogout}
                className="w-full text-left bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
              >
                Log Out
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="block bg-blue-500 text-white text-center px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Login
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
