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
    <div className="h-screen flex flex-col px-4 pt-2 pb-4">
      <Tabs defaultValue="chat" className="w-full flex-1 flex flex-col items-center"> {/* Added items-center here */}
        <TabsList className="grid grid-cols-2 w-fit h-8 mb-2"> {/* Moved TabsList back inside Tabs, added mb-2 */}
          <TabsTrigger value="chat" className="text-sm">Chat</TabsTrigger>
          <TabsTrigger value="canvas" className="text-sm">Canvas</TabsTrigger>
        </TabsList>
        <TabsContent value="chat" className="h-full flex-1 w-full"> {/* Added w-full to ensure content takes full width */}
          <ChatPage />
        </TabsContent>
        <TabsContent value="canvas" className="h-full flex-1 w-full"> {/* Added w-full to ensure content takes full width */}
          <CanvasPage />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Index;