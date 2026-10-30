import { useState, useRef, useEffect, type ChangeEvent, type KeyboardEvent } from 'react';
import { 
  Play, 
  Square, 
  RotateCcw, 
  Trash2, 
  Code, 
  Terminal, 
  Cpu, 
  ChevronDown, 
  ChevronUp, 
  X, 
  AlertCircle,
  Activity,
  FileCode,
  ShieldCheck,
  AlertTriangle,
  Zap,
  Radio,
  SlidersHorizontal
} from 'lucide-react';
import type { 
  SimulatedPin, 
  RuntimeStatus, 
  ConsoleMessage, 
  ArduinoProgramStats,
  WireConnection,
  Component3D
} from '../types/workbench';
import { SKETCH_PRESETS } from '../utils/arduinoRuntime';
import { evaluateCircuitState, type EvaluatedCircuit } from '../utils/hardwareBridge';

interface CodeEditorPanelProps {
  isOpen: boolean;
  onClose: () => void;
  code: string;
  onChangeCode: (code: string) => void;
  runtimeStatus: RuntimeStatus;
  onRunCode: () => void;
  onStopCode: () => void;
  onResetRuntime: () => void;
  consoleMessages: ConsoleMessage[];
  onClearConsole: () => void;
  simulatedPins: Record<number, SimulatedPin>;
  onSetVirtualInput: (pin: number, value: number) => void;
  stats: ArduinoProgramStats;
  panelHeight: number;
  onResizeHeight: (newHeight: number) => void;
  // Circuit Diagnostics Props
  wires?: WireConnection[];
  components?: Component3D[];
}

type ActiveTab = 'code' | 'console' | 'diagnostics' | 'pins';

