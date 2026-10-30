import React, { useState, useEffect } from 'react';
import { 
  Cpu, 
  Layers, 
  Zap, 
  RotateCw, 
  Play, 
  Radio, 
  ArrowRight, 
  Gauge, 
  FileCode, 
  Terminal, 
  Activity,
  ShieldCheck,
  X
} from 'lucide-react';
import { HeroScene3D } from './HeroScene3D';
import { EXAMPLE_PROJECT_TEMPLATES } from '../utils/exampleProjects';
import type { ProjectConfig } from '../utils/projectPersistence';

interface LandingPageProps {
  onOpenWorkbench: () => void;
  onLaunchTemplate: (config: ProjectConfig) => void;
  savedProjectCount: number;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onOpenWorkbench,
  onLaunchTemplate,
  savedProjectCount,
}) => {
  // Announcement strip dismissal state (persisted)
  const [showAnnouncement, setShowAnnouncement] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hw_announcement_dismissed_v5') !== 'true';
    } catch {
      return true;
    }
  });

  const dismissAnnouncement = () => {
    setShowAnnouncement(false);
    try {
      localStorage.setItem('hw_announcement_dismissed_v5', 'true');
    } catch {
      // ignore
    }
  };

  // Sticky navbar blurred on scroll
  const [isScrolled, setIsScrolled] = useState(false);
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Category filtering for Section 2 (Project Discovery)
  const [selectedCategory, setSelectedCategory] = useState<'All' | 'Robotics' | 'Electronics' | 'Sensors'>('All');
  const [activeTemplateId, setActiveTemplateId] = useState<string>(EXAMPLE_PROJECT_TEMPLATES[0].id);

  const filteredTemplates = EXAMPLE_PROJECT_TEMPLATES.filter((tmpl) => {
    if (selectedCategory === 'All') return true;
    if (selectedCategory === 'Robotics') return tmpl.id.includes('rover');
    if (selectedCategory === 'Sensors') return tmpl.id.includes('radar') || tmpl.id.includes('follower');
    if (selectedCategory === 'Electronics') return tmpl.id.includes('odometry') || tmpl.id.includes('radar');
    return true;
  });

  const activeTemplate = EXAMPLE_PROJECT_TEMPLATES.find((t) => t.id === activeTemplateId) || EXAMPLE_PROJECT_TEMPLATES[0];

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="landing-page-root">
      {/* 1. Slim Dismissible Top Announcement Strip */}
      {showAnnouncement && (
        <aside className="announcement-strip" role="region" aria-label="Announcement">
          <div className="announcement-inner">
            <span className="announcement-badge">NEW</span>
            <span className="announcement-text">
              Hardware Workbench 5.0 is live with closed-loop PID line-following and optical odometry.
            </span>
            <button 
              className="announcement-link" 
              onClick={() => scrollToSection('projects')}
            >
              Explore verified starter templates →
            </button>
            <button 
              className="announcement-close" 
              onClick={dismissAnnouncement}
              title="Dismiss announcement"
              aria-label="Dismiss announcement"
            >
              <X size={14} />
            </button>
          </div>
        </aside>
      )}

      {/* 2. Professional Compact Navigation Bar */}
      <header className={`landing-nav-bar ${isScrolled ? 'scrolled' : ''}`}>
        <div className="landing-nav-inner">
          <div className="landing-brand-group" onClick={() => scrollToSection('hero')}>
            <div className="brand-logo-mark">
              <Cpu size={20} className="logo-icon-svg" />
            </div>
            <div className="brand-text-block">
              <span className="brand-title">HARDWARE WORKBENCH</span>
              <span className="brand-sub">Robotics & Electronics CAD</span>
            </div>
          </div>

          <nav className="nav-links-menu" aria-label="Main Navigation">
            <button className="nav-menu-item" onClick={() => scrollToSection('hero')}>
              Product
            </button>
            <button className="nav-menu-item" onClick={() => scrollToSection('projects')}>
              Projects
            </button>
            <button className="nav-menu-item" onClick={() => scrollToSection('features')}>
              Features
            </button>
            <button className="nav-menu-item" onClick={() => scrollToSection('workflow')}>
              Workflow
            </button>
            <button className="nav-menu-item" onClick={() => scrollToSection('docs')}>
              Documentation
            </button>
          </nav>

          <div className="nav-actions-group">
            <button 
              className="btn-teal-primary" 
              onClick={onOpenWorkbench}
              id="nav-start-building-btn"
            >
              <span>Start Building</span>
              <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </header>

      {/* 3. Section 1 — Cinematic Hero (Screenshot 1 Target) */}
      <section className="cinematic-hero-section" id="hero">
        <div className="hero-grid-background" />

        <div className="hero-content-container">
          {/* Left Column: Oversized Typography & CTAs */}
          <div className="hero-left-column">
            <div className="hero-tag-badge">
              <span className="live-dot" />
              <span>BROWSER-BASED ROBOTICS & ELECTRONICS</span>
            </div>

            <h1 className="hero-giant-headline">
              Build it.<br />
              Wire it.<br />
              <span className="text-gradient-cyan">Bring it to life.</span>
            </h1>

            <p className="hero-lead-description">
              Design electronics, connect virtual components, write Arduino-style code,
              and simulate robotic systems in an interactive 3D workbench.
            </p>

            <div className="hero-cta-actions">
              <button 
                className="btn-hero-teal" 
                onClick={onOpenWorkbench}
                id="hero-start-building-cta"
              >
                <span>Start Building</span>
                <ArrowRight size={16} />
              </button>
              <button 
                className="btn-hero-outlined" 
                onClick={() => scrollToSection('projects')}
                id="hero-explore-projects-cta"
              >
                <span>Explore Projects</span>
              </button>
            </div>

            {/* Quick Metrics */}
            <div className="hero-metrics-strip">
              <div className="metric-cell">
                <span className="metric-number">11+</span>
                <span className="metric-label">3D Components</span>
              </div>
              <div className="metric-divider" />
              <div className="metric-cell">
                <span className="metric-number">60 FPS</span>
                <span className="metric-label">Kinematics</span>
              </div>
              <div className="metric-divider" />
              <div className="metric-cell">
                <span className="metric-number">100%</span>
                <span className="metric-label">Safe AST C++</span>
              </div>
              {savedProjectCount > 0 && (
                <>
                  <div className="metric-divider" />
                  <div className="metric-cell">
                    <span className="metric-number">{savedProjectCount}</span>
                    <span className="metric-label">Saved Projects</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Right Column: Live 3D Electronics Scene */}
          <div className="hero-right-column">
            <div className="hero-scene-frame">
              <HeroScene3D />
              <div className="scene-overlay-tags">
                <span className="overlay-tag"><Cpu size={12} /> Arduino Uno R3</span>
                <span className="overlay-tag"><Radio size={12} /> HC-SR04 Sonar</span>
                <span className="overlay-tag"><Zap size={12} /> Live Jumper Netlist</span>
              </div>
            </div>
          </div>
        </div>

        {/* Hero Bottom: Horizontal Capability Workflow Strip */}
        <div className="hero-capability-strip">
          <div className="capability-pill">
            <Layers size={15} className="cap-icon" />
            <span>3D Assembly</span>
          </div>
          <div className="capability-pill">
            <Zap size={15} className="cap-icon" />
            <span>Pin-to-Pin Wiring</span>
          </div>
          <div className="capability-pill">
            <FileCode size={15} className="cap-icon" />
            <span>Arduino C++ AST</span>
          </div>
          <div className="capability-pill">
            <RotateCw size={15} className="cap-icon" />
            <span>Robot Kinematics</span>
          </div>
          <div className="capability-pill">
            <Radio size={15} className="cap-icon" />
            <span>Ultrasonic Radar</span>
          </div>
          <div className="capability-pill">
            <Gauge size={15} className="cap-icon" />
            <span>Closed-Loop PID</span>
          </div>
        </div>
      </section>

      {/* 4. Section 2 — Start from a Project (Screenshot 2 Target: Light Section) */}
      <section className="light-projects-section" id="projects">
        <div className="projects-section-container">
          {/* Left Column: Heading, Category Filters, and Featured Project Card */}
          <div className="projects-left-column">
            <div className="section-label-light">PROJECT DISCOVERY</div>
            <h2 className="projects-editorial-title">Start with a project</h2>
            <p className="projects-editorial-sub">
              Open any pre-wired robotics template to test immediately or customize in the
              3D workbench. All components, circuits, and sketches are included.
            </p>

            {/* Category Filter Pills */}
            <div className="category-filter-pills" role="tablist" aria-label="Project Categories">
              {(['All', 'Robotics', 'Electronics', 'Sensors'] as const).map((cat) => (
                <button
                  key={cat}
                  role="tab"
                  aria-selected={selectedCategory === cat}
                  className={`category-pill ${selectedCategory === cat ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Featured Project Showcase Card */}
            <div className="featured-project-card">
              <div className="featured-card-header">
                <span className="featured-tag">FEATURED BLUEPRINT</span>
                <span className="featured-difficulty-badge">{activeTemplate.thumbnailBadge}</span>
              </div>

              <div className="featured-card-visual">
                <div className="featured-visual-icon">
                  {activeTemplate.id.includes('follower') ? (
                    <Gauge size={48} style={{ color: '#0ea5e9' }} />
                  ) : activeTemplate.id.includes('radar') ? (
                    <Radio size={48} style={{ color: '#0ea5e9' }} />
                  ) : (
                    <RotateCw size={48} style={{ color: '#0ea5e9' }} />
                  )}
                </div>
                <div className="featured-visual-details">
                  <h3 className="featured-project-title">{activeTemplate.title}</h3>
                  <p className="featured-project-desc">{activeTemplate.description}</p>
                </div>
              </div>

              <div className="featured-specs-row">
                <div className="spec-item">
                  <span className="spec-val">{activeTemplate.config.components.length}</span>
                  <span className="spec-lbl">Parts</span>
                </div>
                <div className="spec-item">
                  <span className="spec-val">{activeTemplate.config.wires?.length || 0}</span>
                  <span className="spec-lbl">Wires</span>
                </div>
                <div className="spec-item">
                  <span className="spec-val">Arduino Uno</span>
                  <span className="spec-lbl">Controller</span>
                </div>
              </div>

              <button 
                className="btn-featured-launch"
                onClick={() => onLaunchTemplate(activeTemplate.config)}
                id={`launch-featured-${activeTemplate.id}`}
              >
                <span>Launch in Workbench</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>

          {/* Right Column: Structured Project List */}
          <div className="projects-right-column">
            <div className="projects-list-header">
              <span>AVAILABLE BLUEPRINTS ({filteredTemplates.length})</span>
            </div>

            <div className="projects-list-grid">
              {filteredTemplates.map((tmpl) => {
                const isSelected = tmpl.id === activeTemplateId;
                return (
                  <div 
                    key={tmpl.id}
                    className={`project-row-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => setActiveTemplateId(tmpl.id)}
                  >
                    <div className="row-card-icon-box">
                      {tmpl.id.includes('follower') ? (
                        <Gauge size={22} />
                      ) : tmpl.id.includes('radar') ? (
                        <Radio size={22} />
                      ) : (
                        <RotateCw size={22} />
                      )}
                    </div>

                    <div className="row-card-content">
                      <div className="row-card-title-row">
                        <h4 className="row-card-title">{tmpl.title}</h4>
                        <span className="row-difficulty-tag">{tmpl.thumbnailBadge}</span>
                      </div>
                      <p className="row-card-desc">{tmpl.description}</p>

                      <div className="row-card-meta">
                        <span className="meta-chip">Arduino Uno R3</span>
                        <span className="meta-chip">{tmpl.config.components.length} Components</span>
                        <span className="meta-chip">{tmpl.config.wires?.length || 0} Wires</span>
                      </div>
                    </div>

                    <div className="row-card-action">
                      <button 
                        className="btn-row-open"
                        onClick={(e) => {
                          e.stopPropagation();
                          onLaunchTemplate(tmpl.config);
                        }}
                        title={`Open ${tmpl.title}`}
                        id={`launch-row-${tmpl.id}`}
                      >
                        <Play size={14} />
                        <span>Open</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* 5. Section 3 — Product Features (Screenshot 3 Target: Dark Technical Storytelling) */}
      <section className="dark-features-section" id="features">
        <div className="features-section-container">
          <div className="features-editorial-header">
            <div className="features-left-headline">
              <span className="features-kicker">ENGINEERING CAPABILITIES</span>
              <h2 className="features-main-title">
                Engineered for real hardware simulation.
              </h2>
            </div>
            <div className="features-right-copy">
              <p className="features-lead-text">
                Everything in Hardware Workbench operates with physical realism: terminal connectivity,
                safe deterministic AST code execution, optical odometry interrupts, and conical raycasting.
              </p>
            </div>
          </div>

          {/* Substantial Workbench Application Preview Showcase */}
          <div className="workbench-preview-showcase">
            <div className="preview-cad-header">
              <div className="cad-window-controls">
                <span className="w-ctrl red" />
                <span className="w-ctrl yellow" />
                <span className="w-ctrl green" />
              </div>
              <div className="cad-project-name">
                <FileCode size={13} style={{ color: '#0ea5e9' }} />
                <span>PID Line Follower Rover • 3D Engineering Workbench</span>
              </div>
              <div className="cad-runtime-badge">
                <span className="live-pulse-dot" />
                <span>60 FPS DETERMINISTIC SIMULATION</span>
              </div>
            </div>

            {/* Viewport Frame with Simulated Multi-Panel UI */}
            <div className="cad-ui-mockup-frame">
              {/* Top Viewport Secondary Strip Mock */}
              <div className="mock-viewport-strip">
                <div className="strip-left-items">
                  <span className="strip-item active">Translate [W]</span>
                  <span className="strip-item">Rotate [E]</span>
                  <span className="strip-item">Grid: 0.5u</span>
                  <span className="strip-item">Track: Oval Loop</span>
                </div>
                <div className="strip-right-items">
                  <span className="strip-item">Perspective</span>
                  <span className="strip-item">Top [Y]</span>
                  <span className="strip-item">Front [Z]</span>
                </div>
              </div>

              {/* Center Canvas Area with Telemetry HUD */}
              <div className="mock-scene-center">
                <div className="mock-grid-pattern" />
                <div className="mock-hud-overlay">
                  <div className="hud-title"><Activity size={12} /> Telemetry HUD</div>
                  <div className="hud-metric-row">Pose: <strong>(0.00, 1.45)</strong> | Speed: <strong style={{ color: '#10b981' }}>22.4 cm/s</strong></div>
                  <div className="hud-metric-row">Left IR: <strong style={{ color: '#ef4444' }}>● BLACK</strong> | Right IR: <strong style={{ color: '#10b981' }}>○ WHITE</strong></div>
                  <div className="hud-metric-row">Sonar: <strong style={{ color: '#38bdf8' }}>68 cm</strong> | Ticks: <strong style={{ color: '#a78bfa' }}>L:42 R:42</strong></div>
                </div>

                {/* Bottom Dock Mock */}
                <div className="mock-dock-bar">
                  <div className="mock-dock-tabs">
                    <span className="dock-tab-btn active"><Terminal size={12} /> Arduino Code: line_follower.ino</span>
                    <span className="dock-tab-btn"><Activity size={12} /> Serial Monitor</span>
                    <span className="dock-tab-btn"><ShieldCheck size={12} /> Circuit Diagnostics: Clean</span>
                  </div>
                  <div className="mock-dock-code">
                    <code>float error = sensorLeft - sensorRight;</code>
                    <code>float correction = (Kp * error) + (Kd * derivative);</code>
                    <code>analogWrite(PIN_LEFT, constrain(baseSpeed + correction, 0, 255));</code>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Structured 6-Pillar Feature Grid */}
          <div className="features-structured-grid">
            <div className="feature-grid-card">
              <div className="feature-card-icon" style={{ color: '#0ea5e9' }}>
                <Layers size={22} />
              </div>
              <h3 className="feature-card-title">3D Spatial Assembly</h3>
              <p className="feature-card-text">
                Modular 2WD chassis with mounting points, wheel axles, servo steering towers,
                and forward sensor arrays with full hierarchical transform propagation.
              </p>
            </div>

            <div className="feature-grid-card">
              <div className="feature-card-icon" style={{ color: '#10b981' }}>
                <Zap size={22} />
              </div>
              <h3 className="feature-card-title">Virtual Circuit Wiring</h3>
              <p className="feature-card-text">
                Point-and-click terminal wiring with auto-routing jumpers. Live netlist continuity
                checks detect open circuits, missing grounds, and invalid pin allocations.
              </p>
            </div>

            <div className="feature-grid-card">
              <div className="feature-card-icon" style={{ color: '#f59e0b' }}>
                <FileCode size={22} />
              </div>
              <h3 className="feature-card-title">Safe Arduino C++ AST</h3>
              <p className="feature-card-text">
                In-browser AST interpreter executes setup() and loop() with millis(), hardware
                external interrupts (INT0/INT1), PWM analogWrite, and Servo.h library support.
              </p>
            </div>

            <div className="feature-grid-card">
              <div className="feature-card-icon" style={{ color: '#8b5cf6' }}>
                <RotateCw size={22} />
              </div>
              <h3 className="feature-card-title">Kinematics & Odometry</h3>
              <p className="feature-card-text">
                Sub-stepped differential-drive kinematics, 20-slot optical wheel encoders,
                and dead-reckoning odometry calculate distance and heading at 60 FPS.
              </p>
            </div>

            <div className="feature-grid-card">
              <div className="feature-card-icon" style={{ color: '#38bdf8' }}>
                <Radio size={22} />
              </div>
              <h3 className="feature-card-title">Conical Radar Raycasting</h3>
              <p className="feature-card-text">
                Realistic HC-SR04 ultrasonic multi-ray conical sensing detects obstacles,
                measures distances, and supports 180° servo radar scanning.
              </p>
            </div>

            <div className="feature-grid-card">
              <div className="feature-card-icon" style={{ color: '#ec4899' }}>
                <Gauge size={22} />
              </div>
              <h3 className="feature-card-title">PID Line Following</h3>
              <p className="feature-card-text">
                Dual TCRT5000 IR reflectance sensors sample mathematical floor track surfaces
                with proportional, integral, and derivative steering correction.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Section 4 — How It Works (Workflow Strip) */}
      <section className="workflow-section" id="workflow">
        <div className="workflow-container">
          <div className="workflow-header-block">
            <span className="workflow-kicker">ENGINEERING WORKFLOW</span>
            <h2 className="workflow-title">From Concept to Simulation in Six Steps</h2>
          </div>

          <div className="workflow-steps-strip">
            <div className="workflow-step-item">
              <div className="step-num">01</div>
              <div className="step-content">
                <h4 className="step-title">Build</h4>
                <p className="step-desc">Assemble chassis, motors, wheels, and sensors in the 3D viewport.</p>
              </div>
            </div>

            <div className="workflow-step-item">
              <div className="step-num">02</div>
              <div className="step-content">
                <h4 className="step-title">Wire</h4>
                <p className="step-desc">Connect terminals to Arduino pins with color-coded virtual jumpers.</p>
              </div>
            </div>

            <div className="workflow-step-item">
              <div className="step-num">03</div>
              <div className="step-content">
                <h4 className="step-title">Code</h4>
                <p className="step-desc">Write Arduino C++ sketches or load verified presets in the editor.</p>
              </div>
            </div>

            <div className="workflow-step-item">
              <div className="step-num">04</div>
              <div className="step-content">
                <h4 className="step-title">Simulate</h4>
                <p className="step-desc">Run the AST engine to drive motors, servos, and LEDs at 60 FPS.</p>
              </div>
            </div>

            <div className="workflow-step-item">
              <div className="step-num">05</div>
              <div className="step-content">
                <h4 className="step-title">Design</h4>
                <p className="step-desc">Fine-tune PID constants, gear ratios, and obstacle configurations.</p>
              </div>
            </div>

            <div className="workflow-step-item">
              <div className="step-num">06</div>
              <div className="step-content">
                <h4 className="step-title">Test</h4>
                <p className="step-desc">Inspect high-speed serial telemetry, line tracking, and odometry.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Section 5 — Final CTA & Technical Footer */}
      <section className="final-cta-section" id="docs">
        <div className="final-cta-container">
          <div className="final-cta-card">
            <div className="cta-icon-badge">
              <Cpu size={32} />
            </div>
            <h2 className="cta-heading">Ready to build your autonomous robot?</h2>
            <p className="cta-subheading">
              Launch Hardware Workbench now. No cloud accounts, no installs — completely free in your browser.
            </p>
            <div className="cta-btn-wrap">
              <button 
                className="btn-cta-teal" 
                onClick={onOpenWorkbench}
                id="footer-launch-workbench-btn"
              >
                <span>Launch Hardware Workbench</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Engineering Footer */}
      <footer className="technical-footer">
        <div className="footer-inner-container">
          <div className="footer-top-row">
            <div className="footer-brand-column">
              <div className="footer-brand-logo">
                <Cpu size={18} style={{ color: '#0ea5e9' }} />
                <span>HARDWARE WORKBENCH</span>
              </div>
              <p className="footer-tagline">
                Browser-based electronics prototyping, physics simulation, and virtual Arduino microcontroller studio.
              </p>
            </div>

            <div className="footer-links-column">
              <h5 className="footer-column-heading">WORKBENCH</h5>
              <button className="footer-link-btn" onClick={onOpenWorkbench}>Open Studio</button>
              <button className="footer-link-btn" onClick={() => scrollToSection('projects')}>Starter Templates</button>
              <button className="footer-link-btn" onClick={() => scrollToSection('features')}>Subsystems</button>
              <button className="footer-link-btn" onClick={() => scrollToSection('workflow')}>Workflow Guide</button>
            </div>

            <div className="footer-links-column">
              <h5 className="footer-column-heading">STARTER TEMPLATES</h5>
              <button className="footer-link-btn" onClick={() => onLaunchTemplate(EXAMPLE_PROJECT_TEMPLATES[0].config)}>
                PID Line Follower Rover
              </button>
              <button className="footer-link-btn" onClick={() => onLaunchTemplate(EXAMPLE_PROJECT_TEMPLATES[1].config)}>
                Ultrasonic Polar Radar Rover
              </button>
              <button className="footer-link-btn" onClick={() => onLaunchTemplate(EXAMPLE_PROJECT_TEMPLATES[2].config)}>
                Closed-Loop Odometry Rover
              </button>
            </div>

            <div className="footer-links-column">
              <h5 className="footer-column-heading">KEYBOARD CONTROLS</h5>
              <div className="footer-shortcut-item"><kbd>W</kbd> <span>Translate Gizmo</span></div>
              <div className="footer-shortcut-item"><kbd>E</kbd> <span>Rotate Gizmo</span></div>
              <div className="footer-shortcut-item"><kbd>R</kbd> <span>Scale Gizmo</span></div>
              <div className="footer-shortcut-item"><kbd>F5</kbd> <span>Run Simulation</span></div>
            </div>
          </div>

          <div className="footer-bottom-row">
            <span className="footer-copyright">
              © 2026 Hardware Workbench Studio. Released for robotics and electronics engineering education.
            </span>
            <div className="footer-status-pill">
              <span className="status-indicator-green" />
              <span>All Systems Operational • 60 FPS Engine</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
