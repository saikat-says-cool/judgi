"use client";

import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import ChatPage from './ChatPage';
import CanvasHomePage from './CanvasHomePage'; // New Canvas Home Page
import CanvasEditorPage from './CanvasEditorPage'; // Renamed Canvas Editor Page
import ProfileSettingsPage from './ProfileSettingsPage'; // Import the new page
import { useSession } from '@/contexts/SessionContext';
import { useNavigate } from 'react-router-dom';
import Sidebar from '@/components/Sidebar';

const Index = () => {
  const { session, isLoading } = useSession();
  const navigate = useNavigate();
  const location = useLocation();

  // Determine if the sidebar should be hidden
  // The sidebar should be hidden when on the CanvasEditorPage
  const hideSidebar = location.pathname.startsWith('/app/canvas/') && location.pathname !== '/app/canvas';

  if (!isLoading && !session) {
    navigate('/login');
    return null;
  }

  return (
    <div className="flex h-screen">
      {!hideSidebar && <Sidebar />} {/* Conditionally render Sidebar */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Routes>
          <Route path="chat/:conversationId" element={<ChatPage />} />
          <Route path="chat" element={<Navigate to="chat/new" replace />} />

          <Route path="canvas" element={<CanvasHomePage />} /> {/* Canvas landing page */}
          <Route path="canvas/:documentId" element={<CanvasEditorPage />} /> {/* Canvas editor page */}
          
          <Route path="profile" element={<ProfileSettingsPage />} /> {/* Nested Profile Settings Route */}

          <Route path="/" element={<Navigate to="chat/new" replace />} />
        </Routes>
      </div>
    </div>
  );
};

export default Index;