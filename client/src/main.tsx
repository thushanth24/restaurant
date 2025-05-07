import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { apiRequest } from "./lib/queryClient";

// Add global error handler
window.addEventListener('unhandledrejection', (event) => {
  // Only log real errors, not canceled fetch requests
  if (event.reason.name !== 'AbortError') {
    console.error('Unhandled promise rejection:', event.reason);
  }
});

// Check if the server is accessible
async function checkServerConnectivity() {
  try {
    await apiRequest('GET', '/api/categories');
    console.log('Server connection established');
  } catch (error) {
    console.error('Error connecting to server:', error);
  }
}

// Initialize the app
const initialize = async () => {
  await checkServerConnectivity();
  createRoot(document.getElementById("root")!).render(<App />);
};

initialize();
