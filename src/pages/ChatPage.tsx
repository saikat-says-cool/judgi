"use client";

import React from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';

const ChatPage = () => {
  // Placeholder for messages
  const messages = [
    { id: '1', role: 'user', content: 'What are the key provisions of Article 370 of the Indian Constitution?' },
    { id: '2', role: 'assistant', content: 'Article 370 of the Indian Constitution granted special autonomous status to the state of Jammu and Kashmir. It allowed J&K to have its own constitution, flag, and autonomy over all matters except defense, foreign affairs, and communications. It was abrogated by the Indian government in August 2019.' },
    { id: '3', role: 'user', content: 'Can you provide some landmark judgments related to its abrogation?' },
    { id: '4', role: 'assistant', content: 'The primary landmark judgment concerning the abrogation of Article 370 is the Supreme Court of India\'s decision in *In Re: Article 370 of the Constitution* (2023). The court upheld the President\'s power to abrogate Article 370 and affirmed the temporary nature of the provision.' },
  ];

  return (
    <Card className="flex flex-col h-full max-h-[calc(100vh-150px)]">
      <CardContent className="flex-1 p-4 overflow-hidden">
        <ScrollArea className="h-full pr-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] p-3 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter className="p-4 border-t flex items-center gap-2">
        <Input
          placeholder="Type your message..."
          className="flex-1"
        />
        <Button type="submit" size="icon">
          <Send className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ChatPage;