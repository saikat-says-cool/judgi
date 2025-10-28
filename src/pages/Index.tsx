"use client";

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ChatPage from './ChatPage';
import CanvasPage from './CanvasPage';
import { useSession } from '@/contexts/SessionContext';
import { useNavigate } from 'react-router-dom';
import Sidebar from '@/components/Sidebar';

const Index = () => {
  const { session, isLoading } = useSession();
  const navigate = useNavigate();

  if (!isLoading && !session) {
    navigate('/login');
    return null;
  }

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Routes>
          <Route path="chat/:conversationId" element={<ChatPage />} /> {/* Dynamic conversation ID */}
          <Route path="chat" element={<Navigate to="chat/new" replace />} /> {/* Default to new chat */}
          <Route path="canvas" element={<CanvasPage />} />
          <Route path="/" element={<Navigate to="chat/new" replace />} /> {/* Default to new chat */}
        </Routes>
      </div>
    </div>
  );
};

export default Index;