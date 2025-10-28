"use client";

import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ChatPage from "./ChatPage";
import CanvasPage from "./CanvasPage";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col items-center bg-background text-foreground p-4">
      <Tabs defaultValue="chat" className="w-full max-w-4xl mt-8">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="chat">Chat</TabsTrigger>
          <TabsTrigger value="canvas">Canvas</TabsTrigger>
        </TabsList>
        <TabsContent value="chat" className="mt-4 h-[calc(100vh-150px)]">
          <ChatPage />
        </TabsContent>
        <TabsContent value="canvas" className="mt-4 h-[calc(100vh-150px)]">
          <CanvasPage />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Index;