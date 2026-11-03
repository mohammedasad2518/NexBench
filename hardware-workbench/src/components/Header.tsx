import { useRef, useState, useEffect, type ChangeEvent } from 'react';
import { 
  Move, 
  RotateCw, 
  RotateCcw,
  Play, 
  Pause, 
  FilePlus2, 
  Check, 
  LayoutGrid,
  Columns,
  ChevronDown,
  Sparkles,
  Search,
  Share2,
  Smartphone,
  LogIn,
  MessageSquare,
  Sun,
  Moon,
  Box,
  Circle,
  Cylinder,
  PenTool,
  PlusSquare,
  ArrowUpDown,
  Layers,
  Copy,
  Trash2,
  Maximize2,
  Disc,
  Link,
  Settings,
  Hammer,
  Compass,
  Sliders
} from 'lucide-react';
import type { TransformMode, RuntimeStatus } from '../types/workbench';
import type { TrackType } from '../utils/floorTrack';

interface HeaderProps {
  transformMode: TransformMode;
  setTransformMode: (mode: TransformMode) => void;
  snapTranslate: boolean;
  setSnapTranslate: (val: boolean) => void;
  snapRotate: boolean;
  setSnapRotate: (val: boolean) => void;
  gridVisible: boolean;
  setGridVisible: (val: boolean) => void;
  // Wiring Mode
  isWiringMode: boolean;
  setIsWiringMode: (val: boolean) => void;
  // Assembly Mode
  isAssemblyMode: boolean;
  setIsAssemblyMode: (val: boolean) => void;
  // Code Editor Panel
  isCodePanelOpen: boolean;
  setIsCodePanelOpen: (val: boolean) => void;
  runtimeStatus: RuntimeStatus;
  // Physics Simulation
  isSimulating: boolean;
  isSimulationPaused: boolean;
  onStartSimulation: () => void;
  onPauseSimulation: () => void;
  onResetSimulation: () => void;
  // Actions
  onExport: () => void;
  onImport: (jsonStr: string) => void;
  onReset: () => void;
  // Project Persistence Actions
  onSaveProject: () => void;
  onLoadProject: () => void;
  onNewProject: () => void;
  projectName: string;
  onRenameProject?: (name: string) => void;
  isDirty: boolean;
  lastSaveTime: string | null;
  componentCount: number;
  wireCount: number;
  attachmentCount: number;
  selectedName: string | null;
  activeSourceInfo?: { compName: string; termName: string } | null;
  onCancelWiring?: () => void;
  // Redesign Navigation & Layout Toggles
  onGoHome?: () => void;
  isLeftCollapsed?: boolean;
  onToggleLeft?: () => void;
  isRightCollapsed?: boolean;
  onToggleRight?: () => void;
  isBottomCollapsed?: boolean;
  onToggleBottom?: () => void;
  onResetLayout?: () => void;
  // Track Type Selection
  trackType?: TrackType;
  onTrackTypeChange?: (track: TrackType) => void;
  // Camera View Angle
  onCameraPreset?: (view: 'perspective' | 'top' | 'front' | 'side' | 'reset') => void;
  // Additional BenchTwin Subtoolbar actions
  onDuplicateSelected?: () => void;
  onDeleteSelected?: () => void;
  onAddShape?: (shape: 'box' | 'cylinder' | 'sphere' | 'obstacle_box' | 'obstacle_wall') => void;
}

