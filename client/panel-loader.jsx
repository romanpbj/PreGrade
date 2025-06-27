import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './src/App.jsx';

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
  reactContainer.className = 'panel-loader-container'; // Add a unique class name

  // Apply inline styles directly to the container
  reactContainer.style.cssText = `
    display: block;
    padding: 0;
    margin: 0;
    text-align: initial;
    font-family: inherit;
    background-color: transparent;
  `;

  // Append to the panel
  panelElement.appendChild(reactContainer);

  // Now initialize React
  const reactRoot = initializeReactApp(reactContainer);

  console.log('PreGrade React app initialized');
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