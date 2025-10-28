"use client";

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ChatPage from './ChatPage';
import CanvasPage from './CanvasPage';
import { useSession } from '@/contexts/SessionContext';
import { useNavigate } from 'react-router-dom';
import Sidebar from '@/components/Sidebar'; // Import the new Sidebar component

const Index = () => {
  const { session, isLoading } = useSession();
  const navigate = useNavigate();

  if (!isLoading && !session) {
    navigate('/login');
    return null;
  }

  return (
    <div className="flex h-screen"> {/* Main container for sidebar and content */}
      <Sidebar /> {/* Render the Sidebar */}
      <div className="flex-1 flex flex-col overflow-hidden"> {/* Content area */}
        <Routes>
          <Route path="chat" element={<ChatPage />} />
          <Route path="canvas" element={<CanvasPage />} />
          <Route path="/" element={<Navigate to="chat" replace />} /> {/* Default to chat */}
        </Routes>
      </div>
    </div>
  );
};

export default Index;