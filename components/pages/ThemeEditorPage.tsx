import React, { useState, useEffect, useRef } from 'react';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import { ThemeDefinition, ThemeStyle } from '../../types';
import { Button } from '../ui/Button';
import { Card, CardContent } from '../ui/Card';
import { Input } from '../ui/Input';
import { getContrast, getWcagRating, hslValuesToCss, parseHslString, hexToHsl, rgbToHex, hslToRgb } from '../../utils/colors';
import { TrophyIcon, RankIcon } from '../ui/Icons';
import ThemeIdeaGenerator from '../quests/ThemeIdeaGenerator';
import ConfirmDialog from '../ui/ConfirmDialog';
import SimpleColorPicker from '../ui/SimpleColorPicker';
import { Label } from '@/components/ui/Label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/Select';

const FONT_OPTIONS = [
    "'MedievalSharp', cursive", "'Uncial Antiqua', cursive", "'Press Start 2P', cursive", "'IM Fell English SC', serif", 
    "'Cinzel Decorative', cursive", "'Comic Neue', 'cursive'", "'Special Elite', cursive", "'Metamorphous', serif", 
    "'Almendra', serif", "'Almendra Display', serif", "'Almendra SC', serif", "'Butcherman', cursive", 
    "'Creepster', cursive", "'Eater', cursive", "'Fondamento', cursive", "'Fruktur', cursive", "'Griffy', cursive", 
    "'Henny Penny', cursive", "'New Rocker', cursive", "'Nosifer', cursive", "'Pirata One', cursive", "'Rye', cursive", 
    "'Sancreek', cursive", "'Smokum', cursive", "'Roboto', sans-serif", "'Lora', serif", "'Vollkorn', serif", 
    "'EB Garamond', serif", "'Cormorant Garamond', serif", "'Crimson Pro', serif", "'Cinzel', serif"
];


const ContrastChecker: React.FC<{ styles: ThemeStyle }> = ({ styles }) => {
    const pairs = [
        { label: "Text on Primary BG", fg: styles['--color-text-primary'], bg: styles['--color-bg-primary'] },
        { label: "Secondary Text on Primary BG", fg: styles['--color-text-secondary'], bg: styles['--color-bg-primary'] },
        { label: