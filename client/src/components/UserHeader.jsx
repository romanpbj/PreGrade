const UserHeader = ({ user, onShowAuth, onLogout, showAuth }) => {
    const handleLogout = async () => {
      const result = await onLogout();
      if (result.success) {
        alert('Logged out successfully!');
      } else {
        alert('Logout failed: ' + result.error);
      }
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
        
        {user ? (
          <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "14px", fontWeight: "bold", color: "#fff" }}>
                {user.displayName || 'User'}
              </div>
              <div style={{ fontSize: "12px", color: "#fff" }}>
                {user.email}
              </div>
            </div>
            <button 
              onClick={handleLogout}
              style={{ 
                fontSize: "12px", 
                padding: "6px 12px",
                backgroundColor: "#d32f2f",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer"
              }}
            >
              Logout
            </button>
          </div>
        ) : (
          <button 
            onClick={onShowAuth}
            style={{ 
              fontSize: "14px", 
              padding: "8px 16px",
              backgroundColor: "#007cba",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer"
            }}
          >
            {showAuth ? 'Cancel' : 'Sign In'}
          </button>
        )}
      </div>
    );
  };
  
  export default UserHeader;