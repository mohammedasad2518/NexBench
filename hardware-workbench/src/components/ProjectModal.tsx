import React, { useState, useEffect } from 'react';
import {
  X,
  FolderOpen,
  Save,
  Trash2,
  Download,
  Plus,
  Sliders,
  RotateCcw,
  Check,
  AlertCircle,
  Clock,
  Edit2,
  FileText,
  Sparkles
} from 'lucide-react';
import type {
  CalibrationProfile,
  ProjectMetadata,
  ProjectConfig
} from '../utils/projectPersistence';
import {
  getProjectIndex,
  deleteProject,
  loadProject,
  loadAutosave,
  clearAutosave,
  createDefaultCalibration,
  saveCalibrationProfile,
  getCalibrationProfiles,
  deleteCalibrationProfile
} from '../utils/projectPersistence';
import { EXAMPLE_PROJECT_TEMPLATES } from '../utils/exampleProjects';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProjectId: string;
  currentProjectName: string;
  onRenameProject: (newName: string) => void;
  onLoadProjectById: (projectId: string) => void;
  onLoadProjectFromConfig: (config: ProjectConfig) => void;
  onNewProject: (name?: string) => void;
  onSaveCurrentProject: () => void;
  onRestoreAutosave: (project: ProjectConfig) => void;
  activeCalibration: CalibrationProfile;
  onUpdateCalibration: (profile: CalibrationProfile) => void;
}

