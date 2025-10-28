"use client";

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, MessageSquare, LayoutDashboard } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface NavLinkProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  isMobile?: boolean;
  onClick?: () => void;
}

const NavLink: React.FC<NavLinkProps> = ({ to, icon, label, isActive, isMobile, onClick }) => (
  <Button
    asChild
    variant={isActive ? "secondary" : "ghost"}
    className={`w-full justify-start ${isMobile ? "text-base" : "text-sm"}`}
    onClick={onClick}
  >
    <Link to={to}>
      {icon}
      <span className="ml-2">{label}</span>
    </Link>
  </Button>
);

const Sidebar: React.FC = () => {
  const isMobile = useIsMobile();
  const location = useLocation();
  const [isOpen, setIsOpen] = React.useState(false);

  const closeSidebar = () => {
    if (isMobile) {
      setIsOpen(false);
    }
  };

  const navItems = [
    { to: "/app/chat", label: "Chat", icon: <MessageSquare className="h-4 w-4" /> },
    { to: "/app/canvas", label: "Canvas", icon: <LayoutDashboard className="h-4 w-4" /> },
  ];

  const sidebarContent = (
    <div className="flex flex-col space-y-2 p-4">
      <h2 className="text-lg font-semibold mb-4">JudgiAI</h2>
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          icon={item.icon}
          label={item.label}
          isActive={location.pathname === item.to}
          isMobile={isMobile}
          onClick={closeSidebar}
        />
      ))}
    </div>
  );

  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="fixed top-4 left-4 z-50">
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          {sidebarContent}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <div className="hidden md:flex flex-col h-full w-64 border-r bg-sidebar text-sidebar-foreground">
      {sidebarContent}
    </div>
  );
};

export default Sidebar;