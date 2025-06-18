import React from 'react';
import { loginWithGoogle } from '../firebase/auth';

const GoogleSignInButton = ( {googleString, googleSuccess} ) => {
  const handleClick = async () => {
    const result = await loginWithGoogle();
    if (result.success) {
      googleSuccess(result.user)
      console.log("Signed in:", result.user);
    } else {
      console.error("Google Sign-In Error:", result.error);
    }
  };

  return (
    <button onClick={handleClick} style={{  backgroundColor: "#fff", display: 'flex', alignItems: 'center', padding: '8px', paddingRight: '60px', paddingLeft: '60px', border: '1px solid #ccc', borderRadius: '30px' }}>
      <img src="https://developers.google.com/identity/images/g-logo.png" alt="Google logo" style={{ width: '18px', marginRight: '8px' }} />
      {googleString}
    </button>
  );
};

export default GoogleSignInButton;
