import React from 'react';
import type { ComponentType } from '../types/workbench';

interface ComponentThumbnailProps {
  type: ComponentType | string;
  color?: string;
  size?: number;
}

/**
 * Renders a crisp vector graphic thumbnail preview for every hardware component.
 * Strictly adheres to professional CAD styling with zero emojis.
 */
export const ComponentThumbnail: React.FC<ComponentThumbnailProps> = ({
  type,
  color = '#38bdf8',
  size = 36,
}) => {
  switch (type) {
    // 1. Arduino Uno
    case 'arduino':
      return (
        <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="4" y="6" width="32" height="28" rx="2" fill="#059669" stroke="#10b981" strokeWidth="1.2" />
          {/* USB-B Port */}
          <rect x="2" y="9" width="7" height="8" rx="1" fill="#94a3b8" stroke="#cbd5e1" strokeWidth="0.8" />
          {/* DC Jack */}
          <rect x="2" y="23" width="8" height="9" rx="1.5" fill="#1e293b" />
          {/* ATmega328P DIP IC */}
          <rect x="15" y="16" width="16" height="8" rx="1" fill="#18181b" stroke="#3f3f46" strokeWidth="0.8" />
          {/* Top & Bottom Header Strips */}
          <rect x="13" y="7" width="21" height="3" fill="#18181b" />
          <rect x="13" y="30" width="21" height="3" fill="#18181b" />
          {/* Crystal & Reset Button */}
          <ellipse cx="14" cy="12" rx="2" ry="1.2" fill="#cbd5e1" />
          <circle cx="9" cy="8" r="1.5" fill="#ef4444" />
        </svg>
      );

    // 2. Arduino Mega
    case 'arduino_mega':
      return (
        <svg width={size} height={size} viewBox="0 0 44 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="2" y="7" width="40" height="26" rx="2" fill="#047857" stroke="#10b981" strokeWidth="1.2" />
          <rect x="1" y="9" width="6" height="7" rx="1" fill="#94a3b8" />
          <rect x="1" y="21" width="7" height="8" rx="1" fill="#1e293b" />
          {/* Square QFP IC */}
          <rect x="16" y="15" width="8" height="8" transform="rotate(45 20 19)" fill="#18181b" stroke="#3f3f46" strokeWidth="0.8" />
          {/* Dual Rear Header Block */}
          <rect x="33" y="9" width="7" height="22" rx="1" fill="#18181b" />
        </svg>
      );

    // 3. Arduino Nano
    case 'arduino_nano':
      return (
        <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="10" y="5" width="20" height="30" rx="2" fill="#0284c7" stroke="#38bdf8" strokeWidth="1.2" />
          <rect x="15" y="3" width="10" height="5" rx="1" fill="#94a3b8" />
          <rect x="16" y="16" width="8" height="8" transform="rotate(45 20 20)" fill="#18181b" />
          {/* Side header pins */}
          <line x1="8" y1="9" x2="10" y2="9" stroke="#f59e0b" strokeWidth="1.5" />
          <line x1="8" y1="13" x2="10" y2="13" stroke="#f59e0b" strokeWidth="1.5" />
          <line x1="8" y1="17" x2="10" y2="17" stroke="#f59e0b" strokeWidth="1.5" />
          <line x1="8" y1="21" x2="10" y2="21" stroke="#f59e0b" strokeWidth="1.5" />
          <line x1="8" y1="25" x2="10" y2="25" stroke="#f59e0b" strokeWidth="1.5" />
          <line x1="8" y1="29" x2="10" y2="29" stroke="#f59e0b" strokeWidth="1.5" />
          <line x1="30" y1="9" x2="32" y2="9" stroke="#f59e0b" strokeWidth="1.5" />
          <line x1="30" y1="13" x2="32" y2="13" stroke="#f59e0b" strokeWidth="1.5" />
          <line x1="30" y1="17" x2="32" y2="17" stroke="#f59e0b" strokeWidth="1.5" />
          <line x1="30" y1="21" x2="32" y2="21" stroke="#f59e0b" strokeWidth="1.5" />
          <line x1="30" y1="25" x2="32" y2="25" stroke="#f59e0b" strokeWidth="1.5" />
          <line x1="30" y1="29" x2="32" y2="29" stroke="#f59e0b" strokeWidth="1.5" />
        </svg>
      );

    // 4. Arduino Leonardo
    case 'arduino_leonardo':
      return (
        <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="4" y="6" width="32" height="28" rx="2" fill="#0891b2" stroke="#22d3ee" strokeWidth="1.2" />
          <rect x="2" y="10" width="6" height="5" rx="1" fill="#94a3b8" />
          <rect x="2" y="23" width="8" height="9" rx="1.5" fill="#1e293b" />
          <rect x="16" y="15" width="8" height="8" transform="rotate(45 20 19)" fill="#18181b" />
          <rect x="13" y="7" width="21" height="3" fill="#18181b" />
          <rect x="13" y="30" width="21" height="3" fill="#18181b" />
        </svg>
      );

    // 5. ESP8266 NodeMCU
    case 'esp8266_nodemcu':
      return (
        <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="8" y="5" width="24" height="30" rx="2" fill="#1e293b" stroke="#475569" strokeWidth="1.2" />
          <rect x="15" y="3" width="10" height="4" rx="1" fill="#94a3b8" />
          {/* ESP-12E Silver Module */}
          <rect x="11" y="14" width="18" height="15" rx="1.5" fill="#94a3b8" stroke="#cbd5e1" strokeWidth="0.8" />
          {/* PCB Antenna */}
          <path d="M12 29 H28 M14 31 H26 M16 33 H24" stroke="#f59e0b" strokeWidth="1.2" />
        </svg>
      );

    // 6. ESP32 DevKit
    case 'esp32_devkit':
      return (
        <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="8" y="4" width="24" height="32" rx="2" fill="#18181b" stroke="#3f3f46" strokeWidth="1.2" />
          <rect x="15" y="2" width="10" height="4" rx="1" fill="#94a3b8" />
          {/* WROOM-32 Shield */}
          <rect x="11" y="12" width="18" height="14" rx="1.5" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="0.8" />
          {/* Serpentine Antenna */}
          <path d="M11 28 Q15 30 20 28 T29 28" stroke="#d97706" strokeWidth="1.8" fill="none" />
          <circle cx="12" cy="8" r="1.5" fill="#3b82f6" />
          <circle cx="28" cy="8" r="1.5" fill="#ef4444" />
        </svg>
      );

    // 7. ESP32-CAM
    case 'esp32_cam':
      return (
        <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="9" y="6" width="22" height="28" rx="2" fill="#1e293b" stroke="#334155" strokeWidth="1.2" />
          {/* Camera Lens */}
          <rect x="14" y="13" width="12" height="12" rx="2" fill="#0f172a" stroke="#d97706" strokeWidth="1.2" />
          <circle cx="20" cy="19" r="4" fill="#0284c7" />
          <circle cx="20" cy="19" r="2" fill="#09090b" />
          {/* Flash LED */}
          <rect x="18" y="27" width="4" height="4" rx="1" fill="#fef08a" />
        </svg>
      );

    // 8. Raspberry Pi Pico
    case 'raspberry_pi_pico':
      return (
        <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="10" y="5" width="20" height="30" rx="2" fill="#16a34a" stroke="#4ade80" strokeWidth="1.2" />
          <rect x="15" y="3" width="10" height="4" rx="1" fill="#94a3b8" />
          {/* RP2040 chip */}
          <rect x="16" y="16" width="8" height="8" rx="1" fill="#18181b" stroke="#22c55e" strokeWidth="0.8" />
          {/* BOOTSEL Button */}
          <circle cx="14" cy="10" r="1.5" fill="#f8fafc" />
        </svg>
      );

    // 9. Raspberry Pi Pico W
    case 'raspberry_pi_pico_w':
      return (
        <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="10" y="5" width="20" height="30" rx="2" fill="#16a34a" stroke="#4ade80" strokeWidth="1.2" />
          <rect x="15" y="3" width="10" height="4" rx="1" fill="#94a3b8" />
          <rect x="16" y="13" width="8" height="8" rx="1" fill="#18181b" />
          {/* Silver Wi-Fi can */}
          <rect x="13" y="23" width="14" height="9" rx="1" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="0.8" />
        </svg>
      );

    // 10. Raspberry Pi 4
    case 'raspberry_pi_4':
      return (
        <svg width={size} height={size} viewBox="0 0 44 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="3" y="6" width="38" height="28" rx="2" fill="#15803d" stroke="#22c55e" strokeWidth="1.2" />
          {/* RJ45 & USB Ports */}
          <rect x="33" y="8" width="9" height="7" rx="1" fill="#94a3b8" />
          <rect x="33" y="17" width="9" height="7" rx="1" fill="#0284c7" />
          <rect x="33" y="25" width="9" height="7" rx="1" fill="#1e293b" />
          {/* BCM2711 SoC */}
          <rect x="14" y="13" width="10" height="10" rx="1" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="0.8" />
          {/* 40-Pin GPIO */}
          <rect x="6" y="7" width="22" height="3" fill="#18181b" />
        </svg>
      );

    // 11. STM32 Blue Pill
    case 'stm32_blue_pill':
      return (
        <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="10" y="5" width="20" height="30" rx="2" fill="#1d4ed8" stroke="#60a5fa" strokeWidth="1.2" />
          <rect x="15" y="3" width="10" height="4" rx="1" fill="#94a3b8" />
          {/* STM32 Chip */}
          <rect x="16" y="16" width="8" height="8" transform="rotate(45 20 20)" fill="#18181b" />
          {/* Yellow Jumpers */}
          <rect x="13" y="10" width="3" height="4" fill="#facc15" />
          <rect x="18" y="10" width="3" height="4" fill="#facc15" />
          <circle cx="25" cy="11" r="1.5" fill="#ef4444" />
        </svg>
      );

    // Breadboards
    case 'breadboard_full':
    case 'breadboard_half':
    case 'breadboard_mini':
      return (
        <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="4" y="6" width="32" height="28" rx="2.5" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.2" />
          {/* Power rail stripes */}
          <line x1="6" y1="8" x2="34" y2="8" stroke="#ef4444" strokeWidth="1.5" />
          <line x1="6" y1="11" x2="34" y2="11" stroke="#3b82f6" strokeWidth="1.5" />
          <line x1="6" y1="29" x2="34" y2="29" stroke="#ef4444" strokeWidth="1.5" />
          <line x1="6" y1="32" x2="34" y2="32" stroke="#3b82f6" strokeWidth="1.5" />
          {/* Center Trench */}
          <line x1="6" y1="20" x2="34" y2="20" stroke="#cbd5e1" strokeWidth="2.5" />
          {/* Hole dots */}
          <circle cx="10" cy="15" r="1" fill="#0f172a" />
          <circle cx="15" cy="15" r="1" fill="#0f172a" />
          <circle cx="20" cy="15" r="1" fill="#0f172a" />
          <circle cx="25" cy="15" r="1" fill="#0f172a" />
          <circle cx="30" cy="15" r="1" fill="#0f172a" />
          <circle cx="10" cy="25" r="1" fill="#0f172a" />
          <circle cx="15" cy="25" r="1" fill="#0f172a" />
          <circle cx="20" cy="25" r="1" fill="#0f172a" />
          <circle cx="25" cy="25" r="1" fill="#0f172a" />
          <circle cx="30" cy="25" r="1" fill="#0f172a" />
        </svg>
      );

    case 'perfboard':
    case 'stripboard':
    case 'pcb_prototype':
      return (
        <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="4" y="6" width="32" height="28" rx="2" fill={type === 'pcb_prototype' ? '#166534' : '#b45309'} stroke="#d97706" strokeWidth="1.2" />
          {/* Gold hole grid */}
          {[10, 15, 20, 25, 30].map((x) =>
            [12, 17, 22, 27].map((y) => (
              <circle key={`${x}-${y}`} cx={x} cy={y} r="1.3" fill="#facc15" stroke="#78350f" strokeWidth="0.5" />
            ))
          )}
        </svg>
      );

    // Wires & Cables
    case 'wire_m2m':
    case 'wire_m2f':
    case 'wire_f2f':
    case 'wire_solid_core':
    case 'wire_multicolor':
    case 'wire_alligator':
      return (
        <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Curved wire */}
          <path d="M6 30 C12 10, 28 10, 34 30" stroke={color} strokeWidth="3" fill="none" strokeLinecap="round" />
          {/* Terminal boots */}
          <rect x="4" y="27" width="5" height="7" rx="1" fill="#18181b" />
          <rect x="31" y="27" width="5" height="7" rx="1" fill="#18181b" />
          {/* Pins */}
          <line x1="6.5" y1="34" x2="6.5" y2="38" stroke="#f59e0b" strokeWidth="1.8" />
          <line x1="33.5" y1="34" x2="33.5" y2="38" stroke="#f59e0b" strokeWidth="1.8" />
        </svg>
      );

    case 'cable_usb_ab':
    case 'cable_micro_usb':
    case 'cable_usb_c':
    case 'cable_ribbon':
      return (
        <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M8 20 C14 10, 26 30, 32 20" stroke="#0284c7" strokeWidth="4" fill="none" />
          <rect x="4" y="16" width="7" height="8" rx="1.5" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1" />
          <rect x="29" y="16" width="7" height="8" rx="1.5" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1" />
        </svg>
      );

    // Connectors & Accessories
    case 'header_male_40':
    case 'header_female_40':
      return (
        <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="4" y="16" width="32" height="8" rx="1" fill="#18181b" stroke="#3f3f46" strokeWidth="1" />
          {[7, 12, 17, 22, 27, 32].map((x) => (
            <line key={x} x1={x} y1="10" x2={x} y2="28" stroke="#f59e0b" strokeWidth="1.6" />
          ))}
        </svg>
      );

    case 'terminal_block_2p':
      return (
        <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="8" y="10" width="24" height="20" rx="2" fill="#15803d" stroke="#22c55e" strokeWidth="1.2" />
          <circle cx="14" cy="16" r="3" fill="#cbd5e1" stroke="#475569" strokeWidth="0.8" />
          <circle cx="26" cy="16" r="3" fill="#cbd5e1" stroke="#475569" strokeWidth="0.8" />
          <line x1="12" y1="16" x2="16" y2="16" stroke="#1e293b" strokeWidth="1" />
          <line x1="24" y1="16" x2="28" y2="16" stroke="#1e293b" strokeWidth="1" />
          <rect x="11" y="23" width="6" height="5" rx="1" fill="#09090b" />
          <rect x="23" y="23" width="6" height="5" rx="1" fill="#09090b" />
        </svg>
      );

    case 'connector_jst_xh':
      return (
        <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="10" y="12" width="20" height="16" rx="2" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.2" />
          <rect x="13" y="10" width="14" height="4" fill="#e2e8f0" />
          <circle cx="16" cy="20" r="1.5" fill="#f59e0b" />
          <circle cx="24" cy="20" r="1.5" fill="#f59e0b" />
        </svg>
      );

    case 'dc_barrel_jack':
      return (
        <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="8" y="12" width="24" height="16" rx="2" fill="#18181b" stroke="#3f3f46" strokeWidth="1.2" />
          <circle cx="28" cy="20" r="6" fill="#94a3b8" />
          <circle cx="28" cy="20" r="3.5" fill="#09090b" />
          <circle cx="28" cy="20" r="1.2" fill="#cbd5e1" />
        </svg>
      );

    case 'breadboard_psu_module':
      return (
        <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="6" y="8" width="28" height="24" rx="2" fill="#1e293b" stroke="#334155" strokeWidth="1.2" />
          <circle cx="12" cy="15" r="3" fill="#18181b" stroke="#cbd5e1" />
          <rect x="8" y="22" width="6" height="6" rx="1" fill="#cbd5e1" />
          <rect x="22" y="13" width="7" height="6" rx="1" fill="#2563eb" />
          <circle cx="25" cy="24" r="2" fill="#22c55e" />
        </svg>
      );

    // Existing / Robotics Subsystems
    case 'chassis':
      return (
        <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="6" y="8" width="28" height="24" rx="3" fill="#334155" stroke="#64748b" strokeWidth="1.2" />
          <circle cx="10" cy="12" r="1.5" fill="#0f172a" />
          <circle cx="30" cy="12" r="1.5" fill="#0f172a" />
          <circle cx="10" cy="28" r="1.5" fill="#0f172a" />
          <circle cx="30" cy="28" r="1.5" fill="#0f172a" />
          <rect x="15" y="14" width="10" height="12" rx="1" fill="#1e293b" />
        </svg>
      );

    case 'dc_motor':
      return (
        <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="12" y="11" width="18" height="18" rx="2" fill="#eab308" stroke="#ca8a04" strokeWidth="1.2" />
          <rect x="6" y="14" width="7" height="12" rx="1" fill="#cbd5e1" />
          <circle cx="21" cy="20" r="3" fill="#f8fafc" stroke="#94a3b8" />
          <rect x="20" y="12" width="2" height="16" fill="#f8fafc" />
        </svg>
      );

    case 'wheel':
      return (
        <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="20" cy="20" r="15" fill="#0f172a" stroke="#334155" strokeWidth="2" />
          <circle cx="20" cy="20" r="8" fill="#eab308" />
          <circle cx="20" cy="20" r="3" fill="#0f172a" />
        </svg>
      );

    case 'servo':
      return (
        <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="8" y="12" width="24" height="16" rx="2" fill="#2563eb" stroke="#3b82f6" strokeWidth="1.2" />
          <circle cx="25" cy="20" r="5" fill="#f8fafc" />
          <line x1="25" y1="15" x2="25" y2="25" stroke="#cbd5e1" strokeWidth="1.5" />
          <circle cx="25" cy="20" r="2" fill="#1e293b" />
        </svg>
      );

    case 'led':
      return (
        <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M14 26 C14 16, 26 16, 26 26 Z" fill={color} stroke="#fca5a5" strokeWidth="1" />
          <rect x="13" y="26" width="14" height="3" rx="0.5" fill={color} />
          <line x1="17" y1="29" x2="17" y2="35" stroke="#94a3b8" strokeWidth="1.5" />
          <line x1="23" y1="29" x2="23" y2="37" stroke="#94a3b8" strokeWidth="1.5" />
        </svg>
      );

    case 'ultrasonic':
      return (
        <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="5" y="12" width="30" height="16" rx="2" fill="#0284c7" stroke="#38bdf8" strokeWidth="1.2" />
          <circle cx="13" cy="20" r="5.5" fill="#94a3b8" stroke="#f8fafc" strokeWidth="1" />
          <circle cx="13" cy="20" r="3" fill="#18181b" />
          <circle cx="27" cy="20" r="5.5" fill="#94a3b8" stroke="#f8fafc" strokeWidth="1" />
          <circle cx="27" cy="20" r="3" fill="#18181b" />
        </svg>
      );

    case 'potentiometer':
      return (
        <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="20" cy="20" r="13" fill="#06b6d4" stroke="#22d3ee" strokeWidth="1.2" />
          <circle cx="20" cy="20" r="7" fill="#0f172a" />
          <line x1="20" y1="13" x2="20" y2="20" stroke="#f8fafc" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );

    case 'line_sensor':
      return (
        <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="8" y="10" width="24" height="20" rx="2" fill="#2563eb" stroke="#60a5fa" strokeWidth="1.2" />
          <rect x="14" y="15" width="5" height="7" rx="1" fill="#09090b" />
          <rect x="21" y="15" width="5" height="7" rx="1" fill="#0284c7" />
          <circle cx="14" cy="26" r="1.5" fill="#22c55e" />
          <circle cx="26" cy="26" r="1.5" fill="#ef4444" />
        </svg>
      );

    default:
      return (
        <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="8" y="8" width="24" height="24" rx="3" fill="#1e293b" stroke="#475569" strokeWidth="1.2" />
          <circle cx="20" cy="20" r="5" fill="#38bdf8" />
        </svg>
      );
  }
};
