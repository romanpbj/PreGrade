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
    onAuthSuccess(user);
  };

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
    if (error) setError('');
  };

  return (
    <div style={{
      marginBottom: "1rem",
      padding: "1rem 1.5rem",
      border: "2px solid #007cba",
      borderRadius: "15px",
      backgroundColor: "#f9f9f9",
      maxWidth: "400px",
      margin: "0 auto"
    }}>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "15px"
      }}>
        <div style={{ textAlign: "center", marginBottom: "10px", marginTop: "10px" }}>
          <h2 style={{ margin: 0, fontSize: "24px", fontWeight: "600" }}>
            Get Started With Your
          </h2>
          <h2 style={{ margin: 0, fontSize: "24px", fontWeight: "700" }}>
            AI-Powered Grade Assistant
          </h2>
          <p style={{ fontSize: "14px", color: "#555", marginTop: "10px" }}>
            Get fast, personalized feedback on assignments using AI.
          </p>
        </div>
      </div>

      <div style={{ marginBottom: "10px", display: "flex", justifyContent: "center" }}>
        {isSignUp ? <GoogleSignInButton googleString={"Create Account with Google"}googleSuccess={googleAuthSuccess} /> : <GoogleSignInButton googleString={"Sign in with Google"} googleSuccess={googleAuthSuccess} />}
      </div>
      <div style={{
          display: "flex",
          alignItems: "center",
          margin: "20px 0"
        }}>
          <hr style={{ flex: 1, border: "none", borderTop: "1px solid #ccc" }} />
          <span style={{ margin: "0 10px", color: "#888", fontSize: "14px" }}>or</span>
          <hr style={{ flex: 1, border: "none", borderTop: "1px solid #ccc" }} />
      </div>

      <form
          onSubmit={handleAuth}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            width: "100%",
            boxSizing: "border-box",
          }}
        >
        {isSignUp && (
          <input
            type="text"
            placeholder="Username"
            value={authData.displayName}
            onChange={(e) => handleInputChange('displayName', e.target.value)}
            style={{
              maxWidth: "345px",
              margin: "0 auto",
              width: "100%",
              padding: "10px",
              border: "1px solid #ddd",
              borderRadius: "15px",
              fontSize: "14px"
            }}
            required
          />
        )}

        <input
          type="email"
          placeholder="Email"
          value={authData.email}
          onChange={(e) => handleInputChange('email', e.target.value)}
          style={{
            maxWidth: "345px",
            margin: "0 auto",
            width: "100%",
            padding: "10px",
            border: "1px solid #ddd",
            borderRadius: "15px",
            fontSize: "14px"
          }}
          required
        />

        <input
          type="password"
          placeholder="Password (min 6 characters)"
          value={authData.password}
          onChange={(e) => handleInputChange('password', e.target.value)}
          style={{
            maxWidth: "345px",
            margin: "0 auto",
            width: "100%",
            padding: "10px",
            border: "1px solid #ddd",
            borderRadius: "15px",
            fontSize: "14px"
          }}
          minLength="6"
          required
        />

        {error && (
          <div style={{
            color: "#d32f2f",
            fontSize: "12px",
            padding: "8px",
            backgroundColor: "#ffebee",
            borderRadius: "20px"
          }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          style={{
            padding: "12px",
            backgroundColor: isLoading ? "#ccc" : "#007cba",
            color: "white",
            border: "none",
            borderRadius: "20px",
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
            padding: "10px",
            backgroundColor: "transparent",
            color: "#007cba",
            border: "1px solid #007cba",
            borderRadius: "20px",
            cursor: "pointer",
            fontSize: "12px"
          }}
        >
          {isSignUp ? "Already have an account? Sign In" : "Need an account? Sign Up"}
        </button>
      </form>
    </div>
  );
};

export default AuthComponent;