export const CodeEditorPanel = ({
  isOpen,
  onClose,
  code,
  onChangeCode,
  runtimeStatus,
  onRunCode,
  onStopCode,
  onResetRuntime,
  consoleMessages,
  onClearConsole,
  simulatedPins,
  onSetVirtualInput,
  stats,
  panelHeight,
  onResizeHeight,
  wires = [],
  components = [],
}: CodeEditorPanelProps) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('code');
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [selectedPresetId, setSelectedPresetId] = useState<string>('pid_line_follower');
  const consoleBottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isDraggingResize = useRef<boolean>(false);
  const startDragY = useRef<number>(0);
  const startHeight = useRef<number>(panelHeight);

  // Auto-scroll console when new messages arrive
  useEffect(() => {
    if (activeTab === 'console') {
      consoleBottomRef.current?.scrollIntoView({ behavior: 'auto' });
    }
  }, [consoleMessages, activeTab]);

  // Evaluate Circuit State on the fly
  let evaluatedCircuit: EvaluatedCircuit | null = null;
  try {
    if (wires && components && simulatedPins) {
      evaluatedCircuit = evaluateCircuitState(components, wires, [], simulatedPins, runtimeStatus || 'stopped');
    }
  } catch (err) {
    // Graceful fallback
    evaluatedCircuit = null;
  }

  // Count diagnostics warnings
  let diagnosticWarningsCount = 0;
  let completeCircuitsCount = 0;
  let totalCircuitsCount = 0;

  if (evaluatedCircuit) {
    evaluatedCircuit.motors.forEach((m) => {
      totalCircuitsCount++;
      if (m.isCircuitComplete) completeCircuitsCount++;
      if (m.warning) diagnosticWarningsCount++;
    });
    evaluatedCircuit.ultrasonics.forEach((u) => {
      totalCircuitsCount++;
      if (u.isCircuitComplete) completeCircuitsCount++;
      if (u.warning) diagnosticWarningsCount++;
    });
    evaluatedCircuit.lineSensors.forEach((ls) => {
      totalCircuitsCount++;
      if (ls.isCircuitComplete) completeCircuitsCount++;
      if (ls.warning) diagnosticWarningsCount++;
    });
    evaluatedCircuit.servos.forEach((s) => {
      totalCircuitsCount++;
      if (s.isCircuitComplete) completeCircuitsCount++;
      if (s.warning) diagnosticWarningsCount++;
    });
    evaluatedCircuit.leds.forEach((l) => {
      totalCircuitsCount++;
      if (l.isCircuitComplete) completeCircuitsCount++;
      if (l.warning) diagnosticWarningsCount++;
    });
  }

  // Handle Tab key in code editor to insert spaces instead of defocusing
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const spaces = '  ';

      const newCode = code.substring(0, start) + spaces + code.substring(end);
      onChangeCode(newCode);

      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + spaces.length;
      }, 0);
    }
  };

  // Preset Selection
  const handlePresetChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedPresetId(id);
    const preset = SKETCH_PRESETS.find((p) => p.id === id);
    if (preset) {
      onChangeCode(preset.code);
    }
  };

  // Drag-to-resize panel height
  const handleMouseDownResize = (e: React.MouseEvent) => {
    isDraggingResize.current = true;
    startDragY.current = e.clientY;
    startHeight.current = panelHeight;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isDraggingResize.current) return;
      const deltaY = startDragY.current - moveEvent.clientY;
      const newH = Math.max(200, Math.min(window.innerHeight * 0.85, startHeight.current + deltaY));
      onResizeHeight(newH);
    };

    const handleMouseUp = () => {
      isDraggingResize.current = false;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  if (!isOpen) return null;

  // Line counter
  const lines = code.split('\n');
  const lineCount = lines.length;

  // Find error line if any from latest message
  const lastErrorMessage = [...consoleMessages].reverse().find((m) => m.type === 'error');
  const errorLineMatch = lastErrorMessage?.text.match(/line\s+(\d+)/i);
  const errorLineNumber = errorLineMatch ? parseInt(errorLineMatch[1], 10) : null;

  return (
    <div 
      className={`code-editor-panel-dock ${isMinimized ? 'minimized' : ''}`}
      style={{ height: isMinimized ? '38px' : `${panelHeight}px` }}
      id="workbench-bottom-dock"
    >
      {/* 1. Drag Resize Handle */}
      {!isMinimized && (
        <div 
          className="dock-resize-handle"
          onMouseDown={handleMouseDownResize}
          title="Drag to resize bottom dock"
        >
          <div className="resize-bar-line" />
        </div>
      )}

      {/* 2. Top Navigation Bar */}
      <div className="dock-header-bar">
        {/* Left: Tab Switches */}
        <div className="dock-tabs-group">
          <button
            className={`dock-tab-btn ${activeTab === 'code' ? 'active' : ''}`}
            onClick={() => { setActiveTab('code'); setIsMinimized(false); }}
            id="dock-tab-code"
          >
            <Code size={13} />
            <span>Arduino Sketch</span>
            {runtimeStatus === 'running' && <span className="tab-running-dot" />}
          </button>

          <button
            className={`dock-tab-btn ${activeTab === 'console' ? 'active' : ''}`}
            onClick={() => { setActiveTab('console'); setIsMinimized(false); }}
            id="dock-tab-console"
          >
            <Terminal size={13} />
            <span>Serial Monitor</span>
            {consoleMessages.length > 0 && (
              <span className="tab-count-badge">{consoleMessages.length}</span>
            )}
          </button>

          <button
            className={`dock-tab-btn ${activeTab === 'diagnostics' ? 'active' : ''}`}
            onClick={() => { setActiveTab('diagnostics'); setIsMinimized(false); }}
            id="dock-tab-diagnostics"
          >
            <ShieldCheck size={13} />
            <span>Circuit Diagnostics</span>
            {diagnosticWarningsCount > 0 ? (
              <span className="tab-warning-badge">{diagnosticWarningsCount}</span>
            ) : completeCircuitsCount > 0 ? (
              <span className="tab-healthy-badge">✓</span>
            ) : null}
          </button>

          <button
            className={`dock-tab-btn ${activeTab === 'pins' ? 'active' : ''}`}
            onClick={() => { setActiveTab('pins'); setIsMinimized(false); }}
            id="dock-tab-pins"
          >
            <Activity size={13} />
            <span>Virtual Pins</span>
          </button>
        </div>

        {/* Center: Controls for Active Tab */}
        <div className="dock-controls-center">
          {activeTab === 'code' && (
            <>
              {/* Preset Selector */}
              <div className="preset-selector-group">
                <FileCode size={12} style={{ color: 'var(--text-muted)' }} />
                <select
                  value={selectedPresetId}
                  onChange={handlePresetChange}
                  className="preset-select-dropdown"
                  title="Load Arduino Sketch Preset"
                  id="select-sketch-preset"
                >
                  {SKETCH_PRESETS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Execution Buttons */}
              <div className="dock-exec-buttons">
                {runtimeStatus !== 'running' ? (
                  <button 
                    className="dock-btn-run" 
                    onClick={onRunCode}
                    title="Compile & Run Arduino Sketch"
                    id="btn-run-arduino-sketch"
                  >
                    <Play size={12} />
                    <span>Run</span>
                  </button>
                ) : (
                  <button 
                    className="dock-btn-stop" 
                    onClick={onStopCode}
                    title="Stop Arduino Sketch Execution"
                    id="btn-stop-arduino-sketch"
                  >
                    <Square size={11} />
                    <span>Stop</span>
                  </button>
                )}

                <button 
                  className="dock-btn-reset" 
                  onClick={onResetRuntime}
                  title="Reset Arduino CPU, RAM & Pins"
                  id="btn-reset-arduino-runtime"
                >
                  <RotateCcw size={12} />
                  <span>Reset</span>
                </button>
              </div>

              {/* Runtime Stats Pill */}
              <div className="dock-stats-pill">
                <span>CPU: <strong>{stats.cyclesCount} cycles</strong></span>
                <span>•</span>
                <span>Elapsed: <strong>{stats.elapsedMs} ms</strong></span>
              </div>
            </>
          )}

          {activeTab === 'console' && (
            <div className="dock-console-controls">
              <span className="baud-rate-tag">9600 BAUD</span>
              <button 
                className="dock-clear-console-btn"
                onClick={onClearConsole}
                title="Clear Serial Output"
                id="btn-clear-console"
              >
                <Trash2 size={12} />
                <span>Clear</span>
              </button>
            </div>
          )}

          {activeTab === 'diagnostics' && (
            <div className="dock-diag-summary">
              <span>Circuits: <strong>{completeCircuitsCount}/{totalCircuitsCount}</strong> Complete</span>
              <span>•</span>
              <span>Wires: <strong>{wires.length}</strong></span>
              {diagnosticWarningsCount > 0 && (
                <span className="diag-warning-tag">
                  <AlertTriangle size={11} /> {diagnosticWarningsCount} Warning{diagnosticWarningsCount > 1 ? 's' : ''}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Right: Window Sizing & Close */}
        <div className="dock-window-actions">
          <button
            className="dock-win-btn"
            onClick={() => setIsMinimized(!isMinimized)}
            title={isMinimized ? 'Expand Panel' : 'Minimize Panel'}
            id="btn-minimize-bottom-dock"
          >
            {isMinimized ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          <button
            className="dock-win-btn"
            onClick={onClose}
            title="Close Panel"
            id="btn-close-bottom-dock"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* 3. Panel Body Views */}
      {!isMinimized && (
        <div className="dock-body-container">
          {/* ============================================================ */}
          {/* TAB 1: ARDUINO CODE EDITOR                                   */}
          {/* ============================================================ */}
          {activeTab === 'code' && (
            <div className="editor-tab-view">
              <div className="editor-main-area">
                {/* Line Numbers Gutter */}
                <div className="editor-line-gutter">
                  {Array.from({ length: lineCount }).map((_, idx) => {
                    const lineNum = idx + 1;
                    const isErrorLine = lineNum === errorLineNumber;
                    return (
                      <div 
                        key={lineNum} 
                        className={`gutter-line ${isErrorLine ? 'error-line' : ''}`}
                      >
                        {isErrorLine && <span className="gutter-error-dot" />}
                        {lineNum}
                      </div>
                    );
                  })}
                </div>

                {/* Textarea Code Input */}
                <textarea
                  ref={textareaRef}
                  className="editor-textarea"
                  value={code}
                  onChange={(e) => onChangeCode(e.target.value)}
                  onKeyDown={handleKeyDown}
                  spellCheck={false}
                  placeholder="void setup() {\n  // Put setup code here\n}\n\nvoid loop() {\n  // Put main code here\n}"
                  id="textarea-arduino-code"
                />
              </div>

              {/* Inline Syntax / Runtime Error Alert */}
              {lastErrorMessage && runtimeStatus === 'error' && (
                <div className="editor-error-banner">
                  <AlertCircle size={15} style={{ flexShrink: 0, color: '#ef4444' }} />
                  <div className="error-banner-text">
                    <strong>{lastErrorMessage.text}</strong>
                    {errorLineNumber && <span> (Line {errorLineNumber})</span>}
                  </div>
                </div>
              )}

              {/* Footer Documentation Bar */}
              <div className="editor-footer-info">
                <span>
                  Supported: <code>setup()</code>, <code>loop()</code>, <code>pinMode()</code>, <code>digitalWrite()</code>, <code>analogWrite()</code>, <code>digitalRead()</code>, <code>analogRead()</code>, <code>pulseIn()</code>, <code>attachInterrupt()</code>, <code>Servo</code>
                </span>
                <span className="footer-stats">
                  Lines: {lineCount} | Chars: {code.length}
                </span>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 2: SERIAL MONITOR                                        */}
          {/* ============================================================ */}
          {activeTab === 'console' && (
            <div className="console-tab-view">
              <div className="console-messages-list">
                {consoleMessages.length === 0 ? (
                  <div className="console-empty-state">
                    <Terminal size={24} style={{ color: 'var(--text-muted)', marginBottom: '8px' }} />
                    <p>Serial monitor is empty. Click <strong>Run</strong> to execute sketch and stream output.</p>
                  </div>
                ) : (
                  consoleMessages.map((msg) => (
                    <div key={msg.id} className={`console-msg msg-type-${msg.type}`}>
                      <span className="msg-timestamp">{msg.timestamp}</span>
                      <span className="msg-content">{msg.text}</span>
                    </div>
                  ))
                )}
                <div ref={consoleBottomRef} />
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 3: CIRCUIT DIAGNOSTICS & CONTINUITY                      */}
          {/* ============================================================ */}
          {activeTab === 'diagnostics' && (
            <div className="diagnostics-tab-view">
              <div className="diag-grid">
                {/* 1. Drive Motors Health */}
                <div className="diag-card">
                  <div className="diag-card-title">
                    <Zap size={14} style={{ color: '#eab308' }} />
                    <span>DC Drive Motors</span>
                  </div>
                  {evaluatedCircuit && evaluatedCircuit.motors.size > 0 ? (
                    Array.from(evaluatedCircuit.motors.entries()).map(([id, motor]) => {
                      const comp = components.find((c) => c.id === id);
                      return (
                        <div key={id} className="diag-item-row">
                          <div className="diag-item-name">
                            <span className={`status-indicator ${motor.isCircuitComplete ? 'ok' : 'err'}`} />
                            <strong>{comp?.name || id}</strong>
                          </div>
                          <div className="diag-item-details">
                            <span>Pin: <strong>{motor.pinNumber !== null ? `D${motor.pinNumber}` : 'Unconnected'}</strong></span>
                            <span>Speed: <strong>{motor.targetSpeed.toFixed(1)} rad/s</strong></span>
                          </div>
                          {motor.warning && (
                            <div className="diag-item-warn">⚠️ {motor.warning}</div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="diag-empty-item">No DC motors in scene.</div>
                  )}
                </div>

                {/* 2. Ultrasonic Sensor Health */}
                <div className="diag-card">
                  <div className="diag-card-title">
                    <Radio size={14} style={{ color: '#38bdf8' }} />
                    <span>Ultrasonic Distance Sensor</span>
                  </div>
                  {evaluatedCircuit && evaluatedCircuit.ultrasonics.size > 0 ? (
                    Array.from(evaluatedCircuit.ultrasonics.entries()).map(([id, sonar]) => {
                      const comp = components.find((c) => c.id === id);
                      return (
                        <div key={id} className="diag-item-row">
                          <div className="diag-item-name">
                            <span className={`status-indicator ${sonar.isCircuitComplete ? 'ok' : 'err'}`} />
                            <strong>{comp?.name || id}</strong>
                          </div>
                          <div className="diag-item-details">
                            <span>Power: <strong>{sonar.vccConnected && sonar.gndConnected ? 'VCC + GND OK' : 'Missing Power'}</strong></span>
                            <span>Trig: <strong>{sonar.trigPin !== null ? `D${sonar.trigPin}` : 'Open'}</strong></span>
                            <span>Echo: <strong>{sonar.echoPin !== null ? `D${sonar.echoPin}` : 'Open'}</strong></span>
                            <span>Dist: <strong>{sonar.distanceCm} cm</strong></span>
                          </div>
                          {sonar.warning && (
                            <div className="diag-item-warn">⚠️ {sonar.warning}</div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="diag-empty-item">No ultrasonic sensors detected.</div>
                  )}
                </div>

                {/* 3. TCRT5000 IR Line Reflectance Sensors */}
                <div className="diag-card">
                  <div className="diag-card-title">
                    <SlidersHorizontal size={14} style={{ color: '#10b981' }} />
                    <span>IR Line Reflectance Array</span>
                  </div>
                  {evaluatedCircuit && evaluatedCircuit.lineSensors.size > 0 ? (
                    Array.from(evaluatedCircuit.lineSensors.entries()).map(([id, ls]) => {
                      const comp = components.find((c) => c.id === id);
                      return (
                        <div key={id} className="diag-item-row">
                          <div className="diag-item-name">
                            <span className={`status-indicator ${ls.isCircuitComplete ? 'ok' : 'err'}`} />
                            <strong>{comp?.name || id}</strong>
                          </div>
                          <div className="diag-item-details">
                            <span>Power: <strong>{ls.vccConnected && ls.gndConnected ? '5V OK' : 'No VCC/GND'}</strong></span>
                            <span>DO: <strong>{ls.doPin !== null ? `D${ls.doPin}` : 'None'}</strong></span>
                            <span>AO: <strong>{ls.aoPin !== null ? (ls.aoPin >= 14 ? `A${ls.aoPin - 14}` : `Pin ${ls.aoPin}`) : 'None'}</strong></span>
                            <span>State: <strong>{ls.digitalOutput === 1 ? '● LINE' : '○ FLOOR'}</strong></span>
                          </div>
                          {ls.warning && (
                            <div className="diag-item-warn">⚠️ {ls.warning}</div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="diag-empty-item">No TCRT5000 line sensors attached.</div>
                  )}
                </div>

                {/* 4. Micro Servo & Outputs */}
                <div className="diag-card">
                  <div className="diag-card-title">
                    <Cpu size={14} style={{ color: '#a855f7' }} />
                    <span>Servos & Output LEDs</span>
                  </div>
                  {evaluatedCircuit && evaluatedCircuit.servos.size > 0 && (
                    Array.from(evaluatedCircuit.servos.entries()).map(([id, s]) => {
                      const comp = components.find((c) => c.id === id);
                      return (
                        <div key={id} className="diag-item-row">
                          <div className="diag-item-name">
                            <span className={`status-indicator ${s.isCircuitComplete ? 'ok' : 'err'}`} />
                            <strong>{comp?.name || id} (Servo)</strong>
                          </div>
                          <div className="diag-item-details">
                            <span>Signal: <strong>{s.signalPin !== null ? `D${s.signalPin}` : 'Open'}</strong></span>
                            <span>Angle: <strong>{s.currentAngle}°</strong></span>
                          </div>
                        </div>
                      );
                    })
                  )}

                  {evaluatedCircuit && evaluatedCircuit.leds.size > 0 && (
                    Array.from(evaluatedCircuit.leds.entries()).map(([id, led]) => {
                      const comp = components.find((c) => c.id === id);
                      return (
                        <div key={id} className="diag-item-row">
                          <div className="diag-item-name">
                            <span className={`status-indicator ${led.isCircuitComplete ? 'ok' : 'err'}`} />
                            <strong>{comp?.name || id} (LED)</strong>
                          </div>
                          <div className="diag-item-details">
                            <span>Pin: <strong>{led.pinNumber !== null ? `D${led.pinNumber}` : 'Open'}</strong></span>
                            <span>State: <strong>{led.intensity > 0 ? `ON (${Math.round(led.intensity * 100)}%)` : 'OFF'}</strong></span>
                          </div>
                          {led.warning && (
                            <div className="diag-item-warn">⚠️ {led.warning}</div>
                          )}
                        </div>
                      );
                    })
                  )}

                  {(!evaluatedCircuit || (evaluatedCircuit.servos.size === 0 && evaluatedCircuit.leds.size === 0)) && (
                    <div className="diag-empty-item">No servos or LEDs present.</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 4: VIRTUAL ARDUINO UNO PIN MONITOR                       */}
          {/* ============================================================ */}
          {activeTab === 'pins' && (
            <div className="pins-tab-view">
              <div className="pins-section-header">
                <div className="section-title">
                  <Activity size={14} style={{ color: '#38bdf8' }} />
                  <span>Simulated Arduino Uno Pin Bank (Digital D0-D13 & Analog A0-A5)</span>
                </div>
                <div className="section-hint">
                  Click buttons to toggle digital inputs or slide analog voltages to test runtime input reading.
                </div>
              </div>

              <div className="pins-grid">
                {Object.values(simulatedPins).map((pin) => {
                  const isHigh = pin.digitalValue === 1;
                  const isAnalog = pin.pin >= 14;

                  return (
                    <div 
                      key={pin.pin} 
                      className={`pin-card ${isHigh ? 'pin-high' : ''} ${pin.mode === 'OUTPUT' ? 'mode-output' : 'mode-input'}`}
                    >
                      <div className="pin-card-top">
                        <div className="pin-name-badge">
                          <strong>{pin.name}</strong>
                          {pin.pin === 13 && <span className="builtin-badge">LED</span>}
                          {pin.isPwm && <span className="pwm-badge">PWM</span>}
                        </div>
                        <span className={`pin-mode-tag mode-${pin.mode.toLowerCase()}`}>
                          {pin.mode}
                        </span>
                      </div>

                      {/* State Indicator */}
                      <div className="pin-state-row">
                        <div className={`pin-led-indicator ${isHigh ? 'led-on' : 'led-off'}`} />
                        <span className="pin-val-text">
                          {isHigh ? 'HIGH (1)' : 'LOW (0)'}
                        </span>
                        {pin.isPwm && pin.mode === 'OUTPUT' && (
                          <span className="pin-pwm-pct">
                            {Math.round((pin.pwmValue / 255) * 100)}%
                          </span>
                        )}
                      </div>

                      {/* PWM Output Meter */}
                      {pin.isPwm && pin.mode === 'OUTPUT' && (
                        <div className="pin-pwm-bar-wrap">
                          <div 
                            className="pin-pwm-bar-fill" 
                            style={{ width: `${(pin.pwmValue / 255) * 100}%` }} 
                          />
                        </div>
                      )}

                      {/* Interactive Controls for Virtual Testing */}
                      {pin.mode !== 'OUTPUT' && (
                        <div className="pin-interactive-wrap">
                          {!isAnalog ? (
                            <button
                              className={`pin-toggle-btn ${isHigh ? 'btn-active' : ''}`}
                              onClick={() => onSetVirtualInput(pin.pin, isHigh ? 0 : 1)}
                              title="Toggle simulated input HIGH / LOW"
                            >
                              {isHigh ? 'Set LOW' : 'Set HIGH'}
                            </button>
                          ) : (
                            <div className="pin-slider-wrap">
                              <input
                                type="range"
                                min={0}
                                max={1023}
                                value={pin.analogValue}
                                onChange={(e) => onSetVirtualInput(pin.pin, parseInt(e.target.value, 10))}
                                className="pin-analog-slider"
                                title={`Simulate analog voltage: ${pin.analogValue} / 1023 (${((pin.analogValue / 1023) * 5).toFixed(2)}V)`}
                              />
                              <span className="pin-analog-label">{pin.analogValue}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
