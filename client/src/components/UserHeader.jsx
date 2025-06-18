const UserHeader = ({ user, onShowAuth, onLogout, showAuth }) => {
    const handleLogout = async () => {
      const result = await onLogout();
      if (!result.success) {
        alert('Logout failed: ' + result.error);
      }
    };

    const handleClosePanel = () => {
      window.postMessage({ type: "CLOSE_PREGRADE_PANEL" }, "*");
    };
  
    return (
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center", 
        marginBottom: "1rem",
        padding: "10px 0",
        borderBottom: "1px solid #eee"
      }}>
        <h2 style={{ margin: 0, color: "#fff" }}>PreGrade</h2>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {user && (
            <>
              <div style={{ textAlign: "right", color: "#fff", fontSize: "14px", fontWeight: "bold", marginTop: "3px" }}>
                {user.displayName || 'User'}
              </div>
              <button 
                onClick={handleLogout}
                style={{ 
                  fontSize: "14px", 
                  padding: "6px 12px",
                  backgroundColor: "#0267ab",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer"
                }}
              >
                Logout
              </button>
            </>
          )}
          <button 
            onClick={handleClosePanel} 
            style={{ 
              backgroundColor: "#0267ab",
              color: "white", 
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