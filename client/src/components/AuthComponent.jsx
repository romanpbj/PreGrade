import { useState } from 'react';
import { signIn, signUp } from '../firebase/auth.js';
import { createUserProfile } from '../firebase/database.js';
import GoogleSignInButton from './GoogleSignInButton';


const AuthComponent = ({ onAuthSuccess, onCancel }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authData, setAuthData] = useState({
    email: '',
    password: '',
    displayName: ''
  });
  const [error, setError] = useState('');

  const googleAuthSuccess = (user) => {
    onAuthSuccess(user)
  }

  const handleAuth = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      let result;
      if (isSignUp) {
        result = await signUp(authData.email, authData.password, authData.displayName);
        if (result.success) {
          await createUserProfile(result.user.uid, {
            email: result.user.email,
            displayName: authData.displayName,
            courses: []
          });
        }
      } else {
        result = await signIn(authData.email, authData.password);
      }

      if (result.success) {
        setAuthData({ email: '', password: '', displayName: '' });
        onAuthSuccess(result.user);
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError('Authentication error: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setAuthData({ ...authData, [field]: value });
    if (error) setError(''); // Clear error when user starts typing
  };

  return (
    <div style={{
      marginBottom: "1rem",
      padding: "1rem 1.5rem",
      border: "2px solid #007cba",
      borderRadius: "5px",
      backgroundColor: "#f9f9f9"
    }}>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "15px"
      }}>
        <h3 style={{ margin: 0 }}>{isSignUp ? 'Create Account' : 'Sign In'}</h3>
        <button
          type="button"
          onClick={onCancel}
          style={{
            background: "none",
            border: "none",
            fontSize: "18px",
            cursor: "pointer",
            color: "#666"
          }}
        >
          ×
        </button>
      </div>

      {/* CENTERED FORM CONTAINER */}
        <div style={{ 
          maxWidth: "360px", 
          margin: "0 auto", 
          marginLeft: "-12px",
          paddingLeft: "12px", 
          paddingRight: "12px", 
          boxSizing: "border-box" 
        }}>
        <form onSubmit={handleAuth}>
          {isSignUp && (
            <div style={{ marginBottom: "10px" }}>
              <input
                type="text"
                placeholder="Full Name"
                value={authData.displayName}
                onChange={(e) => handleInputChange('displayName', e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  fontSize: "14px"
                }}
                required
              />
            </div>
          )}

          <div style={{ marginBottom: "10px" }}>
            <input
              type="email"
              placeholder="Email"
              value={authData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              style={{
                width: "100%",
                padding: "10px",
                border: "1px solid #ddd",
                borderRadius: "4px",
                fontSize: "14px"
              }}
              required
            />
          </div>

          <div style={{ marginBottom: "15px" }}>
            <input
              type="password"
              placeholder="Password (min 6 characters)"
              value={authData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              style={{
                width: "100%",
                padding: "10px",
                border: "1px solid #ddd",
                borderRadius: "4px",
                fontSize: "14px"
              }}
              minLength="6"
              required
            />
          </div>

          {error && (
            <div style={{
              color: "#d32f2f",
              fontSize: "12px",
              marginBottom: "15px",
              padding: "8px",
              backgroundColor: "#ffebee",
              borderRadius: "4px"
            }}>
              {error}
            </div>
          )}

          <div style={{ display: "flex", gap: "10px", flexDirection: "column" }}>
            <button
              type="submit"
              disabled={isLoading}
              style={{
                padding: "12px",
                backgroundColor: isLoading ? "#ccc" : "#007cba",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: isLoading ? "not-allowed" : "pointer",
                fontSize: "14px",
                fontWeight: "bold"
              }}
            >
              {isLoading ? "Processing..." : (isSignUp ? "Create Account" : "Sign In")}
            </button>

            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              style={{
                padding: "8px",
                backgroundColor: "transparent",
                color: "#007cba",
                border: "1px solid #007cba",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "12px"
              }}
            >
              {isSignUp ? "Already have an account? Sign In" : "Need an account? Sign Up"}
            </button>
          </div>


        </form>
        
      </div>
      <div
  style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: '20px',
  }}
>
  <GoogleSignInButton />
</div>
      <div style={{ marginTop: "15px", textAlign: "center" }}>
        <GoogleSignInButton googleSuccess = {googleAuthSuccess}/>
      </div>
    </div>
  );
};

export default AuthComponent;