export const Header = ({
  transformMode,
  setTransformMode,
  snapTranslate,
  setSnapTranslate,
  snapRotate,
  setSnapRotate,
  gridVisible,
  setGridVisible,
  isWiringMode,
  setIsWiringMode,
  isAssemblyMode,
  setIsAssemblyMode,
  isCodePanelOpen,
  setIsCodePanelOpen,
  runtimeStatus,
  isSimulating,
  isSimulationPaused,
  onStartSimulation,
  onPauseSimulation,
  onResetSimulation,
  onExport,
  onImport,
  onReset,
  onSaveProject,
  onLoadProject,
  onNewProject,
  projectName,
  onRenameProject,
  isDirty,
  lastSaveTime,
  componentCount,
  wireCount,
  attachmentCount,
  selectedName,
  activeSourceInfo,
  onCancelWiring,
  onGoHome,
  isLeftCollapsed,
  onToggleLeft,
  isRightCollapsed,
  onToggleRight,
  isBottomCollapsed,
  onToggleBottom,
  onResetLayout,
  trackType,
  onTrackTypeChange,
  onCameraPreset,
  onDuplicateSelected,
  onDeleteSelected,
  onAddShape,
}: HeaderProps) => {
  void snapTranslate; void setSnapTranslate; void snapRotate; void setSnapRotate;
  void runtimeStatus; void isSimulationPaused; void onResetSimulation; void lastSaveTime;
  void componentCount; void wireCount; void attachmentCount; void selectedName;
  void activeSourceInfo; void onCancelWiring; void isLeftCollapsed; void isRightCollapsed;
  void isBottomCollapsed; void onToggleBottom; void onCameraPreset;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(projectName);
  const [isFileMenuOpen, setIsFileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isToolBarVisible, setIsToolBarVisible] = useState(true);
  const fileMenuRef = useRef<HTMLDivElement>(null);

  // Close file menu on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (fileMenuRef.current && !fileMenuRef.current.contains(e.target as Node)) {
        setIsFileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Theme switch effect
  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.remove('theme-light');
      document.body.classList.add('theme-dark');
    } else {
      document.body.classList.remove('theme-dark');
      document.body.classList.add('theme-light');
    }
  }, [isDarkMode]);

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        if (content) onImport(content);
      };
      reader.readAsText(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
    setIsFileMenuOpen(false);
  };

  const handleTitleSubmit = () => {
    if (editedTitle.trim() && onRenameProject) {
      onRenameProject(editedTitle.trim());
    }
    setIsEditingTitle(false);
  };

  const activeWorkflowTab = isCodePanelOpen ? 'code' : isWiringMode ? 'wire' : 'build';

  return (
    <header className="benchtwin-header-wrapper">
      {/* ======================================================== */}
      {/* 1. TOP BENCHTWIN HEADER ROW                              */}
      {/* ======================================================== */}
      <div className="benchtwin-top-bar">
        {/* Left Cluster: App Grid, Layout, File Menu, Undo, Redo */}
        <div className="header-left-cluster">
          {onGoHome && (
            <button 
              className="bt-icon-btn" 
              onClick={onGoHome} 
              title="Home / Dashboard"
              id="btn-header-home"
            >
              <LayoutGrid size={16} />
            </button>
          )}

          <button 
            className="bt-icon-btn" 
            title="Toggle Split View"
            onClick={onToggleRight}
          >
            <Columns size={16} />
          </button>

          {/* File Menu Dropdown */}
          <div className="bt-dropdown-container" ref={fileMenuRef}>
            <button 
              className="bt-file-btn" 
              onClick={() => setIsFileMenuOpen(!isFileMenuOpen)}
              id="btn-file-menu"
            >
              <span>File</span>
              <ChevronDown size={13} className={`chevron-arrow ${isFileMenuOpen ? 'open' : ''}`} />
            </button>

            {isFileMenuOpen && (
              <div className="bt-dropdown-menu">
                <button 
                  className="bt-dropdown-item" 
                  onClick={() => { onNewProject(); setIsFileMenuOpen(false); }}
                >
                  <FilePlus2 size={14} />
                  <span>New Project</span>
                </button>
                <button 
                  className="bt-dropdown-item" 
                  onClick={() => { onLoadProject(); setIsFileMenuOpen(false); }}
                >
                  <Search size={14} />
                  <span>Open Project...</span>
                </button>
                <button 
                  className="bt-dropdown-item" 
                  onClick={() => { onSaveProject(); setIsFileMenuOpen(false); }}
                >
                  <Check size={14} />
                  <span>Save Project</span>
                </button>
                <div className="bt-dropdown-divider" />
                <button 
                  className="bt-dropdown-item" 
                  onClick={() => { onExport(); setIsFileMenuOpen(false); }}
                >
                  <span>Export JSON</span>
                </button>
                <button 
                  className="bt-dropdown-item" 
                  onClick={() => fileInputRef.current?.click()}
                >
                  <span>Import JSON...</span>
                </button>
                <div className="bt-dropdown-divider" />
                <button 
                  className="bt-dropdown-item text-red" 
                  onClick={() => { onReset(); setIsFileMenuOpen(false); }}
                >
                  <span>Reset Scene</span>
                </button>
              </div>
            )}
          </div>

          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            accept=".json"
            onChange={handleFileUpload}
          />

          {/* Undo / Redo */}
          <button className="bt-icon-btn" title="Undo (Ctrl+Z)">
            <RotateCcw size={15} />
          </button>
          <button className="bt-icon-btn" title="Redo (Ctrl+Y)">
            <RotateCw size={15} />
          </button>

          {/* Project Name Pill */}
          <div className="bt-project-pill">
            <Box size={14} className="bt-project-icon" />
            {isEditingTitle ? (
              <div className="bt-title-editor">
                <input
                  type="text"
                  className="bt-title-input"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  onBlur={handleTitleSubmit}
                  onKeyDown={(e) => e.key === 'Enter' && handleTitleSubmit()}
                  autoFocus
                />
                <button className="bt-title-save" onClick={handleTitleSubmit}>
                  <Check size={12} />
                </button>
              </div>
            ) : (
              <div 
                className="bt-title-text"
                onClick={() => { setEditedTitle(projectName); setIsEditingTitle(true); }}
                title="Click to rename project"
              >
                <span>{projectName || 'NexBench Project'}</span>
              </div>
            )}
            <span className="bt-version-badge">v3.66.0</span>
            <span className="bt-saved-status">
              <span className={`status-bullet ${isDirty ? 'bullet-dirty' : 'bullet-saved'}`} />
              <span>{isDirty ? 'Unsaved' : 'Saved'}</span>
            </span>
          </div>
        </div>

        {/* Center Workflow Tabs: Build, Wire, Code, Simulate */}
        <div className="header-center-tabs">
          <div className="bt-tabs-pill-group">
            <button
              className={`bt-tab-btn ${activeWorkflowTab === 'build' ? 'active' : ''}`}
              onClick={() => {
                setIsWiringMode(false);
                setIsAssemblyMode(false);
                setIsCodePanelOpen(false);
              }}
              id="tab-workflow-build"
            >
              Build
            </button>
            <button
              className={`bt-tab-btn ${activeWorkflowTab === 'wire' ? 'active' : ''}`}
              onClick={() => {
                setIsWiringMode(true);
                setIsAssemblyMode(false);
                setIsCodePanelOpen(false);
              }}
              id="tab-workflow-wire"
            >
              Wire
            </button>
            <button
              className={`bt-tab-btn ${activeWorkflowTab === 'code' ? 'active' : ''}`}
              onClick={() => {
                setIsCodePanelOpen(true);
              }}
              id="tab-workflow-code"
            >
              Code
            </button>
          </div>

          {/* Prominent Emerald Simulate Button */}
          <button
            className={`bt-simulate-btn ${isSimulating ? 'simulating' : ''}`}
            onClick={isSimulating ? onPauseSimulation : onStartSimulation}
            id="btn-header-simulate"
          >
            {isSimulating ? (
              <>
                <Pause size={14} fill="currentColor" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play size={14} fill="currentColor" />
                <span>Simulate</span>
              </>
            )}
          </button>

          <button 
            className="bt-icon-btn" 
            title="Settings & Workspace Preferences"
            onClick={onResetLayout}
          >
            <Settings size={15} />
          </button>
        </div>

        {/* Right Cluster: Pro Badge, Share, Get App, Login, Theme Toggle */}
        <div className="header-right-cluster">
          <button className="bt-pro-btn">
            <Sparkles size={13} className="sparkle-icon" />
            <span>What's in Pro</span>
          </button>

          <span className="bt-pro-soon-badge">Pro Soon</span>

          <button className="bt-icon-btn" title="View Options">
            <Columns size={15} />
          </button>

          <button className="bt-icon-btn" title="Search Everything">
            <Search size={15} />
          </button>

          <button className="bt-pill-action-btn" onClick={onExport}>
            <Share2 size={13} />
            <span>Share</span>
          </button>

          <button className="bt-pill-action-btn primary" onClick={onSaveProject}>
            <span>Build it for real</span>
          </button>

          <button className="bt-pill-action-btn outline">
            <Smartphone size={13} />
            <span>Get the app</span>
          </button>

          <button className="bt-pill-action-btn login">
            <LogIn size={13} />
            <span>Log in</span>
          </button>

          <button className="bt-icon-btn" title="Send Feedback">
            <MessageSquare size={15} />
          </button>

          {/* Theme Toggle Pill Switch */}
          <div 
            className={`bt-theme-switch ${isDarkMode ? 'dark' : 'light'}`} 
            onClick={() => setIsDarkMode(!isDarkMode)}
            title="Toggle Light / Dark Mode"
          >
            <div className="theme-toggle-handle">
              {isDarkMode ? <Moon size={11} /> : <Sun size={11} />}
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. FLOATING SUB-HEADER TOOL BAR (BENCHTWIN CAD TOOLBAR)  */}
      {/* ======================================================== */}
      {isToolBarVisible && (
        <div className="benchtwin-subtoolbar">
          {/* Handle */}
          <div className="subtoolbar-handle">
            <span className="handle-label">Tool bar</span>
            <Link size={12} className="handle-link-icon" />
          </div>

          {/* Section 1: Shapes */}
          <div className="subtoolbar-group">
            <button 
              className="subtoolbar-btn" 
              title="Add 3D Box Primitive"
              onClick={() => onAddShape?.('obstacle_box')}
            >
              <Box size={15} />
              <span>Box</span>
            </button>
            <button 
              className="subtoolbar-btn" 
              title="Add 3D Cylinder Primitive"
              onClick={() => onAddShape?.('cylinder')}
            >
              <Cylinder size={15} />
              <span>Cylinder</span>
            </button>
            <button 
              className="subtoolbar-btn" 
              title="Add 3D Sphere Primitive"
              onClick={() => onAddShape?.('sphere')}
            >
              <Circle size={15} />
              <span>Sphere</span>
            </button>
            <button 
              className="subtoolbar-btn" 
              title="Add Hole / Mounting Cutout"
              onClick={() => onAddShape?.('obstacle_wall')}
            >
              <Disc size={15} strokeDasharray="3 3" />
              <span>Hole</span>
            </button>
            <button 
              className="subtoolbar-btn" 
              title="2D Sketch on Mat"
              onClick={() => onTrackTypeChange?.(trackType === 'oval' ? 'straight' : 'oval')}
            >
              <PenTool size={15} />
              <span>Sketch</span>
            </button>
            <button 
              className="subtoolbar-btn" 
              title="Browse Extended Shape Library"
              onClick={onToggleLeft}
            >
              <PlusSquare size={15} />
              <span>More shapes</span>
            </button>
          </div>

          <div className="subtoolbar-divider" />

          {/* Section 2: Transforms & Operations */}
          <div className="subtoolbar-group">
            <button 
              className={`subtoolbar-btn ${transformMode === 'translate' ? 'active' : ''}`}
              title="Move & Turn (Translation Gizmo) [W]"
              onClick={() => setTransformMode('translate')}
            >
              <Move size={15} />
              <span>Move & turn</span>
            </button>
            <button 
              className={`subtoolbar-btn ${transformMode === 'scale' ? 'active' : ''}`}
              title="Lift & Size (Scale Gizmo) [R]"
              onClick={() => setTransformMode('scale')}
            >
              <ArrowUpDown size={15} />
              <span>Lift & size</span>
            </button>
            <button 
              className="subtoolbar-btn" 
              title="Group Selected Components"
            >
              <Layers size={15} />
              <span>Group</span>
            </button>
            <button 
              className={`subtoolbar-btn ${transformMode === 'rotate' ? 'active' : ''}`}
              title="Rotate Component [E]"
              onClick={() => setTransformMode('rotate')}
            >
              <RotateCw size={15} />
              <span>Rotate</span>
            </button>
            <button 
              className="subtoolbar-btn" 
              title="Duplicate Component (Ctrl+D)"
              onClick={onDuplicateSelected}
            >
              <Copy size={15} />
              <span>Copy</span>
            </button>
            <button 
              className="subtoolbar-btn text-danger" 
              title="Delete Selected Component [Del]"
              onClick={onDeleteSelected}
            >
              <Trash2 size={15} />
              <span>Delete</span>
            </button>
          </div>

          <div className="subtoolbar-divider" />

          {/* Section 3: Engineering Tools */}
          <div className="subtoolbar-group">
            <button 
              className="subtoolbar-btn" 
              title="Drill Hole / Mechanical Mounting"
              onClick={() => setIsAssemblyMode(!isAssemblyMode)}
            >
              <Hammer size={15} />
              <span>Drill</span>
            </button>
            <button 
              className="subtoolbar-btn" 
              title="Fasteners & Screws"
              onClick={() => setIsAssemblyMode(true)}
            >
              <Settings size={15} />
              <span>Screws</span>
            </button>
            <button 
              className="subtoolbar-btn" 
              title="Mirror Part Across Axis"
            >
              <Compass size={15} />
              <span>Mirror</span>
            </button>
            <button 
              className="subtoolbar-btn" 
              title="Insert Component Part from Library"
              onClick={onToggleLeft}
            >
              <PlusSquare size={15} />
              <span>Insert part</span>
            </button>
            <button 
              className="subtoolbar-btn" 
              title="Precision Caliper & Ruler"
              onClick={() => setGridVisible(!gridVisible)}
            >
              <Sliders size={15} />
              <span>Measure</span>
            </button>
            <button 
              className="subtoolbar-btn" 
              title="All Engineering Tools"
              onClick={onResetLayout}
            >
              <LayoutGrid size={15} />
              <span>All tools</span>
            </button>
          </div>

          {/* Subtoolbar collapse toggle */}
          <div className="subtoolbar-right-controls">
            <button 
              className="subtoolbar-btn icon-only" 
              onClick={() => setIsToolBarVisible(false)}
              title="Hide Tool Bar"
            >
              <Maximize2 size={13} />
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
