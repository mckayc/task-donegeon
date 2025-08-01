import React from 'react';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface ToggleSwitchProps {
    enabled: boolean;
    setEnabled: (enabled: boolean) => void;
    label: string;
    id?: string;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ enabled, setEnabled, label, id }) => {
    const switchId = id || `toggle-${label.replace(/\s+/g, '-').toLowerCase()}`;
    return (
        <div className="flex items-center space-x-2">
            <Switch id={switchId} checked={enabled} onCheckedChange={setEnabled} />
            {label && <Label htmlFor={switchId}>{label}</Label>}
        </div>
    );
};

export default ToggleSwitch;
