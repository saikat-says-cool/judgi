"use client";

import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ChatPage from './ChatPage';
import CanvasPage from './CanvasPage';
import { useSession } from '@/contexts/SessionContext';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const { session, isLoading } = useSession();
  const navigate = useNavigate();

  if (!isLoading && !session) {
    navigate('/login');
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col p-4"> {/* Removed items-center */}
      <Tabs defaultValue="chat" className="w-full"> {/* Removed max-w-4xl and mt-8 */}
        <div className="flex justify-center w-full mb-4"> {/* New container for TabsList */}
          <TabsList className="grid grid-cols-2 w-fit"> {/* Changed w-full to w-fit */}
            <TabsTrigger value="chat">Chat</TabsTrigger>
            <TabsTrigger value="canvas">Canvas</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="chat" className="h-full flex-1"> {/* Removed mt-4 */}
          <ChatPage />
        </TabsContent>
        <TabsContent value="canvas" className="h-full flex-1">
          <CanvasPage />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Index;