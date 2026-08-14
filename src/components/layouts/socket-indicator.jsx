'use client';

import React, { useEffect, useState } from 'react';
import echo from '@/lib/echo';

export const SocketIndicator = () => {
  const [status, setStatus] = useState('disconnected');

  useEffect(() => {
    // Make sure echo and pusher exist
    if (!echo || !echo.connector || !echo.connector.pusher) return;
    
    const pusher = echo.connector.pusher;
    if (!pusher.connection) return;
    
    const handleStateChange = (states) => {
      setStatus(states.current);
    };

    // Bind to the state_change event of Pusher
    pusher.connection.bind('state_change', handleStateChange);
    // Set initial state
    setStatus(pusher.connection.state);

    return () => {
      pusher.connection.unbind('state_change', handleStateChange);
    };
  }, []);

  const getColor = () => {
    switch (status) {
      case 'connected': return '#10B981'; // Green
      case 'connecting': return '#F59E0B'; // Yellow
      case 'disconnected': 
      case 'unavailable':
      case 'failed': return '#EF4444'; // Red
      default: return '#6B7280'; // Gray
    }
  };

  return (
    <div 
      className="flex items-center mr-2 px-2 py-1 rounded-full bg-white/20 backdrop-blur-sm border border-white/30"
      title={`Socket status: ${status}`}
    >
      <div 
        style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: getColor(), marginRight: 6 }} 
        className="shadow-sm"
      />
      <span className="text-[10px] font-bold uppercase text-muted-foreground">{status}</span>
    </div>
  );
};
