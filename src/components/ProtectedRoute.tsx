"use client";

import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useSession } from '@/contexts/SessionContext';
import LoadingSpinner from './LoadingSpinner'; // Assuming you have a LoadingSpinner component

interface ProtectedRouteProps {
  redirectPath?: string;
  children?: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ redirectPath = '/', children }) => {
  const { session, isLoading } = useSession();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!session) {
    return <Navigate to={redirectPath} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;