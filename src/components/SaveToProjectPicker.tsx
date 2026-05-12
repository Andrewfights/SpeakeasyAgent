import { useState, useEffect, useRef } from 'react';
import { IconSearch, IconPlus, IconX } from './ui/Icons';
import { DiamondIcon } from './ui/Icons';

interface Project {
  id: string;
  name: string;
  color?: string;
  item_count?: number;
  is_suggested?: boolean;
  suggestion_reason?: string;
}

interface SaveToProjectPickerProps {
  onSelect: (projectId: string, projectName: string) => void;
  onClose: () => void;
  onCreateNew?: () => void;
  position?: { x: number; y: number };
  suggestedProjectId?: string;
}

export function SaveToProjectPicker({
  onSelect,
  onClose,
  onCreateNew,
  position,
  suggestedProjectId
}: SaveToProjectPickerProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  // Fetch projects
  useEffect(() => {
    fetch('/api/projects')
      .then(r => r.json())
      .then(data => {
        // Mark suggested project if provided
        const projectsWithSuggestions = data.map((p: Project) => ({
          ...p,
          is_suggested: p.id === suggestedProjectId,
          suggestion_reason: p.id === suggestedProjectId ? 'aesthetic fit' : undefined
        }));
        // Sort: suggested first, then by name
        projectsWithSuggestions.sort((a: Project, b: Project) => {
          if (a.is_suggested && !b.is_suggested) return -1;
          if (!a.is_suggested && b.is_suggested) return 1;
          return a.name.localeCompare(b.name);
        });
        setProjects(projectsWithSuggestions);
      })
      .catch(console.error);
  }, [suggestedProjectId]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Close on escape or click outside
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, filteredProjects.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const project = filteredProjects[selectedIndex];
        if (project) {
          onSelect(project.id, project.name);
        }
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose, onSelect, selectedIndex]);

  // Filter projects by search
  const filteredProjects = projects.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Reset selection when filter changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery]);

  const suggestedProjects = filteredProjects.filter(p => p.is_suggested);
  const otherProjects = filteredProjects.filter(p => !p.is_suggested);

  return (
    <>
      <div className="picker-overlay" onClick={onClose} />
      <div
        className="picker"
        ref={pickerRef}
        style={position ? { left: position.x, top: position.y } : undefined}
      >
        <div className="picker-hd">
          <div className="picker-mk">
            <DiamondIcon size={11} />
          </div>
          <div>
            <div className="picker-title">Save to project</div>
            {suggestedProjects.length > 0 && (
              <div className="picker-hint">
                Scout suggests <b>{suggestedProjects[0].name}</b>
              </div>
            )}
          </div>
        </div>

        <div className="picker-search">
          <div className="picker-search-field">
            <IconSearch size={11} style={{ color: 'var(--color-dim)' }} />
            <input
              ref={inputRef}
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="picker-body">
          {suggestedProjects.length > 0 && (
            <>
              <div className="picker-section">Suggested</div>
              {suggestedProjects.map((project, i) => (
                <div
                  key={project.id}
                  className={`proj-row suggested ${selectedIndex === i ? 'selected' : ''}`}
                  onClick={() => onSelect(project.id, project.name)}
                >
                  <span className="swatch" style={{ background: project.color || '#7f1d1d' }} />
                  <span className="nm">
                    {project.name}
                    {project.suggestion_reason && (
                      <span className="why">{project.suggestion_reason}</span>
                    )}
                  </span>
                  <svg className="check" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M5 12 L10 17 L19 7"/>
                  </svg>
                </div>
              ))}
            </>
          )}

          {otherProjects.length > 0 && (
            <>
              <div className="picker-section">All projects</div>
              {otherProjects.map((project, i) => {
                const index = suggestedProjects.length + i;
                return (
                  <div
                    key={project.id}
                    className={`proj-row ${selectedIndex === index ? 'selected' : ''}`}
                    onClick={() => onSelect(project.id, project.name)}
                  >
                    <span className="swatch" style={{ background: project.color || '#3a322b' }} />
                    <span className="nm">{project.name}</span>
                    {project.item_count !== undefined && (
                      <span className="meta">{project.item_count}</span>
                    )}
                  </div>
                );
              })}
            </>
          )}

          {filteredProjects.length === 0 && (
            <div style={{ padding: '16px', textAlign: 'center', color: 'var(--color-muted)', fontSize: '12px' }}>
              No projects found
            </div>
          )}

          <div className="picker-divider" />

          <div className="picker-action" onClick={onCreateNew}>
            <i><IconPlus size={13} /></i>
            <span>New project...</span>
            <span className="kbd">N</span>
          </div>
        </div>

        <div className="picker-foot">
          <span className="picker-foot-hint">
            <kbd>Enter</kbd> save <kbd>Esc</kbd> cancel
          </span>
        </div>
      </div>
    </>
  );
}

export default SaveToProjectPicker;
