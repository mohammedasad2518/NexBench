import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  ChevronDown, 
  ChevronUp, 
  Globe, 
  X, 
  Clock, 
  BookOpen, 
  BarChart, 
  ArrowRight,
  Gauge,
  Radio,
  RotateCw,
  Terminal,
  CheckCircle2,
  Tv
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
}) => {
  // 1. Dismissible Top Announcement Strip
  const [showAnnouncement, setShowAnnouncement] = useState<boolean>(() => {
    try {
      return localStorage.getItem('benchtwin_announcement_dismissed') !== 'true';
    } catch {
      return true;
    }
  });

  const dismissAnnouncement = () => {
    setShowAnnouncement(false);
    try {
      localStorage.setItem('benchtwin_announcement_dismissed', 'true');
    } catch {
      // ignore
    }
  };

  // 2. Sticky Navbar state
  const [isScrolled, setIsScrolled] = useState(false);
  const [productDropdownOpen, setProductDropdownOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 3. Hero 6-Step Interactive Progression
  const [activeStep, setActiveStep] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(true);

  // Auto-advance through the 6 hero tabs every 6 seconds when not paused
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % 6);
    }, 6000);
    return () => clearInterval(interval);
  }, [isPaused]);

  // 4. Project Discovery Category Filters
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

  // 5. Expandable Course Syllabus Accordion
  const [expandedUnits, setExpandedUnits] = useState<Record<number, boolean>>({ 1: true });

  const toggleUnit = (unitId: number) => {
    setExpandedUnits((prev) => ({ ...prev, [unitId]: !prev[unitId] }));
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Hero Step Descriptions
  const HERO_STEPS = [
    {
      num: 1,
      name: 'Build',
      desc: '9 489 real parts: boards, sensors, motors, screens...',
    },
    {
      num: 2,
      name: 'Wire',
      desc: 'Click a pin, then another. The circuit checks tell you...',
    },
    {
      num: 3,
      name: 'Code',
      desc: 'Arduino and ESP32 sketches, SPIKE and VEXcode...',
    },
    {
      num: 4,
      name: 'Simulate',
      desc: 'LEDs light, motors turn, and the serial monitor talks...',
    },
    {
      num: 5,
      name: 'Design',
      desc: 'Sketch a shape, pull it into 3D and cut its holes, the way CAD programs work. Then export it as an STL for your 3D printer.',
    },
    {
      num: 6,
      name: 'Test Bench',
      desc: 'Drive your robot on a real field',
    },
  ];

  const SYLLABUS_UNITS = [
    {
      id: 1,
      title: 'Get around',
      summary: 'Turn the view, find parts and put them where you want.',
      duration: '3 lessons, 9 min',
      lessons: [
        'Navigating the 3D bench with Orbit and Pan controls',
        'Browsing catalog parts: microcontrollers, motors, sensors',
        'Precision snap placing and aligning on the 0.5m grid',
      ],
    },
    {
      id: 2,
      title: 'Wire',
      summary: 'Connect pins, plug parts into a breadboard and read the checks.',
      duration: '5 lessons, 22 min',
      lessons: [
        'Plugging components into breadboard power and tie-point rails',
        'Color-coded jumpers: +5V (red), GND (black), PWM (yellow)',
        'Live circuit evaluation and continuity error checking',
      ],
    },
    {
      id: 3,
      title: 'Code',
      summary: 'Write real Arduino code and watch it run on the bench.',
      duration: '7 lessons, 35 min',
      lessons: [
        'Anatomy of Arduino sketches: setup() and loop()',
        'Digital outputs: pinMode(), digitalWrite(), and delay()',
        'Serial telemetry stream and live Serial.println() monitor',
      ],
    },
    {
      id: 4,
      title: 'More code',
      summary: 'Several LEDs, buttons that count, a knob, and timing without delay().',
      duration: '7 lessons, 42 min',
      lessons: [
        'Non-blocking event scheduling with millis() timers',
        'Analog potentiometer inputs and analogRead() conversion',
        'PWM analogWrite() LED fading and DC motor throttle control',
      ],
    },
    {
      id: 5,
      title: 'Libraries',
      summary: 'Use real Arduino libraries to read sensors and buttons, like the ones in Code ▸ Libraries.',
      duration: '4 lessons, 25 min',
      lessons: [
        'Controlling micro servos with #include <Servo.h>',
        'HC-SR04 ultrasonic distance sensing with pulseIn() timing',
        'Attaching optical wheel encoder interrupts with attachInterrupt()',
      ],
    },
    {
      id: 6,
      title: 'Measure',
      summary: 'Measure the circuit like on a real lab bench.',
      duration: '2 lessons, 11 min',
      lessons: [
        'Pin timeline logic waveform analysis across 5 digital channels',
        'Virtual pin matrix monitoring: High, Low, and Analog Voltages',
      ],
    },
  ];

  return (
    <div className="benchtwin-landing-root">
      {/* 1. Announcement Strip */}
      {showAnnouncement && (
        <aside className="bt-announcement-strip">
          <div className="bt-announcement-content">
            <span className="bt-announcement-text">
              The full version of Hardware Workbench is coming by January 1, 2027. Until then Hardware Workbench is in beta: free to use, with new features every week.
            </span>
            <button 
              className="bt-announcement-link" 
              onClick={() => scrollToSection('whats-new')}
            >
              See what&apos;s new
            </button>
            <button 
              className="bt-announcement-close" 
              onClick={dismissAnnouncement}
              title="Dismiss announcement"
              aria-label="Dismiss announcement"
            >
              <X size={15} />
            </button>
          </div>
        </aside>
      )}

      {/* 2. Top Navigation Bar */}
      <header className={`bt-navbar ${isScrolled ? 'scrolled' : ''}`}>
        <div className="bt-navbar-inner">
          {/* Brand Logo & Wordmark */}
          <div className="bt-brand-cluster" onClick={() => scrollToSection('hero')}>
            <div className="bt-logo-icon">
              {/* BenchTwin Style Circuit Dumbbell Icon */}
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="5" cy="12" r="3" fill="#14b8a6" />
                <circle cx="19" cy="12" r="3" fill="#14b8a6" />
                <path d="M8 12C11 12 13 8 16 12" stroke="#14b8a6" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </div>
            <span className="bt-brand-name">Hardware Workbench</span>
            <span className="bt-beta-badge">v3.66.0 beta</span>
          </div>

          {/* Center Navigation Links */}
          <nav className="bt-nav-links" aria-label="Main Navigation">
            <div 
              className="bt-dropdown-wrap" 
              onMouseEnter={() => setProductDropdownOpen(true)}
              onMouseLeave={() => setProductDropdownOpen(false)}
            >
              <button 
                className="bt-nav-item" 
                onClick={() => setProductDropdownOpen(!productDropdownOpen)}
              >
                <span>Product</span>
                <ChevronDown size={14} />
              </button>
              {productDropdownOpen && (
                <div className="bt-dropdown-menu">
                  <button className="bt-dropdown-item" onClick={() => { setActiveStep(0); scrollToSection('hero'); }}>
                    <strong>1. Build</strong> <span>Assemble 3D parts & sensors</span>
                  </button>
                  <button className="bt-dropdown-item" onClick={() => { setActiveStep(1); scrollToSection('hero'); }}>
                    <strong>2. Wire</strong> <span>Pin-to-pin circuit checks</span>
                  </button>
                  <button className="bt-dropdown-item" onClick={() => { setActiveStep(2); scrollToSection('hero'); }}>
                    <strong>3. Code</strong> <span>Safe Arduino C++ runtime</span>
                  </button>
                  <button className="bt-dropdown-item" onClick={() => { setActiveStep(3); scrollToSection('hero'); }}>
                    <strong>4. Simulate</strong> <span>LEDs, servos & radar rays</span>
                  </button>
                  <button className="bt-dropdown-item" onClick={() => { setActiveStep(4); scrollToSection('hero'); }}>
                    <strong>5. Design</strong> <span>3D CAD mounts & STL export</span>
                  </button>
                  <button className="bt-dropdown-item" onClick={() => { setActiveStep(5); scrollToSection('hero'); }}>
                    <strong>6. Test Bench</strong> <span>Drive robot on floor arena</span>
                  </button>
                </div>
              )}
            </div>

            <button className="bt-nav-item" onClick={() => scrollToSection('course')}>
              Course
            </button>
            <button className="bt-nav-item" onClick={() => scrollToSection('projects')}>
              Gallery
            </button>
            <button className="bt-nav-item" onClick={() => scrollToSection('features')}>
              Features
            </button>
            <button className="bt-nav-item" onClick={() => scrollToSection('whats-new')}>
              What&apos;s new
            </button>
            <button className="bt-nav-item" onClick={() => scrollToSection('about')}>
              About
            </button>
          </nav>

          {/* Right Action Icons & Buttons */}
          <div className="bt-nav-actions">
            <div className="bt-social-icons">
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="bt-social-btn" title="YouTube">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="bt-social-btn" title="Instagram">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                </svg>
              </a>
              <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" className="bt-social-btn" title="TikTok">
                <Tv size={16} />
              </a>
            </div>

            <div className="bt-lang-selector">
              <Globe size={15} />
              <span>English</span>
              <ChevronDown size={13} />
            </div>

            <button className="bt-btn-login" onClick={onOpenWorkbench}>
              Log in
            </button>

            <button 
              className="bt-btn-start-building" 
              onClick={onOpenWorkbench}
              id="nav-start-building-cta"
            >
              Start building
            </button>
          </div>
        </div>
      </header>

      {/* 3. Hero Section (Exact 3-Line Headline & 3D Interactive Bench) */}
      <section className="bt-hero-section" id="hero">
        <div className="bt-hero-grid-bg" />

        <div className="bt-hero-container">
          {/* Left Column: Headline, Copy & CTAs */}
          <div className="bt-hero-left">
            <h1 className="bt-hero-headline">
              Build it<br />
              before<br />
              you buy it.
            </h1>

            <p className="bt-hero-subtext">
              Put real parts on a 3D bench, wire them pin to pin, write the code and watch it run.
              Design your own parts, then drive your robot on a competition field, right in your browser.
            </p>

            <div className="bt-hero-btn-row">
              <button 
                className="bt-btn-hero-primary" 
                onClick={onOpenWorkbench}
                id="hero-start-building-btn"
              >
                Start building
              </button>
              <button 
                className="bt-btn-hero-secondary" 
                onClick={onOpenWorkbench}
                id="hero-login-btn"
              >
                Log in
              </button>
            </div>
          </div>

          {/* Right Column: Interactive 3D Bench Scene */}
          <div className="bt-hero-right">
            <HeroScene3D activeStep={activeStep} isPaused={isPaused} />
          </div>
        </div>

        {/* Hero Bottom: Interactive 6-Step Strip with Play/Pause & Sound */}
        <div className="bt-hero-steps-bar">
          <div className="bt-steps-track">
            {HERO_STEPS.map((step, idx) => {
              const isActive = activeStep === idx;
              return (
                <button
                  key={step.num}
                  className={`bt-step-card ${isActive ? 'active' : ''}`}
                  onClick={() => setActiveStep(idx)}
                  id={`hero-step-tab-${step.num}`}
                >
                  <div className="bt-step-badge">
                    <span className="bt-step-num">{step.num}</span>
                    <span className="bt-step-name">{step.name}</span>
                  </div>
                  <p className="bt-step-desc">{step.desc}</p>
                </button>
              );
            })}
          </div>

          {/* Strip Control Buttons (Play/Pause & Sound) */}
          <div className="bt-strip-controls">
            <button 
              className="bt-control-btn" 
              onClick={() => setIsPaused(!isPaused)}
              title={isPaused ? 'Resume auto-play' : 'Pause'}
              aria-label={isPaused ? 'Play' : 'Pause'}
            >
              {isPaused ? <Play size={15} /> : <Pause size={15} />}
            </button>
            <button 
              className="bt-control-btn" 
              onClick={() => setIsMuted(!isMuted)}
              title={isMuted ? 'Unmute' : 'Mute'}
              aria-label={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
            </button>
          </div>
        </div>
      </section>

      {/* 4. Section 2: "Made for makers, robotics teams and classrooms" (Dark Section) */}
      <section className="bt-dark-features-section" id="features">
        <div className="bt-features-container">
          <div className="bt-features-header">
            <h2 className="bt-features-title">
              Made for makers,<br />
              robotics teams<br />
              and classrooms
            </h2>
            <p className="bt-features-subtitle">
              Real electronics and real robot code, without waiting for parts or worrying about breaking them.
            </p>
          </div>

          <div className="bt-features-split-grid">
            {/* Left Column: Realistic Workbench CAD Application Preview */}
            <div className="bt-workbench-showcase-column">
              <div className="bt-cad-window-card" onClick={onOpenWorkbench}>
                <div className="bt-cad-titlebar">
                  <div className="bt-cad-dots">
                    <span className="dot red" />
                    <span className="dot yellow" />
                    <span className="dot green" />
                  </div>
                  <span className="bt-cad-window-title">Hardware Workbench • Robot car that avoids obstacles</span>
                  <span className="bt-cad-beta-tag">BETA</span>
                </div>

                {/* Simulated Multi-Panel CAD Interface */}
                <div className="bt-cad-ui-preview">
                  <div className="bt-cad-substrip">
                    <span>File ▾</span>
                    <span>3D bench ▾</span>
                    <span className="bt-tag-teal">Translate [W]</span>
                    <span>Rotate [E]</span>
                    <span>Top-ortho</span>
                    <span>Front</span>
                    <span>Right</span>
                  </div>

                  <div className="bt-cad-workspace-split">
                    {/* Left Catalog Column */}
                    <div className="bt-cad-preview-left">
                      <div className="bt-mini-header">PARTS CATALOG</div>
                      <div className="bt-mini-part">Arduino Uno R3</div>
                      <div className="bt-mini-part">HC-SR04 Sonar</div>
                      <div className="bt-mini-part">Micro Servo 9g</div>
                      <div className="bt-mini-part">DC Motors & Wheels</div>
                    </div>

                    {/* Center 3D Viewport View */}
                    <div className="bt-cad-preview-center">
                      <div className="bt-mini-robot-graphic">
                        <div className="robot-chassis-box" />
                        <div className="robot-wheel-left" />
                        <div className="robot-wheel-right" />
                        <div className="robot-sensor-head" />
                      </div>
                      <div className="bt-mini-ortho-views">
                        <div className="ortho-box">Top View</div>
                        <div className="ortho-box">Front View</div>
                      </div>
                    </div>

                    {/* Right Properties Column */}
                    <div className="bt-cad-preview-right">
                      <div className="bt-mini-header">PROPERTIES</div>
                      <div className="bt-mini-stat">X: 0.00 Y: 0.50 Z: 0.00</div>
                      <div className="bt-mini-stat">Pins: D9, D11, D12</div>
                      <div className="bt-mini-stat status-ok">Circuit: Continuity OK</div>
                    </div>
                  </div>

                  <div className="bt-cad-bottom-dock">
                    <span className="dock-label"><Terminal size={12} /> Arduino sketch: obstacle_avoidance.ino</span>
                    <span className="dock-status">Running • 60 FPS</span>
                  </div>
                </div>
              </div>

              <p className="bt-cad-caption">
                Parts on the left, your bench in the middle, checks and properties on the right.
                Split any area, like in Blender, to add Top, Front and Right views, the schematic or the serial monitor.
              </p>
            </div>

            {/* Right Column: 2-Column, 6-Card Feature Grid */}
            <div className="bt-features-cards-grid">
              <div className="bt-feature-card">
                <h3 className="bt-feature-title">Mistakes cost nothing</h3>
                <p className="bt-feature-body">
                  Wire it wrong, short a battery or burn an LED with Safety mode off.
                  Nothing breaks for real, and the checks explain what happened.
                </p>
              </div>

              <div className="bt-feature-card">
                <h3 className="bt-feature-title">Real parts, real sizes</h3>
                <p className="bt-feature-body">
                  Boards, sensors and robot kits from real catalogs, with their pins where the real ones are,
                  so what you build is what you buy.
                </p>
              </div>

              <div className="bt-feature-card">
                <h3 className="bt-feature-title">Your team&apos;s real code</h3>
                <p className="bt-feature-body">
                  SPIKE and VEXcode Python, FTC and FRC Java: press Run and watch your autonomous
                  drive on its real field, with encoders, sensors and the real time limit.
                </p>
                <button 
                  className="bt-link-underlined" 
                  onClick={() => scrollToSection('projects')}
                >
                  Open the robot gallery →
                </button>
              </div>

              <div className="bt-feature-card">
                <h3 className="bt-feature-title">Lab tools</h3>
                <p className="bt-feature-body">
                  A multimeter, an oscilloscope and a pin timeline measure the circuit while it runs.
                </p>
              </div>

              <div className="bt-feature-card">
                <h3 className="bt-feature-title">Ready for the classroom</h3>
                <p className="bt-feature-body">
                  Nothing to install: it runs in the browser, on Chromebooks too.
                  Lessons check every step, in six languages.
                </p>
              </div>

              <div className="bt-feature-card">
                <h3 className="bt-feature-title">Exports engineers use</h3>
                <p className="bt-feature-body">
                  A KiCad board and netlist, a parts list to buy from, STL files for printing and the Arduino code.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Section 3: Project Discovery & Starter Gallery (Light Section) */}
      <section className="bt-light-projects-section" id="projects">
        <div className="bt-projects-container">
          <div className="bt-projects-header">
            <span className="bt-section-kicker">PROJECT DISCOVERY</span>
            <h2 className="bt-projects-title">Start with a project</h2>
            <p className="bt-projects-sub">
              Open any pre-wired robotics blueprint to test immediately or customize in the
              3D workbench. All components, circuits, and sketches are included.
            </p>

            {/* Category Filter Pills */}
            <div className="bt-category-pills">
              {(['All', 'Robotics', 'Electronics', 'Sensors'] as const).map((cat) => (
                <button
                  key={cat}
                  className={`bt-pill-btn ${selectedCategory === cat ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="bt-projects-layout">
            {/* Left: Featured Blueprint Card */}
            <div className="bt-featured-project-card">
              <div className="bt-featured-badge-row">
                <span className="bt-featured-tag">FEATURED BLUEPRINT</span>
                <span className="bt-difficulty-chip">{activeTemplate.thumbnailBadge}</span>
              </div>

              <div className="bt-featured-visual">
                {activeTemplate.id.includes('follower') ? (
                  <Gauge size={54} color="#0ea5e9" />
                ) : activeTemplate.id.includes('radar') ? (
                  <Radio size={54} color="#0ea5e9" />
                ) : (
                  <RotateCw size={54} color="#0ea5e9" />
                )}
                <div className="bt-featured-info">
                  <h3 className="bt-featured-title">{activeTemplate.title}</h3>
                  <p className="bt-featured-desc">{activeTemplate.description}</p>
                </div>
              </div>

              <div className="bt-featured-specs">
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
                className="bt-btn-launch-featured" 
                onClick={() => onLaunchTemplate(activeTemplate.config)}
                id={`launch-featured-${activeTemplate.id}`}
              >
                <span>Launch in Workbench</span>
                <ArrowRight size={16} />
              </button>
            </div>

            {/* Right: Available Blueprints List */}
            <div className="bt-projects-list-wrap">
              <div className="bt-list-title">
                AVAILABLE BLUEPRINTS ({filteredTemplates.length})
              </div>

              <div className="bt-projects-list">
                {filteredTemplates.map((tmpl) => {
                  const isSelected = tmpl.id === activeTemplateId;
                  return (
                    <div 
                      key={tmpl.id}
                      className={`bt-project-row ${isSelected ? 'selected' : ''}`}
                      onClick={() => setActiveTemplateId(tmpl.id)}
                    >
                      <div className="bt-row-icon">
                        {tmpl.id.includes('follower') ? (
                          <Gauge size={22} />
                        ) : tmpl.id.includes('radar') ? (
                          <Radio size={22} />
                        ) : (
                          <RotateCw size={22} />
                        )}
                      </div>

                      <div className="bt-row-content">
                        <div className="bt-row-title-bar">
                          <h4 className="bt-row-title">{tmpl.title}</h4>
                          <span className="bt-row-badge">{tmpl.thumbnailBadge}</span>
                        </div>
                        <p className="bt-row-desc">{tmpl.description}</p>
                        <div className="bt-row-tags">
                          <span>Arduino Uno R3</span>
                          <span>{tmpl.config.components.length} Parts</span>
                          <span>{tmpl.config.wires?.length || 0} Wires</span>
                        </div>
                      </div>

                      <button 
                        className="bt-btn-row-open"
                        onClick={(e) => {
                          e.stopPropagation();
                          onLaunchTemplate(tmpl.config);
                        }}
                        title={`Open ${tmpl.title}`}
                        id={`launch-row-${tmpl.id}`}
                      >
                        <Play size={13} />
                        <span>Open</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Section 4: Course & Syllabus Section (Light Section) */}
      <section className="bt-course-section" id="course">
        <div className="bt-course-container">
          {/* Header Card */}
          <div className="bt-course-intro-card">
            <div className="bt-course-intro-left">
              <button className="bt-btn-start-course" onClick={onOpenWorkbench}>
                Start the course
              </button>
              <span className="bt-course-subtitle">42 hands-on lessons, about 3.5 hours in all</span>
            </div>

            <div className="bt-course-intro-right">
              <span className="bt-saved-badge">
                <CheckCircle2 size={14} color="#10b981" />
                <span>Your progress is saved in this browser</span>
              </span>
            </div>
          </div>

          {/* Course Metadata Bar */}
          <div className="bt-course-metrics-bar">
            <div className="metric-cell">
              <BarChart size={20} className="metric-icon" />
              <div className="metric-text">
                <span className="lbl">Skill level</span>
                <span className="val">Beginner</span>
              </div>
            </div>
            <div className="metric-cell">
              <Clock size={20} className="metric-icon" />
              <div className="metric-text">
                <span className="lbl">Time to complete</span>
                <span className="val">About 3.5 hours</span>
              </div>
            </div>
            <div className="metric-cell">
              <BookOpen size={20} className="metric-icon" />
              <div className="metric-text">
                <span className="lbl">Prerequisites</span>
                <span className="val">None</span>
              </div>
            </div>
          </div>

          {/* Syllabus Accordion Box */}
          <div className="bt-syllabus-box">
            <div className="bt-syllabus-header">
              <h3 className="bt-syllabus-title">Syllabus</h3>
              <span className="bt-syllabus-stats">10 units, 42 lessons, 42 quizzes</span>
            </div>

            <div className="bt-syllabus-list">
              {SYLLABUS_UNITS.map((unit) => {
                const isOpen = !!expandedUnits[unit.id];
                return (
                  <div key={unit.id} className="bt-syllabus-item">
                    <div 
                      className="bt-unit-summary-row" 
                      onClick={() => toggleUnit(unit.id)}
                    >
                      <div className="bt-unit-left">
                        <span className="bt-unit-number">{unit.id}</span>
                        <div className="bt-unit-info">
                          <h4 className="bt-unit-title">{unit.title}</h4>
                          <p className="bt-unit-summary">{unit.summary}</p>
                        </div>
                      </div>
                      <div className="bt-unit-right">
                        <span className="bt-unit-duration">{unit.duration}</span>
                        {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </div>
                    </div>

                    {isOpen && (
                      <div className="bt-unit-lessons-expanded">
                        <ul>
                          {unit.lessons.map((lesson, idx) => (
                            <li key={idx}>
                              <span className="lesson-dot" />
                              <span>{lesson}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* 7. Section 5: "What's new" Section (Light Section) */}
      <section className="bt-whats-new-section" id="whats-new">
        <div className="bt-whats-new-container">
          <div className="bt-section-heading-row">
            <h2 className="bt-editorial-heading">What&apos;s new</h2>
            <button className="bt-link-header" onClick={onOpenWorkbench}>
              All release notes
            </button>
          </div>

          <div className="bt-release-table">
            {/* Version 3.66.0 */}
            <div className="bt-release-row">
              <div className="release-col-version">
                <span className="version-number">3.66.0</span>
              </div>
              <div className="release-col-title">
                <h4 className="release-title">Where are you?</h4>
                <span className="release-tag">New in this version</span>
              </div>
              <div className="release-col-desc">
                <p>
                  Making an account now asks which country or territory you&apos;re in, from a list you can search
                  (every country and territory, or &quot;Prefer not to say&quot;).
                </p>
              </div>
            </div>

            {/* Version 3.37 */}
            <div className="bt-release-row">
              <div className="release-col-version">
                <span className="version-number">3.37</span>
              </div>
              <div className="release-col-title">
                <h4 className="release-title">Your ESP32 on the Blynk app, and wires that act like wire</h4>
                <span className="release-tag">Major update</span>
              </div>
              <div className="release-col-desc">
                <p>
                  The most advanced things Hardware Workbench learned in the last few updates:
                  the Internet of Things, real cable physics, and the libraries you would really use.
                </p>
              </div>
            </div>

            {/* 2027 Beta Roadmap */}
            <div className="bt-release-row">
              <div className="release-col-version">
                <span className="version-number">2027</span>
              </div>
              <div className="release-col-title">
                <h4 className="release-title">The full version of Hardware Workbench</h4>
                <span className="release-tag">Coming by January 1, 2027</span>
              </div>
              <div className="release-col-desc">
                <p>
                  Hardware Workbench leaves beta. Until then it&apos;s free to use while we finish it,
                  with new features every week, and your projects carry over.
                </p>
              </div>
            </div>

            {/* Hardware Workbench Pro */}
            <div className="bt-release-row">
              <div className="release-col-version">
                <span className="version-number">Pro</span>
              </div>
              <div className="release-col-title">
                <h4 className="release-title">Hardware Workbench Pro</h4>
                <span className="release-tag">Professional tier</span>
              </div>
              <div className="release-col-desc">
                <p>
                  Professional tools on top of everything Hardware Workbench does, for designing
                  robotics projects, collaborating with classrooms, and exporting directly to fabrication.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. Section 6: "About us" Section (Light Section) */}
      <section className="bt-about-section" id="about">
        <div className="bt-about-container">
          <h2 className="bt-editorial-heading">About us</h2>
          <div className="bt-about-content">
            <p className="bt-about-lead">
              Hardware Workbench was created to make it so anyone can try a circuit or a robot
              before they have the parts, without the risk of burning out a board.
            </p>
            <p className="bt-about-paragraph">
              We made it so anyone can try a circuit or a robot before they have the parts,
              without the risk of burning out a board. It&apos;s for students, makers and robotics teams,
              and it&apos;s free while it&apos;s in beta.
            </p>
            <button className="bt-link-underlined" onClick={onOpenWorkbench}>
              More about Hardware Workbench →
            </button>
          </div>
        </div>
      </section>

      {/* 9. Section 7: Professional Dark Footer */}
      <footer className="bt-footer">
        <div className="bt-footer-container">
          <div className="bt-footer-grid">
            {/* Column 1: Brand & Social */}
            <div className="bt-footer-col-brand">
              <div className="bt-footer-logo-row">
                <div className="bt-logo-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="5" cy="12" r="3" fill="#14b8a6" />
                    <circle cx="19" cy="12" r="3" fill="#14b8a6" />
                    <path d="M8 12C11 12 13 8 16 12" stroke="#14b8a6" strokeWidth="2.5" strokeLinecap="round" />
                  </svg>
                </div>
                <span className="bt-footer-brand-title">Hardware Workbench</span>
              </div>
              <p className="bt-footer-brand-desc">
                Build electronics and robots before you buy them, right in your browser.
              </p>

              <div className="bt-footer-socials">
                <span className="bt-social-lbl">Follow Hardware Workbench</span>
                <div className="bt-social-btn-group">
                  <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="bt-social-pill">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                    </svg>
                    <span>YouTube</span>
                  </a>
                  <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="bt-social-pill">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                    </svg>
                    <span>Instagram</span>
                  </a>
                  <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" className="bt-social-pill">
                    <Tv size={14} /> <span>TikTok</span>
                  </a>
                </div>
              </div>

              <div className="bt-footer-lang">
                <Globe size={14} />
                <span>English</span>
                <ChevronDown size={12} />
              </div>
            </div>

            {/* Column 2: Product */}
            <div className="bt-footer-col">
              <h5 className="bt-footer-heading">Product</h5>
              <ul className="bt-footer-links">
                <li><button onClick={() => { setActiveStep(0); scrollToSection('hero'); }}>Build</button></li>
                <li><button onClick={() => { setActiveStep(1); scrollToSection('hero'); }}>Wire</button></li>
                <li><button onClick={() => { setActiveStep(2); scrollToSection('hero'); }}>Code</button></li>
                <li><button onClick={() => { setActiveStep(3); scrollToSection('hero'); }}>Simulate</button></li>
                <li><button onClick={() => { setActiveStep(4); scrollToSection('hero'); }}>Design</button></li>
                <li><button onClick={() => { setActiveStep(5); scrollToSection('hero'); }}>Test Bench</button></li>
                <li><button onClick={onOpenWorkbench}>Desktop app</button></li>
              </ul>
            </div>

            {/* Column 3: Explore */}
            <div className="bt-footer-col">
              <h5 className="bt-footer-heading">Explore</h5>
              <ul className="bt-footer-links">
                <li><button onClick={() => scrollToSection('projects')}>Project gallery</button></li>
                <li><button onClick={() => scrollToSection('projects')}>Robot gallery</button></li>
                <li><button onClick={() => scrollToSection('whats-new')}>What&apos;s new</button></li>
                <li><button onClick={() => scrollToSection('whats-new')}>Countdown to release</button></li>
                <li><button onClick={onOpenWorkbench}>Log in</button></li>
              </ul>
            </div>

            {/* Column 4: Learn */}
            <div className="bt-footer-col">
              <h5 className="bt-footer-heading">Learn</h5>
              <ul className="bt-footer-links">
                <li><button onClick={() => scrollToSection('course')}>The Hardware Workbench course</button></li>
                <li><button onClick={onOpenWorkbench}>Your first circuit</button></li>
                <li><button onClick={onOpenWorkbench}>Tour of the app</button></li>
                <li><button onClick={onOpenWorkbench}>Send feedback</button></li>
                <li><button onClick={onOpenWorkbench}>Terms of Service</button></li>
              </ul>
            </div>
          </div>

          {/* Bottom Copyright & Policy Strip */}
          <div className="bt-footer-bottom-bar">
            <span className="bt-footer-copy-text">
              Hardware Workbench 3.66.0 beta. Full version by January 1, 2027. Made for students, makers and robotics teams.
            </span>
            <div className="bt-footer-bottom-links">
              <button onClick={() => scrollToSection('about')}>About</button>
              <button onClick={onOpenWorkbench}>Privacy policy</button>
              <button onClick={onOpenWorkbench}>Terms of Service</button>
              <button onClick={onOpenWorkbench} className="bt-btn-direct-app">Open the app directly next time</button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
