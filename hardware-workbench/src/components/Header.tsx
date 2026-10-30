import { useRef, useState, type ChangeEvent } from 'react';
import { 
  Move, 
  RotateCw, 
  Maximize2, 
  Magnet, 
  Download, 
  Upload, 
  RotateCcw, 
  Eye, 
  EyeOff,
  Zap,
  Unplug,
  Play,
  Pause,
  RotateCcw as ResetSimIcon,
  Wrench,
  Code,
  Save,
  FolderOpen,
  FilePlus2,
  Cpu,
  Home,
  Check,
  Edit2,
  PanelLeft,
  PanelRight,
  PanelBottom,
  LayoutGrid
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
  trackType = 'oval',
  onTrackTypeChange,
  onCameraPreset,
}: HeaderProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(projectName);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
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
  };

  const handleTitleSubmit = () => {
    if (editedTitle.trim() && onRenameProject) {
      onRenameProject(editedTitle.trim());
    }
    setIsEditingTitle(false);
  };

  return (
    <header className="workbench-header-container">
      {/* ======================================================== */}
      {/* 1. PRIMARY APPLICATION TOOLBAR (TOP ROW)                 */}
      {/* ======================================================== */}
      <div className="workbench-primary-bar">
        {/* Left: Brand Identity, Home & Project Name */}
        <div className="header-brand-cluster">
          {onGoHome && (
            <button 
              className="header-home-btn" 
              onClick={onGoHome} 
              title="Return to Welcome Page"
              id="btn-header-home"
            >
              <Home size={15} />
            </button>
          )}

          <div className="header-brand-logo">
            <Cpu size={18} className="brand-icon-svg" />
            <span className="brand-title-text">Hardware Workbench</span>
          </div>

          <div className="header-divider-v" />

          {/* Editable Project Name */}
          <div className="header-project-name-group">
            {isEditingTitle ? (
              <div className="inline-title-editor">
                <input
                  type="text"
                  className="project-title-input"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  onBlur={handleTitleSubmit}
                  onKeyDown={(e) => e.key === 'Enter' && handleTitleSubmit()}
                  autoFocus
                />
                <button className="title-confirm-btn" onClick={handleTitleSubmit}>
                  <Check size={13} />
                </button>
              </div>
            ) : (
              <div 
                className="project-title-display" 
                onClick={() => { setEditedTitle(projectName); setIsEditingTitle(true); }}
                title="Click to rename project"
                id="header-project-title-label"
              >
                <span className="project-name-text">{projectName || 'Untitled Project'}</span>
                <Edit2 size={11} className="title-edit-pencil" />
              </div>
            )}

            {isDirty ? (
              <span className="dirty-indicator-pill" title="Project has unsaved modifications">
                <span className="dirty-dot" />
                <span>Unsaved</span>
              </span>
            ) : (
              <span className="saved-indicator-pill" title={lastSaveTime ? `Last saved at ${lastSaveTime}` : 'All changes saved'}>
                <Check size={11} />
                <span>Saved</span>
              </span>
            )}
          </div>
        </div>

        {/* Center: Simulation Runtime & Clock Controls */}
        <div className="header-simulation-cluster">
          {/* Simulation Status Pill */}
          <div className={`simulation-status-pill status-${runtimeStatus}`}>
            <span className={`status-dot dot-${runtimeStatus}`} />
            <span className="status-label">
              {runtimeStatus === 'running' 
                ? 'SIMULATION RUNNING' 
                : runtimeStatus === 'paused' 
                ? 'SIMULATION PAUSED' 
                : runtimeStatus === 'error' 
                ? 'RUNTIME ERROR' 
                : 'ENGINE IDLE'}
            </span>
          </div>

          {/* Physics Simulation Control Buttons */}
          <div className="sim-buttons-group">
            {!isSimulating ? (
              <button
                className="sim-btn sim-btn-play"
                onClick={onStartSimulation}
                title="Start Physics & Robot Simulation"
                id="btn-header-start-sim"
              >
                <Play size={13} />
                <span>Simulate</span>
              </button>
            ) : (
              <>
                <button
                  className={`sim-btn ${isSimulationPaused ? 'sim-btn-resume' : 'sim-btn-pause'}`}
                  onClick={onPauseSimulation}
                  title={isSimulationPaused ? 'Resume Simulation' : 'Pause Simulation'}
                  id="btn-header-pause-sim"
                >
                  {isSimulationPaused ? <Play size={13} /> : <Pause size={13} />}
                  <span>{isSimulationPaused ? 'Resume' : 'Pause'}</span>
                </button>
                <button
                  className="sim-btn sim-btn-reset"
                  onClick={onResetSimulation}
                  title="Reset Simulation Clock & Dynamic State"
                  id="btn-header-reset-sim"
                >
                  <ResetSimIcon size={12} />
                  <span>Reset</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Right: Project Management & Panel Layout Controls */}
        <div className="header-actions-cluster">
          {/* Project Management Buttons */}
          <div className="project-actions-group">
            <button
              className="action-pill-btn"
              id="btn-new-project"
              onClick={onNewProject}
              title="Create New Project"
            >
              <FilePlus2 size={13} />
              <span>New</span>
            </button>

            <button
              className="action-pill-btn"
              id="btn-open-project"
              onClick={onLoadProject}
              title="Open Project / Templates / Calibration"
            >
              <FolderOpen size={13} />
              <span>Open</span>
            </button>

            <button
              className={`action-pill-btn ${isDirty ? 'btn-save-dirty' : ''}`}
              id="btn-save-project"
              onClick={onSaveProject}
              title={isDirty ? 'Save Project Changes' : 'Project Saved'}
            >
              <Save size={13} />
              <span>Save</span>
              {isDirty && <span className="save-dirty-dot" />}
            </button>

            <button
              className="action-pill-btn"
              onClick={onReset}
              title="Reset All Scene Components & Wires"
              id="btn-reset-scene"
            >
              <RotateCcw size={13} />
              <span>Reset Scene</span>
            </button>

            <button
              className="action-pill-btn"
              onClick={() => fileInputRef.current?.click()}
              title="Import Project Scene JSON"
              id="btn-import-project"
            >
              <Upload size={13} />
              <span>Import</span>
            </button>
            <input 
              ref={fileInputRef} 
              type="file" 
              accept=".json" 
              style={{ display: 'none' }} 
              onChange={handleFileChange} 
            />

            <button
              className="action-pill-btn action-pill-export"
              onClick={onExport}
              title="Export Full Project Scene as JSON"
              id="btn-export-project"
            >
              <Download size={13} />
              <span>Export</span>
            </button>
          </div>

          <div className="header-divider-v" />

          {/* Panel Layout Toggles */}
          <div className="layout-toggles-group">
            {onToggleLeft && (
              <button
                className={`layout-toggle-btn ${!isLeftCollapsed ? 'active' : ''}`}
                onClick={onToggleLeft}
                title={isLeftCollapsed ? 'Show Component & Hierarchy Sidebar' : 'Hide Sidebar'}
                id="btn-toggle-left-panel"
              >
                <PanelLeft size={14} />
              </button>
            )}
            {onToggleBottom && (
              <button
                className={`layout-toggle-btn ${!isBottomCollapsed ? 'active' : ''}`}
                onClick={onToggleBottom}
                title={isBottomCollapsed ? 'Show Code & Diagnostics Dock' : 'Hide Dock'}
                id="btn-toggle-bottom-panel"
              >
                <PanelBottom size={14} />
              </button>
            )}
            {onToggleRight && (
              <button
                className={`layout-toggle-btn ${!isRightCollapsed ? 'active' : ''}`}
                onClick={onToggleRight}
                title={isRightCollapsed ? 'Show Properties & Inspector' : 'Hide Inspector'}
                id="btn-toggle-right-panel"
              >
                <PanelRight size={14} />
              </button>
            )}
            {onResetLayout && (
              <button
                className="layout-toggle-btn"
                onClick={onResetLayout}
                title="Reset Panel Layout to Default"
                id="btn-reset-layout"
              >
                <LayoutGrid size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. SECONDARY CAD VIEWPORT & ASSEMBLY TOOL STRIP          */}
      {/* ======================================================== */}
      <div className="workbench-secondary-bar">
        {/* Left: Transform Mode Gizmo Controls */}
        <div className="secondary-tools-left">
          <div className="sub-tool-group">
            <span className="sub-tool-label">MODE</span>
            <button
              className={`sub-tool-btn ${transformMode === 'translate' && !isWiringMode && !isAssemblyMode ? 'active' : ''}`}
              onClick={() => {
                setIsWiringMode(false);
                setIsAssemblyMode(false);
                setTransformMode('translate');
              }}
              title="Translate Gizmo [W]"
              id="tool-translate-mode"
            >
              <Move size={13} />
              <span>Move</span>
            </button>
            <button
              className={`sub-tool-btn ${transformMode === 'rotate' && !isWiringMode && !isAssemblyMode ? 'active' : ''}`}
              onClick={() => {
                setIsWiringMode(false);
                setIsAssemblyMode(false);
                setTransformMode('rotate');
              }}
              title="Rotate Gizmo [E]"
              id="tool-rotate-mode"
            >
              <RotateCw size={13} />
              <span>Rotate</span>
            </button>
            <button
              className={`sub-tool-btn ${transformMode === 'scale' && !isWiringMode && !isAssemblyMode ? 'active' : ''}`}
              onClick={() => {
                setIsWiringMode(false);
                setIsAssemblyMode(false);
                setTransformMode('scale');
              }}
              title="Scale Gizmo [R]"
              id="tool-scale-mode"
            >
              <Maximize2 size={13} />
              <span>Scale</span>
            </button>
          </div>

          <div className="header-divider-v-sub" />

          {/* Interactive Tools: Wiring & Assembly */}
          <div className="sub-tool-group">
            <button
              className={`sub-tool-btn ${isWiringMode ? 'active-wiring-sub' : ''}`}
              onClick={() => {
                setIsAssemblyMode(false);
                setIsWiringMode(!isWiringMode);
              }}
              title="Toggle Point-to-Point Terminal Wiring"
              id="tool-toggle-wiring"
            >
              <Zap size={13} style={{ color: isWiringMode ? '#38bdf8' : undefined }} />
              <span>{isWiringMode ? 'Wiring: Active' : 'Wire Tool'}</span>
            </button>

            <button
              className={`sub-tool-btn ${isAssemblyMode ? 'active-assembly-sub' : ''}`}
              onClick={() => {
                setIsWiringMode(false);
                setIsAssemblyMode(!isAssemblyMode);
              }}
              title="Toggle Mechanical Assembly & Mount Points"
              id="tool-toggle-assembly"
            >
              <Wrench size={13} style={{ color: isAssemblyMode ? '#38bdf8' : undefined }} />
              <span>{isAssemblyMode ? 'Assemble: Active' : 'Assemble'}</span>
            </button>

            <button
              className={`sub-tool-btn ${isCodePanelOpen ? 'active-code-sub' : ''}`}
              onClick={() => setIsCodePanelOpen(!isCodePanelOpen)}
              title="Toggle Arduino Code Editor & Serial Monitor"
              id="tool-toggle-code-panel"
            >
              <Code size={13} style={{ color: isCodePanelOpen ? '#38bdf8' : undefined }} />
              <span>Code Dock</span>
            </button>
          </div>

          <div className="header-divider-v-sub" />

          {/* Snapping & Grid Options */}
          <div className="sub-tool-group">
            <button
              className={`sub-tool-btn ${snapTranslate ? 'active' : ''}`}
              onClick={() => setSnapTranslate(!snapTranslate)}
              title="Toggle Grid Snapping (0.5 units)"
              id="tool-toggle-snap"
            >
              <Magnet size={13} />
              <span>Snap 0.5u</span>
            </button>
            <button
              className={`sub-tool-btn ${snapRotate ? 'active' : ''}`}
              onClick={() => setSnapRotate(!snapRotate)}
              title="Toggle Angle Snapping (15 degrees)"
              id="tool-toggle-rotate-snap"
            >
              <RotateCw size={13} />
              <span>15°</span>
            </button>
            <button
              className={`sub-tool-btn ${gridVisible ? 'active' : ''}`}
              onClick={() => setGridVisible(!gridVisible)}
              title="Toggle CAD Grid Floor"
              id="tool-toggle-grid"
            >
              {gridVisible ? <Eye size={13} /> : <EyeOff size={13} />}
              <span>Grid</span>
            </button>
          </div>

          {/* Track Environment Dropdown */}
          {onTrackTypeChange && (
            <>
              <div className="header-divider-v-sub" />
              <div className="sub-tool-group">
                <span className="sub-tool-label">TRACK:</span>
                <select
                  className="sub-tool-select"
                  value={trackType}
                  onChange={(e) => onTrackTypeChange(e.target.value as TrackType)}
                  title="Select Floor Track Environment"
                  id="select-track-type"
                >
                  <option value="oval">Oval Course</option>
                  <option value="straight">Straight Track</option>
                  <option value="wavy">Wavy Track</option>
                  <option value="none">Plain Surface</option>
                </select>
              </div>
            </>
          )}

          {/* Camera View Angle Presets */}
          {onCameraPreset && (
            <>
              <div className="header-divider-v-sub" />
              <div className="sub-tool-group">
                <span className="sub-tool-label">VIEW:</span>
                <button 
                  className="sub-tool-btn sub-camera-btn" 
                  onClick={() => onCameraPreset('perspective')}
                  title="3D Perspective Camera"
                >
                  3D
                </button>
                <button 
                  className="sub-tool-btn sub-camera-btn" 
                  onClick={() => onCameraPreset('top')}
                  title="Top 2D Plan View"
                >
                  Top
                </button>
                <button 
                  className="sub-tool-btn sub-camera-btn" 
                  onClick={() => onCameraPreset('front')}
                  title="Front Elevation View"
                >
                  Front
                </button>
                <button 
                  className="sub-tool-btn sub-camera-btn" 
                  onClick={() => onCameraPreset('reset')}
                  title="Reset Camera to Default"
                >
                  <RotateCcw size={11} />
                </button>
              </div>
            </>
          )}
        </div>

        {/* Right: Scene Metric Badges & Live Status */}
        <div className="secondary-tools-right">
          {/* Active Wiring / Assembly Banner if engaged */}
          {isWiringMode && (
            <div className="sub-wiring-banner">
              {activeSourceInfo ? (
                <>
                  <span className="banner-pulse-dot" />
                  <span>From: <strong>{activeSourceInfo.compName} ({activeSourceInfo.termName})</strong> → Click target pin</span>
                  {onCancelWiring && (
                    <button className="sub-banner-cancel" onClick={onCancelWiring} title="Cancel wire">
                      <Unplug size={11} />
                      <span>Cancel</span>
                    </button>
                  )}
                </>
              ) : (
                <span>Click any terminal to start wire route</span>
              )}
            </div>
          )}

          {isAssemblyMode && (
            <div className="sub-assembly-banner">
              <span>🔧 Click mount point to attach parts</span>
            </div>
          )}

          <div className="scene-counts-cluster">
            <span className="scene-count-badge">Parts: <strong>{componentCount}</strong></span>
            <span className="scene-count-badge">Wires: <strong style={{ color: '#38bdf8' }}>{wireCount}</strong></span>
            <span className="scene-count-badge">Joints: <strong style={{ color: '#a855f7' }}>{attachmentCount}</strong></span>
            {selectedName && (
              <span className="scene-selected-badge" title="Selected Component">
                {selectedName}
              </span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
