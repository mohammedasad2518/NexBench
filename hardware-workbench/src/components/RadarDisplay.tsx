import React, { useState } from 'react';

export interface RadarScanPoint {
  angle: number;       // 0 to 180 degrees
  distanceCm: number;  // 2 to 400 cm
  timestamp: number;
  hasHit?: boolean;
}

export interface RadarDisplayProps {
  currentAngle: number;
  currentDistanceCm: number;
  scanHistory?: RadarScanPoint[];
  maxRangeCm?: number;
  thresholdCm?: number;
}

export const RadarDisplay: React.FC<RadarDisplayProps> = ({
  currentAngle,
  currentDistanceCm,
  scanHistory = [],
  maxRangeCm = 400,
  thresholdCm = 25,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // SVG Geometry Constants
  const cx = 105;
  const cy = 105;
  const maxR = 90;

  // Polar to Cartesian conversion (0° right, 90° top, 180° left)
  const polarToCartesian = (angleDeg: number, radius: number) => {
    const rad = (angleDeg * Math.PI) / 180;
    return {
      x: cx + radius * Math.cos(rad),
      y: cy - radius * Math.sin(rad),
    };
  };

  // Compute beam endpoint
  const beamEnd = polarToCartesian(currentAngle, maxR);

  // Clamp current distance for display
  const clampedDist = Math.max(2, Math.min(maxRangeCm, currentDistanceCm));
  const currentPingRadius = Math.max(6, (clampedDist / maxRangeCm) * maxR);
  const currentPingPos = polarToCartesian(currentAngle, currentPingRadius);

  // Threshold radius (25 cm) - given slight visual expansion for clarity
  const thresholdRadius = Math.max(14, (thresholdCm / maxRangeCm) * maxR);

  // Sector classification
  const sector =
    currentAngle < 75 ? 'RIGHT' : currentAngle > 105 ? 'LEFT' : 'CENTER';
  const isHazard = currentDistanceCm <= thresholdCm;

  return (
    <div
      className="radar-display-widget"
      style={{
        position: 'absolute',
        top: '12px',
        left: '12px',
        background: 'rgba(15, 23, 42, 0.88)',
        backdropFilter: 'blur(8px)',
        border: `1px solid ${isHazard ? '#ef4444' : 'rgba(56, 189, 248, 0.4)'}`,
        borderRadius: '8px',
        padding: '10px 12px',
        color: '#f8fafc',
        fontFamily: 'monospace',
        fontSize: '11px',
        boxShadow: isHazard
          ? '0 0 16px rgba(239, 68, 68, 0.4)'
          : '0 4px 16px rgba(0, 0, 0, 0.6)',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        zIndex: 10,
        minWidth: '220px',
        pointerEvents: 'auto',
        userSelect: 'none',
      }}
    >
      {/* Header with Title and Collapse Button */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          paddingBottom: '4px',
          cursor: 'pointer',
        }}
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <span
          style={{
            fontWeight: 700,
            color: isHazard ? '#ef4444' : '#38bdf8',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <span
            style={{
              display: 'inline-block',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: isHazard ? '#ef4444' : '#34d399',
              boxShadow: isHazard ? '0 0 8px #ef4444' : '0 0 6px #34d399',
            }}
          />
          📡 Sonar Radar Sweep
        </span>
        <button
          style={{
            background: 'none',
            border: 'none',
            color: '#94a3b8',
            cursor: 'pointer',
            fontSize: '10px',
            padding: '0 4px',
          }}
          title={isCollapsed ? 'Expand Radar' : 'Collapse Radar'}
        >
          {isCollapsed ? '▼' : '▲'}
        </button>
      </div>

      {!isCollapsed && (
        <>
          {/* Radar Polar Scope SVG */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              marginTop: '2px',
            }}
          >
            <svg
              width="210"
              height="115"
              viewBox="0 0 210 115"
              style={{
                background: 'rgba(2, 6, 23, 0.65)',
                borderRadius: '6px',
                border: '1px solid rgba(56, 189, 248, 0.2)',
              }}
            >
              <defs>
                <radialGradient id="radarSweepGlow" cx="50%" cy="100%" r="90%">
                  <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.25" />
                  <stop offset="80%" stopColor="#0284c7" stopOpacity="0.05" />
                  <stop offset="100%" stopColor="#0f172a" stopOpacity="0.0" />
                </radialGradient>
              </defs>

              {/* Background Semi-Circle Fill */}
              <path
                d={`M ${cx - maxR} ${cy} A ${maxR} ${maxR} 0 0 1 ${cx + maxR} ${cy} Z`}
                fill="url(#radarSweepGlow)"
              />

              {/* Outer Boundary Arc (400 cm) */}
              <path
                d={`M ${cx - maxR} ${cy} A ${maxR} ${maxR} 0 0 1 ${cx + maxR} ${cy}`}
                fill="none"
                stroke="rgba(56, 189, 248, 0.4)"
                strokeWidth="1.5"
              />

              {/* Range Ring: 200 cm */}
              <path
                d={`M ${cx - maxR * 0.5} ${cy} A ${maxR * 0.5} ${maxR * 0.5} 0 0 1 ${cx + maxR * 0.5} ${cy}`}
                fill="none"
                stroke="rgba(56, 189, 248, 0.2)"
                strokeWidth="1"
                strokeDasharray="2,3"
              />

              {/* Range Ring: 100 cm */}
              <path
                d={`M ${cx - maxR * 0.25} ${cy} A ${maxR * 0.25} ${maxR * 0.25} 0 0 1 ${cx + maxR * 0.25} ${cy}`}
                fill="none"
                stroke="rgba(56, 189, 248, 0.2)"
                strokeWidth="1"
                strokeDasharray="2,3"
              />

              {/* Safe Threshold Arc (25 cm) - Red Highlighted */}
              <path
                d={`M ${cx - thresholdRadius} ${cy} A ${thresholdRadius} ${thresholdRadius} 0 0 1 ${cx + thresholdRadius} ${cy}`}
                fill="none"
                stroke="#ef4444"
                strokeWidth="1.5"
                strokeDasharray="3,2"
              />

              {/* Radial Spokes (30°, 45°, 90°, 135°, 150°) */}
              {[30, 45, 60, 90, 120, 135, 150].map((deg) => {
                const pt = polarToCartesian(deg, maxR);
                const isMajor = deg === 45 || deg === 90 || deg === 135;
                return (
                  <line
                    key={`spoke_${deg}`}
                    x1={cx}
                    y1={cy}
                    x2={pt.x}
                    y2={pt.y}
                    stroke={isMajor ? 'rgba(56, 189, 248, 0.35)' : 'rgba(56, 189, 248, 0.15)'}
                    strokeWidth={isMajor ? '1' : '0.5'}
                  />
                );
              })}

              {/* Angle Labels */}
              <text x={cx} y="12" fill="#94a3b8" fontSize="8" textAnchor="middle">90°</text>
              <text x="14" y={cy - 4} fill="#94a3b8" fontSize="8" textAnchor="start">180°</text>
              <text x="196" y={cy - 4} fill="#94a3b8" fontSize="8" textAnchor="end">0°</text>

              {/* Historical Obstacle Hit Points */}
              {scanHistory.map((pt, idx) => {
                const distR = Math.min(maxR, Math.max(6, (pt.distanceCm / maxRangeCm) * maxR));
                const pos = polarToCartesian(pt.angle, distR);
                const isObs = pt.distanceCm <= thresholdCm;
                return (
                  <circle
                    key={`hist_${idx}`}
                    cx={pos.x}
                    cy={pos.y}
                    r={isObs ? 3 : 2}
                    fill={isObs ? '#ef4444' : pt.distanceCm <= 100 ? '#f59e0b' : '#38bdf8'}
                    opacity={0.7}
                  />
                );
              })}

              {/* Current Scanning Beam Line */}
              <line
                x1={cx}
                y1={cy}
                x2={beamEnd.x}
                y2={beamEnd.y}
                stroke={isHazard ? '#ef4444' : '#38bdf8'}
                strokeWidth="2"
              />

              {/* Current Active Ping Blip */}
              <circle
                cx={currentPingPos.x}
                cy={currentPingPos.y}
                r="4"
                fill={isHazard ? '#ef4444' : currentDistanceCm <= 100 ? '#f59e0b' : '#34d399'}
                stroke="#ffffff"
                strokeWidth="1.5"
              />

              {/* Center Origin Standoff */}
              <circle cx={cx} cy={cy} r="3" fill="#38bdf8" />
            </svg>
          </div>

          {/* Digital Telemetry Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '4px 8px',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              paddingTop: '4px',
            }}
          >
            <div>
              Angle:{' '}
              <strong style={{ color: '#38bdf8' }}>{Math.round(currentAngle)}°</strong>
            </div>
            <div>
              Sector:{' '}
              <strong style={{ color: sector === 'CENTER' ? '#38bdf8' : '#a78bfa' }}>
                {sector}
              </strong>
            </div>
            <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'space-between' }}>
              <span>Range:</span>
              <strong
                style={{
                  color: isHazard ? '#ef4444' : currentDistanceCm <= 100 ? '#f59e0b' : '#34d399',
                }}
              >
                {Math.round(currentDistanceCm)} cm {isHazard ? '⚠️ STOP' : ''}
              </strong>
            </div>
          </div>

          {/* Hazard Alert Banner */}
          {isHazard && (
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.2)',
                border: '1px solid #ef4444',
                color: '#ef4444',
                padding: '2px 4px',
                borderRadius: '4px',
                textAlign: 'center',
                fontWeight: 700,
                fontSize: '10px',
              }}
            >
              ⛔ OBSTACLE IN SECTOR ({Math.round(currentDistanceCm)} cm)
            </div>
          )}
        </>
      )}
    </div>
  );
};
