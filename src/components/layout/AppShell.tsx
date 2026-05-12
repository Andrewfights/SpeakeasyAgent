import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  BrandMark,
  IconFolder,
  IconCoin
} from '../ui/Icons';
import { Chip, ChipDot } from '../ui';
import { HuntsSidebar } from '../HuntsSidebar';

interface AppShellProps {
  children: React.ReactNode;
  projectId?: string;
  projectName?: string;
  projectBudget?: number;
  showProjectContext?: boolean;
  isSearching?: boolean;
  centerContent?: React.ReactNode;
  rightContent?: React.ReactNode;
  showHuntsSidebar?: boolean;
  activeHuntId?: string;
  onSelectHunt?: (huntId: string) => void;
  onNewHunt?: (projectId?: string) => void;
}

export function AppShell({
  children,
  projectId,
  projectName,
  projectBudget = 200,
  showProjectContext = true,
  isSearching = false,
  centerContent,
  rightContent,
  showHuntsSidebar = true,
  activeHuntId,
  onSelectHunt,
  onNewHunt
}: AppShellProps) {
  const navigate = useNavigate();
  const location = useLocation();

  // Default handlers if not provided
  const handleSelectHunt = onSelectHunt || ((huntId: string) => {
    navigate(`/chat/${huntId}`);
  });

  const handleNewHunt = onNewHunt || ((pid?: string) => {
    navigate('/chat');
  });

  return (
    <div className="app-shell no-rail">
      {/* Top bar */}
      <header className="top-bar">
        <div className="brand" onClick={() => navigate('/chat')} style={{ cursor: 'pointer' }}>
          <BrandMark size={18} />
          <span>Speakeasy scout</span>
        </div>

        {/* Center content - project chips or custom */}
        <div className="flex-1 flex justify-center gap-2">
          {centerContent ? centerContent : showProjectContext && projectName ? (
            <>
              <Chip>
                <IconFolder size={12} />
                {projectName}
              </Chip>
              <Chip variant="gold">
                <IconCoin size={14} />
                ${projectBudget} per item
              </Chip>
              <Chip>
                <ChipDot status={isSearching ? 'warn' : 'active'} />
                {isSearching ? 'Searching' : 'Scouting'}
              </Chip>
            </>
          ) : (
            <>
              <Chip>All projects</Chip>
              <Chip><ChipDot />3 active</Chip>
            </>
          )}
        </div>

        {/* Right content */}
        {rightContent ? rightContent : (
          <div className="avatar">SQ</div>
        )}
      </header>

      {/* Body with sidebar */}
      <div className="app-body">
        {/* Hunts sidebar - always visible */}
        {showHuntsSidebar && (
          <HuntsSidebar
            activeHuntId={activeHuntId}
            onSelectHunt={handleSelectHunt}
            onNewHunt={handleNewHunt}
          />
        )}

        {/* Main content */}
        <main className="main-content">
          {children}
        </main>
      </div>
    </div>
  );
}

export default AppShell;
