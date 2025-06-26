import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './src/styles/index.css'
import App from './src/App.jsx'

// Function to initialize React app
function initializeReactApp(targetElement) {
  const root = createRoot(targetElement);
  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  );
  return root;
}

// Listen for the panel ready event from content.js
window.addEventListener('pregrade-panel-ready', (event) => {
  const { panelElement } = event.detail;
  
  // Create the root container that your React app expects
  const reactContainer = document.createElement('div');
  reactContainer.id = 'root';
  reactContainer.style.cssText = `
    margin-top: -32px;
    margin-left: -31px;
    width: 80%;
    height: 100%;
  `;
  
  // Append to the panel
  panelElement.appendChild(reactContainer);
  
  // Now initialize React
  const reactRoot = initializeReactApp(reactContainer);
  
  console.log('PreGrade React app initialized');
  
  // Store the root instance in case we need to unmount later
  panelElement.reactRoot = reactRoot;
});

// Handle cleanup when panel closes
window.addEventListener('message', (event) => {
  if (event.data?.type === 'CLOSE_PREGRADE_PANEL') {
    const panel = document.getElementById('pregrade-sidebar');
    if (panel?.reactRoot) {
      panel.reactRoot.unmount();
      panel.reactRoot = null;
    }
  }
});