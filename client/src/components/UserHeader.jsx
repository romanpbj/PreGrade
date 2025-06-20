import { useState, useRef, useEffect } from "react";

const UserHeader = ({ user, onShowAuth, onLogout, showAuth }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef();

  const handleLogout = async () => {
    const result = await onLogout();
    if (!result.success) {
      alert('Logout failed: ' + result.error);
    }
  };

  const handleClosePanel = () => {
    window.postMessage({ type: "CLOSE_PREGRADE_PANEL" }, "*");
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div style={{ 
      display: "flex", 
      justifyContent: "space-between", 
      alignItems: "center", 
      marginBottom: "0.3rem",
      padding: "10px 0",
      borderBottom: "1px solid #eee",
      position: "relative"
    }}>
      <h2 style={{ margin: 0, color: "#007cba" }}>PreGrade</h2>

      <div style={{ display: "flex", alignItems: "center", gap: "10px", position: "relative" }} ref={dropdownRef}>
        {user && (
          <div style={{ position: "relative" }}>
            <div
              onClick={() => setDropdownOpen(prev => !prev)}
              style={{
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: 500,
                color: "#000",
                padding: "6px 10px",
                borderRadius: "6px",
                backgroundColor: "#fff"
              }}
            >
              {user.displayName || 'User'}
            </div>
            {dropdownOpen && (
              <div style={{
                position: "absolute",
                right: 0,
                top: "110%",
                backgroundColor: "#fff",
                border: "1px solid #ccc",
                borderRadius: "6px",
                boxShadow: "0 4px 8px rgba(0,0,0,0.08)",
                padding: "6px 0",
                zIndex: 10,
                minWidth: "120px"
              }}>
                <div
                  onClick={handleLogout}
                  style={{
                    padding: "8px 12px",
                    cursor: "pointer",
                    fontSize: "14px",
                    color: "#000",
                    whiteSpace: "nowrap",
                    transition: "background 0.2s",
                  }}
                  onMouseEnter={e => e.target.style.backgroundColor = "#f0f0f0"}
                  onMouseLeave={e => e.target.style.backgroundColor = "transparent"}
                >
                  Logout
                </div>
              </div>
            )}
          </div>
        )}
        <button 
          onClick={handleClosePanel} 
          style={{ 
            backgroundColor: "#fff",
            color: "#000", 
            border: "none", 
            borderRadius: "4px",
            fontSize: "14px",
            padding: "6px 10px", 
            cursor: "pointer" 
          }}
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export default UserHeader;