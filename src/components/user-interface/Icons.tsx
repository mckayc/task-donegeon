import React from 'react';
// FIX: Exporting all required icons from lucide-react with aliases to match the codebase's conventions.
// This resolves a large number of "module has no exported member" errors across the application.
export { 
    ChevronsUpDown, Maximize, Minimize, Minus, ZoomIn, ZoomOut, Eye, EyeOff, Star, Sun, Moon, BookOpen, Bookmark, BookmarkPlus,
    ChevronDown as ChevronDownIcon, 
    ArrowLeft as ArrowLeftIcon, 
    ArrowRight as ArrowRightIcon, 
    Menu as MenuIcon, 
    Monitor as DeviceDesktopIcon, 
    Smartphone as DevicePhoneMobileIcon, 
    Bell as BellIcon,
    CheckCircle2 as CheckCircleIcon, 
    XCircle as XCircleIcon, 
    Sparkles as SparklesIcon, 
    Filter as FilterIcon, 
    MoreVertical as EllipsisVerticalIcon, 
    Package as CollectionIcon,
    Users as SwitchUserIcon, 
    BarChart2 as ChartBarIcon, 
    CalendarDays as CalendarDaysIcon, 
    Download as ArrowDownTrayIcon, 
    ChevronUp as ChevronUpIcon, 
    Pencil as PencilIcon,
    Trash2 as TrashIcon, 
    Play as PlayIcon, 
    Archive as ArchiveBoxIcon, 
    FolderOpen as FolderOpenIcon, 
    Zap as ZapIcon, 
    Compass as CompassIcon, 
    ToggleLeft as ToggleLeftIcon, 
    MousePointerClick as MousePointerClickIcon, 
    MessageSquare as MessageSquareIcon,
    Copy as CopyIcon, 
    CheckBadge as CheckBadgeIcon, 
    Database as DatabaseIcon,
    GripVertical as GrabHandleIcon,
    Users as UserGroupIcon,
    Plus as PlusIcon
} from 'lucide-react';

const iconProps = {
  xmlns: "http://www.w3.org/2000/svg",
  fill: "none",
  viewBox: "0 0 24 24",
  strokeWidth: 1.5,
  stroke: "currentColor",
};

// Custom Icons that don't have a direct 1:1 in lucide or need a specific style
export const BookmarkSolidIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className || "w-6 h-6"}>
        <path d="M17 3H7a2 2 0 0 0-2 2v16l7-3 7 3V5a2 2 0 0 0-2-2z" />
    </svg>
);

export const RankIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg {...iconProps} className={className || "w-6 h-6"}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-6.75c-.621 0-1.125.504-1.125 1.125V18.75m9 0h-9" />
    </svg>
);

export const MarketplaceIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg {...iconProps} className={className || "w-6 h-6"}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5A.75.75 0 0114.25 12h.01a.75.75 0 01.75.75V21m-4.5 0v-7.5A.75.75 0 0110.5 12h.01a.75.75 0 01.75.75V21m-4.5 0v-7.5A.75.75 0 016.75 12h.01a.75.75 0 01.75.75V21m-4.5 0h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v12A2.25 2.25 0 004.5 21z" />
    </svg>
);

export const ItemManagerIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg {...iconProps} className={className || "w-6 h-6"}>
         <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4" />
    </svg>
);

export const QuestsIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg {...iconProps} className={className || "w-6 h-6"}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456L18 15.75z" />
    </svg>
);

export const GuildIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg {...iconProps} className={className || "w-6 h-6"}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" />
    </svg>
);

export const AdjustmentsIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg {...iconProps} className={className || "w-6 h-6"}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
    </svg>
);

export const EnterFullscreenIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg {...iconProps} className={className || "w-6 h-6"}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
    </svg>
);
export const ExitFullscreenIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg {...iconProps} className={className || "w-6 h-6"}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 9L3.75 3.75M3.75 3.75h4.5m-4.5 0v4.5m11.25-4.5h4.5m-4.5 0v4.5M9 15l-5.25 5.25m0-4.5v4.5m0-4.5h4.5m11.25 0h-4.5m4.5 0v-4.5" />
    </svg>
);
