import React, { useState, useEffect, useMemo } from 'react';
import { Battery, BatteryCharging, BatteryLow, BatteryFull } from 'lucide-react';

// Define the BatteryManager interface as it might not be in default TS libs
interface BatteryManager extends EventTarget {
  charging: boolean;
  chargingTime: number;
  dischargingTime: number;
  level: number;
}

const BatteryStatus: React.FC = () => {
    const [batteryInfo, setBatteryInfo] = useState<{ level: number; charging: boolean } | null>(null);
    const [isSupported, setIsSupported] = useState(false);

    useEffect(() => {
        if ('getBattery' in navigator) {
            setIsSupported(true);
            let batteryManager: BatteryManager | null = null;

            const updateBatteryStatus = (battery: BatteryManager) => {
                setBatteryInfo({
                    level: battery.level,
                    charging: battery.charging
                });
            };

            const navigatorWithBattery = navigator as Navigator & { getBattery: () => Promise<BatteryManager> };

            navigatorWithBattery.getBattery().then((battery: BatteryManager) => {
                batteryManager = battery;
                updateBatteryStatus(batteryManager);

                batteryManager.addEventListener('levelchange', () => updateBatteryStatus(batteryManager!));
                batteryManager.addEventListener('chargingchange', () => updateBatteryStatus(batteryManager!));
            });

            return () => {
                if (batteryManager) {
                    // Re-declare to satisfy TS removeEventListener type check
                    const onLevelChange = () => updateBatteryStatus(batteryManager!);
                    const onChargingChange = () => updateBatteryStatus(batteryManager!);
                    batteryManager.removeEventListener('levelchange', onLevelChange);
                    batteryManager.removeEventListener('chargingchange', onChargingChange);
                }
            };
        }
    }, []);

    const batteryDisplay = useMemo(() => {
        if (!isSupported || !batteryInfo) {
            return null;
        }

        const { level, charging } = batteryInfo;
        const percentage = Math.round(level * 100);

        if (charging) {
            return {
                Icon: BatteryCharging,
                color: 'text-sky-400',
                title: `Charging (${percentage}%)`
            };
        }
        if (percentage <= 15) {
            return {
                Icon: BatteryLow,
                color: 'text-red-500',
                title: `Low Battery (${percentage}%)`
            };
        }
        if (percentage <= 30) {
            return {
                Icon: BatteryMedium,
                color: 'text-yellow-400',
                title: `Battery: ${percentage}%`
            };
        }
        return {
            Icon: BatteryFull,
            color: 'text-green-400',
            title: `Battery: ${percentage}%`
        };
    }, [isSupported, batteryInfo]);

    if (!batteryDisplay) {
        return null;
    }
    
    const { Icon, color, title } = batteryDisplay;

    return (
        <div title={title} className={`flex items-center gap-1 font-semibold text-sm ${color}`}>
            <Icon className="w-5 h-5" />
            <span>{Math.round((batteryInfo?.level || 0) * 100)}%</span>
        </div>
    );
};

// A medium battery icon, as it's not in lucide-react by default
const BatteryMedium: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect width="16" height="10" x="2" y="7" rx="2" ry="2"/>
      <line x1="20" x2="20" y1="11" y2="13"/>
      <line x1="6" x2="6" y1="11" y2="13"/>
      <line x1="10" x2="10" y1="11" y2="13"/>
    </svg>
);


export default BatteryStatus;
