import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { AuthScreen } from './components/auth/AuthScreen';

import './index.css';

import { AppProvider } from './context/AppContext.jsx';
import App from './App.jsx';

// --- START: NEW IMPORTS & ROUTE STRUCTURE ---
import { LandingPage } from './landing/LandingPage.jsx'; // Import the new landing page
import { ProjectsView } from './components/dashboard/ProjectsView';
import { AnalyticsView } from './components/dashboard/AnalyticsView';
import { SettingsView } from './components/dashboard/SettingsView';
import { PlaygroundView } from './components/dashboard/PlaygroundView';
import { DataView } from './components/dashboard/DataView';


const router = createBrowserRouter([
  {
    path: "/", // The root path now shows the Landing Page
    element: <LandingPage />,
  },
  {
    path: "/app", // All of your application logic now lives under the "/app" route
    element: <App />,
    // Children routes are rendered inside the <Outlet /> of App.jsx
    children: [
      { path: "projects", element: <ProjectsView /> },
      { path: "playground", element: <PlaygroundView /> },
      { path: "data", element: <DataView /> },
      { path: "analytics", element: <AnalyticsView /> },
      { path: "settings", element: <SettingsView /> },
      // Team and Billing are already removed, which is correct
    ]
  },
  {
    path: "/signin",
    element: <AuthScreen />
  }
]);
// --- END: NEW IMPORTS & ROUTE STRUCTURE ---

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppProvider>
      <RouterProvider router={router} />
    </AppProvider>
  </React.StrictMode>
);