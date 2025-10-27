"use client";

import React from "react";
import { cn } from "@/lib/utils";

const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex items-center justify-start gap-3">
      <div className="rounded-lg px-4 py-2 bg-muted text-muted-foreground max-w-[70%]">
        <div className="flex items-center space-x-2">
          <div className={cn(
            "h-4 w-4 bg-primary animate-spin",
            "rounded-sm" // Make it a square with slightly rounded corners
          )} />
          <span className="text-sm">AI is thinking...</span>
        </div>
      </div>
    </div>
  );
};

export default LoadingSpinner;