export const ProjectModal: React.FC<ProjectModalProps> = ({
  isOpen,
  onClose,
  currentProjectId,
  currentProjectName,
  onRenameProject,
  onLoadProjectById,
  onLoadProjectFromConfig,
  onNewProject,
  onSaveCurrentProject,
  onRestoreAutosave,
  activeCalibration,
  onUpdateCalibration,
}) => {
  const [activeTab, setActiveTab] = useState<'projects' | 'templates' | 'calibration'>('projects');
  const [projectList, setProjectList] = useState<ProjectMetadata[]>([]);
  const [autosaveData, setAutosaveData] = useState<{ project: ProjectConfig | null; savedAt?: string }>({ project: null });
  const [isRenaming, setIsRenaming] = useState(false);
  const [nameInput, setNameInput] = useState(currentProjectName);
  const [newProjectInput, setNewProjectInput] = useState('');
  const [showNewInput, setShowNewInput] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Calibration state
  const [calibProfiles, setCalibProfiles] = useState<CalibrationProfile[]>([]);
  const [tempCalib, setTempCalib] = useState<CalibrationProfile>(activeCalibration);
  const [calibNameInput, setCalibNameInput] = useState('');
  const [showSaveCalibAs, setShowSaveCalibAs] = useState(false);

  // Refresh project lists on open
  useEffect(() => {
    if (isOpen) {
      refreshData();
      setNameInput(currentProjectName);
      setTempCalib(activeCalibration);
    }
  }, [isOpen, currentProjectName, activeCalibration]);

  const refreshData = () => {
    setProjectList(getProjectIndex());
    setAutosaveData(loadAutosave());
    setCalibProfiles(getCalibrationProfiles());
  };

  const showStatus = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    setStatusMsg({ text, type });
    setTimeout(() => setStatusMsg(null), 3000);
  };

  const handleRenameSubmit = () => {
    if (nameInput.trim()) {
      onRenameProject(nameInput.trim());
      setIsRenaming(false);
      showStatus(`Project renamed to "${nameInput.trim()}"`, 'success');
      refreshData();
    }
  };

  const handleCreateNew = () => {
    const name = newProjectInput.trim() || 'Untitled Project';
    onNewProject(name);
    setShowNewInput(false);
    setNewProjectInput('');
    showStatus(`Created new project "${name}"`, 'success');
    refreshData();
    onClose();
  };

  const handleDelete = (projectId: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete saved project "${name}"? This cannot be undone.`)) {
      const res = deleteProject(projectId);
      if (res.success) {
        showStatus(`Deleted project "${name}"`, 'info');
        refreshData();
      } else {
        showStatus(res.error || 'Failed to delete project', 'error');
      }
    }
  };

  const handleExportProject = (projectId: string) => {
    const { project, error } = loadProject(projectId);
    if (!project || error) {
      showStatus(error || 'Failed to load project for export', 'error');
      return;
    }
    const jsonStr = JSON.stringify(project, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(project.name || 'project').toLowerCase().replace(/[^a-z0-9_-]/g, '_')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showStatus(`Exported "${project.name}" as JSON`, 'success');
  };

  const handleRestoreAutosaveClick = () => {
    if (autosaveData.project) {
      onRestoreAutosave(autosaveData.project);
      showStatus('Restored autosaved session', 'success');
      onClose();
    }
  };

  const handleClearAutosaveClick = () => {
    clearAutosave();
    setAutosaveData({ project: null });
    showStatus('Autosave cleared', 'info');
  };

  // Calibration handlers
  const handleCalibChange = <K extends keyof CalibrationProfile>(section: K, key: string, value: number) => {
    setTempCalib((prev) => ({
      ...prev,
      [section]: {
        ...(prev[section] as any),
        [key]: value,
      },
    }));
  };

  const handleSaveCalibAs = () => {
    const name = calibNameInput.trim();
    if (!name) return;
    const newProfile: CalibrationProfile = {
      ...tempCalib,
      id: `calib_${Date.now().toString(36)}`,
      name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    saveCalibrationProfile(newProfile);
    onUpdateCalibration(newProfile);
    setShowSaveCalibAs(false);
    setCalibNameInput('');
    setCalibProfiles(getCalibrationProfiles());
    showStatus(`Saved calibration profile "${name}"`, 'success');
  };

  const handleApplyCalibration = () => {
    onUpdateCalibration(tempCalib);
    showStatus('Calibration profile applied', 'success');
    onClose();
  };

  const handleResetCalibrationDefaults = () => {
    const defaults = createDefaultCalibration();
    setTempCalib(defaults);
    onUpdateCalibration(defaults);
    showStatus('Reset calibration to factory defaults', 'info');
  };

  const handleSelectSavedProfile = (profile: CalibrationProfile) => {
    setTempCalib(profile);
    onUpdateCalibration(profile);
    showStatus(`Switched to profile "${profile.name}"`, 'success');
  };

  const handleDeleteSavedProfile = (profileId: string, name: string) => {
    if (window.confirm(`Delete calibration profile "${name}"?`)) {
      deleteCalibrationProfile(profileId);
      setCalibProfiles(getCalibrationProfiles());
      showStatus(`Deleted calibration profile "${name}"`, 'info');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="project-modal-backdrop" onClick={onClose}>
      <div className="project-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="project-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FolderOpen size={18} style={{ color: '#38bdf8' }} />
            <h2 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-main)', margin: 0 }}>
              Project Persistence & Calibration Studio
            </h2>
          </div>
          <button className="project-modal-close-btn" onClick={onClose} title="Close">
            <X size={16} />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="project-modal-tabs">
          <button
            className={`project-tab-btn ${activeTab === 'projects' ? 'active' : ''}`}
            onClick={() => setActiveTab('projects')}
          >
            <FileText size={14} />
            <span>Saved Projects</span>
            {projectList.length > 0 && <span className="tab-badge">{projectList.length}</span>}
          </button>
          <button
            className={`project-tab-btn ${activeTab === 'templates' ? 'active' : ''}`}
            onClick={() => setActiveTab('templates')}
          >
            <Sparkles size={14} />
            <span>Starter Templates</span>
            <span className="tab-badge" style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
              {EXAMPLE_PROJECT_TEMPLATES.length}
            </span>
          </button>
          <button
            className={`project-tab-btn ${activeTab === 'calibration' ? 'active' : ''}`}
            onClick={() => setActiveTab('calibration')}
          >
            <Sliders size={14} />
            <span>Calibration Profiles</span>
          </button>
        </div>

        {/* Status Toast */}
        {statusMsg && (
          <div className={`project-status-toast status-${statusMsg.type}`}>
            {statusMsg.type === 'success' && <Check size={14} />}
            {statusMsg.type === 'error' && <AlertCircle size={14} />}
            {statusMsg.type === 'info' && <Clock size={14} />}
            <span>{statusMsg.text}</span>
          </div>
        )}

        {/* TAB 1: Projects Management */}
        {activeTab === 'projects' && (
          <div className="project-modal-body">
            {/* Active Project Banner */}
            <div className="active-project-bar">
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>CURRENT WORKBENCH PROJECT</span>
                {isRenaming ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                    <input
                      type="text"
                      className="project-rename-input"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleRenameSubmit()}
                      autoFocus
                    />
                    <button className="modal-btn-primary small" onClick={handleRenameSubmit}>
                      Save
                    </button>
                    <button className="modal-btn-ghost small" onClick={() => setIsRenaming(false)}>
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                    <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-main)' }}>
                      {currentProjectName || 'Untitled Project'}
                    </span>
                    <button
                      className="modal-icon-btn"
                      onClick={() => {
                        setNameInput(currentProjectName);
                        setIsRenaming(true);
                      }}
                      title="Rename Project"
                    >
                      <Edit2 size={13} />
                    </button>
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  className="modal-btn-primary"
                  onClick={() => {
                    onSaveCurrentProject();
                    showStatus('Current project state saved to storage!', 'success');
                    refreshData();
                  }}
                  title="Save current scene to local storage"
                >
                  <Save size={13} />
                  <span>Save Project</span>
                </button>
                <button
                  className="modal-btn-secondary"
                  onClick={() => setShowNewInput(true)}
                  title="Create a new project"
                >
                  <Plus size={13} />
                  <span>New Project</span>
                </button>
              </div>
            </div>

            {/* New Project Input dialog */}
            {showNewInput && (
              <div className="new-project-prompt">
                <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-main)' }}>
                  Create New Robot Project
                </span>
                <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                  <input
                    type="text"
                    placeholder="Enter project name..."
                    value={newProjectInput}
                    onChange={(e) => setNewProjectInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateNew()}
                    autoFocus
                    style={{ flex: 1 }}
                  />
                  <button className="modal-btn-primary small" onClick={handleCreateNew}>
                    Create
                  </button>
                  <button className="modal-btn-ghost small" onClick={() => setShowNewInput(false)}>
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Autosave Recovery Banner */}
            {autosaveData.project && (
              <div className="autosave-recovery-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Clock size={16} style={{ color: '#f59e0b' }} />
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#f59e0b' }}>
                      Autosaved Session Available
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      From {new Date(autosaveData.savedAt || '').toLocaleString()} • {autosaveData.project.components.length} components
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button className="modal-btn-warning small" onClick={handleRestoreAutosaveClick}>
                    Restore Autosave
                  </button>
                  <button className="modal-btn-ghost small" onClick={handleClearAutosaveClick}>
                    Dismiss
                  </button>
                </div>
              </div>
            )}

            {/* Saved Projects List */}
            <div className="project-list-section">
              <div className="section-label" style={{ marginBottom: '8px' }}>
                LOCAL SAVED PROJECTS ({projectList.length})
              </div>
              {projectList.length === 0 ? (
                <div className="project-empty-state">
                  <FolderOpen size={32} style={{ opacity: 0.3, marginBottom: '8px' }} />
                  <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>
                    No saved projects yet.
                  </p>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Click "Save Project" above or in the top navigation bar to store your work.
                  </span>
                </div>
              ) : (
                <div className="project-grid">
                  {projectList.map((p) => {
                    const isCurrent = p.projectId === currentProjectId;
                    return (
                      <div key={p.projectId} className={`project-item-card ${isCurrent ? 'current' : ''}`}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>
                                {p.name}
                              </span>
                              {isCurrent && <span className="current-badge">Active</span>}
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                              Updated {new Date(p.updatedAt).toLocaleDateString()} {new Date(p.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                          <span className="track-type-badge">{p.trackType || 'oval'} track</span>
                        </div>

                        <div className="project-stats-row">
                          <span>Parts: <strong>{p.componentCount}</strong></span>
                          <span>•</span>
                          <span>Wires: <strong>{p.wireCount}</strong></span>
                          <span>•</span>
                          <span>Joints: <strong>{p.attachmentCount}</strong></span>
                          {p.hasCalibration && (
                            <>
                              <span>•</span>
                              <span style={{ color: '#10b981' }}>Calibrated</span>
                            </>
                          )}
                        </div>

                        <div className="project-card-actions">
                          <button
                            className="modal-btn-secondary small"
                            onClick={() => {
                              onLoadProjectById(p.projectId);
                              showStatus(`Loaded project "${p.name}"`, 'success');
                              onClose();
                            }}
                            title="Load and switch to this project"
                          >
                            <FolderOpen size={12} />
                            <span>Open</span>
                          </button>
                          <button
                            className="modal-icon-btn"
                            onClick={() => handleExportProject(p.projectId)}
                            title="Download project as JSON"
                          >
                            <Download size={13} />
                          </button>
                          <button
                            className="modal-icon-btn delete"
                            onClick={() => handleDelete(p.projectId, p.name)}
                            title="Delete project"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: Starter Templates & Example Robots (Phase 10) */}
        {activeTab === 'templates' && (
          <div className="project-modal-body">
            <div style={{ marginBottom: '14px' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>
                Production-Ready Demonstration Robots
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Select a pre-assembled, fully-wired example project to launch instantly with dedicated presets and calibrated tracks.
              </span>
            </div>

            <div className="project-grid">
              {EXAMPLE_PROJECT_TEMPLATES.map((tmpl) => (
                <div key={tmpl.id} className="project-item-card template-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)' }}>
                          {tmpl.title}
                        </span>
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {tmpl.subtitle}
                      </div>
                    </div>
                    <span 
                      className="track-type-badge" 
                      style={{ 
                        backgroundColor: `${tmpl.badgeColor}22`, 
                        color: tmpl.badgeColor, 
                        border: `1px solid ${tmpl.badgeColor}44`,
                        fontWeight: 600
                      }}
                    >
                      {tmpl.thumbnailBadge}
                    </span>
                  </div>

                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '4px 0', lineHeight: 1.4 }}>
                    {tmpl.description}
                  </p>

                  <div className="project-stats-row">
                    <span>Parts: <strong>{tmpl.config.components.length}</strong></span>
                    <span>•</span>
                    <span>Wires: <strong>{tmpl.config.wires?.length || 0}</strong></span>
                    <span>•</span>
                    <span>Joints: <strong>{tmpl.config.attachments?.length || 0}</strong></span>
                    <span>•</span>
                    <span>Track: <strong style={{ textTransform: 'capitalize' }}>{tmpl.config.trackType || 'none'}</strong></span>
                  </div>

                  <div className="project-card-actions">
                    <button
                      className="modal-btn-primary small"
                      onClick={() => {
                        onLoadProjectFromConfig(tmpl.config);
                        showStatus(`Loaded template "${tmpl.title}"`, 'success');
                        onClose();
                      }}
                      title="Load and start with this robot template"
                    >
                      <Sparkles size={12} />
                      <span>Launch Template</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: Calibration Profiles Management */}
        {activeTab === 'calibration' && (
          <div className="project-modal-body">
            <div className="calibration-top-bar">
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>ACTIVE CALIBRATION PROFILE</span>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)', marginTop: '2px' }}>
                  {tempCalib.name}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  className="modal-btn-secondary small"
                  onClick={() => setShowSaveCalibAs(!showSaveCalibAs)}
                  title="Save current parameters as a named profile"
                >
                  <Save size={12} />
                  <span>Save As New...</span>
                </button>
                <button
                  className="modal-btn-ghost small"
                  onClick={handleResetCalibrationDefaults}
                  title="Reset all values to system defaults"
                >
                  <RotateCcw size={12} />
                  <span>Reset Defaults</span>
                </button>
              </div>
            </div>

            {/* Save Profile As Sub-form */}
            {showSaveCalibAs && (
              <div className="new-project-prompt" style={{ marginBottom: '12px' }}>
                <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-main)' }}>
                  Save Named Calibration Profile
                </span>
                <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                  <input
                    type="text"
                    placeholder="e.g. High-Speed PID, Glossy Surface..."
                    value={calibNameInput}
                    onChange={(e) => setCalibNameInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveCalibAs()}
                    autoFocus
                    style={{ flex: 1 }}
                  />
                  <button className="modal-btn-primary small" onClick={handleSaveCalibAs}>
                    Save
                  </button>
                  <button className="modal-btn-ghost small" onClick={() => setShowSaveCalibAs(false)}>
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Saved Profiles Quick Select */}
            {calibProfiles.length > 0 && (
              <div style={{ marginBottom: '14px' }}>
                <span className="section-label" style={{ display: 'block', marginBottom: '6px' }}>
                  SAVED PROFILES ({calibProfiles.length})
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {calibProfiles.map((cp) => (
                    <div key={cp.id} className={`calib-pill ${tempCalib.id === cp.id ? 'active' : ''}`}>
                      <span onClick={() => handleSelectSavedProfile(cp)} style={{ cursor: 'pointer' }}>
                        {cp.name}
                      </span>
                      <button
                        className="calib-pill-del"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSavedProfile(cp.id, cp.name);
                        }}
                        title="Delete profile"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tuning Sections */}
            <div className="calib-sections-grid">
              {/* Ultrasonic Sonar Sensor */}
              <div className="calib-section-card">
                <div className="calib-section-title">
                  <span>📡 Ultrasonic Sonar (HC-SR04)</span>
                </div>
                <div className="calib-field">
                  <label>Max Range (cm): <strong>{tempCalib.ultrasonic.maxRangeCm}</strong></label>
                  <input
                    type="range"
                    min="100"
                    max="500"
                    step="10"
                    value={tempCalib.ultrasonic.maxRangeCm}
                    onChange={(e) => handleCalibChange('ultrasonic', 'maxRangeCm', Number(e.target.value))}
                  />
                </div>
                <div className="calib-field">
                  <label>Braking Threshold (cm): <strong>{tempCalib.ultrasonic.brakingThresholdCm}</strong></label>
                  <input
                    type="range"
                    min="10"
                    max="80"
                    step="1"
                    value={tempCalib.ultrasonic.brakingThresholdCm}
                    onChange={(e) => handleCalibChange('ultrasonic', 'brakingThresholdCm', Number(e.target.value))}
                  />
                </div>
                <div className="calib-field">
                  <label>Cone Half-Angle (deg): <strong>{tempCalib.ultrasonic.coneAngleDeg}°</strong></label>
                  <input
                    type="range"
                    min="5"
                    max="30"
                    step="1"
                    value={tempCalib.ultrasonic.coneAngleDeg}
                    onChange={(e) => handleCalibChange('ultrasonic', 'coneAngleDeg', Number(e.target.value))}
                  />
                </div>
              </div>

              {/* TCRT5000 IR Reflectance Sensor */}
              <div className="calib-section-card">
                <div className="calib-section-title">
                  <span>⚫ TCRT5000 IR Line Sensor</span>
                </div>
                <div className="calib-field">
                  <label>DO ADC Threshold: <strong>{tempCalib.lineSensor.doThreshold}</strong></label>
                  <input
                    type="range"
                    min="200"
                    max="800"
                    step="10"
                    value={tempCalib.lineSensor.doThreshold}
                    onChange={(e) => handleCalibChange('lineSensor', 'doThreshold', Number(e.target.value))}
                  />
                </div>
                <div className="calib-field">
                  <label>Black Reflectance: <strong>{(tempCalib.lineSensor.blackReflectance * 100).toFixed(0)}%</strong></label>
                  <input
                    type="range"
                    min="0.05"
                    max="0.30"
                    step="0.01"
                    value={tempCalib.lineSensor.blackReflectance}
                    onChange={(e) => handleCalibChange('lineSensor', 'blackReflectance', Number(e.target.value))}
                  />
                </div>
                <div className="calib-field">
                  <label>Track Line Width: <strong>{tempCalib.lineSensor.trackLineWidth}m</strong></label>
                  <input
                    type="range"
                    min="0.4"
                    max="1.5"
                    step="0.05"
                    value={tempCalib.lineSensor.trackLineWidth}
                    onChange={(e) => handleCalibChange('lineSensor', 'trackLineWidth', Number(e.target.value))}
                  />
                </div>
              </div>

              {/* Wheel Encoders & Kinematics */}
              <div className="calib-section-card">
                <div className="calib-section-title">
                  <span>⚙️ Wheel Encoders & Geometry</span>
                </div>
                <div className="calib-field">
                  <label>Slots per Revolution: <strong>{tempCalib.wheelEncoder.slotsPerRevolution}</strong></label>
                  <input
                    type="range"
                    min="10"
                    max="40"
                    step="1"
                    value={tempCalib.wheelEncoder.slotsPerRevolution}
                    onChange={(e) => handleCalibChange('wheelEncoder', 'slotsPerRevolution', Number(e.target.value))}
                  />
                </div>
                <div className="calib-field">
                  <label>Wheel Diameter: <strong>{tempCalib.wheelEncoder.wheelDiameter}m</strong></label>
                  <input
                    type="range"
                    min="0.5"
                    max="1.5"
                    step="0.05"
                    value={tempCalib.wheelEncoder.wheelDiameter}
                    onChange={(e) => handleCalibChange('wheelEncoder', 'wheelDiameter', Number(e.target.value))}
                  />
                </div>
                <div className="calib-field">
                  <label>Wheel Base (Width): <strong>{tempCalib.wheelEncoder.wheelBase}m</strong></label>
                  <input
                    type="range"
                    min="1.5"
                    max="4.0"
                    step="0.1"
                    value={tempCalib.wheelEncoder.wheelBase}
                    onChange={(e) => handleCalibChange('wheelEncoder', 'wheelBase', Number(e.target.value))}
                  />
                </div>
              </div>

              {/* Motor & Driving */}
              <div className="calib-section-card">
                <div className="calib-section-title">
                  <span>🏎️ DC Motor Drive & Trimming</span>
                </div>
                <div className="calib-field">
                  <label>Base Speed PWM: <strong>{tempCalib.motor.baseSpeedPwm}</strong></label>
                  <input
                    type="range"
                    min="100"
                    max="255"
                    step="5"
                    value={tempCalib.motor.baseSpeedPwm}
                    onChange={(e) => handleCalibChange('motor', 'baseSpeedPwm', Number(e.target.value))}
                  />
                </div>
                <div className="calib-field">
                  <label>Max Speed PWM: <strong>{tempCalib.motor.maxPwm}</strong></label>
                  <input
                    type="range"
                    min="150"
                    max="255"
                    step="5"
                    value={tempCalib.motor.maxPwm}
                    onChange={(e) => handleCalibChange('motor', 'maxPwm', Number(e.target.value))}
                  />
                </div>
                <div className="calib-field">
                  <label>Speed Scaling Factor: <strong>{tempCalib.motor.speedScaleFactor}x</strong></label>
                  <input
                    type="range"
                    min="1.0"
                    max="6.0"
                    step="0.2"
                    value={tempCalib.motor.speedScaleFactor}
                    onChange={(e) => handleCalibChange('motor', 'speedScaleFactor', Number(e.target.value))}
                  />
                </div>
              </div>
            </div>

            {/* Bottom Actions for Calibration */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
              <button className="modal-btn-ghost" onClick={onClose}>
                Cancel
              </button>
              <button className="modal-btn-primary" onClick={handleApplyCalibration}>
                <Check size={14} />
                <span>Apply & Save Profile</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
