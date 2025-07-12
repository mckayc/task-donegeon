

import React from 'react';

const iconProps = {
  xmlns: "http://www.w3.org/2000/svg",
  fill: "none",
  viewBox: "0 0 24 24",
  strokeWidth: 1.5,
  stroke: "currentColor",
  className: "w-6 h-6 mr-3"
};

export const DashboardIcon: React.FC = () => (
  <svg {...iconProps}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h12A2.25 2.25 0 0020.25 14.25V3.75M3.75 3.75h16.5M3.75 3.75L12 10.5l8.25-6.75" />
  </svg>
);

export const AvatarIcon: React.FC = () => (
    <svg {...iconProps}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
);

export const QuestsIcon: React.FC = () => (
  <svg {...iconProps}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
  </svg>
);

export const MarketplaceIcon: React.FC = () => (
    <svg {...iconProps}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.25a.75.75 0 01-.75-.75v-7.5a.75.75 0 01.75-.75h7.5a.75.75 0 01.75.75v7.5a.75.75 0 01-.75.75zM13.5 8.25h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h.008v.008h-.008v-.008zm0 0H9.75m-1.5-1.5H1.5a.75.75 0 00-.75.75V21a.75.75 0 00.75.75h16.5a.75.75 0 00.75-.75V3.75a.75.75 0 00-.75-.75H3.75a.75.75 0 00-.75.75v4.5z" />
    </svg>
);

export const CalendarIcon: React.FC = () => (
    <svg {...iconProps}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0h18M-3 11.25h18" />
    </svg>
);

export const ProgressIcon: React.FC = () => (
    <svg {...iconProps}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
);

export const ChroniclesIcon: React.FC = () => (
    <svg {...iconProps}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
    </svg>
);

export const GuildIcon: React.FC = () => (
    <svg {...iconProps}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.75a3 3 0 00-3-3H9a3 3 0 00-3 3v.158c0 1.22-.977 2.203-2.193 2.203h-.012a2.25 2.25 0 01-2.25-2.25V6.75a2.25 2.25 0 012.25-2.25h.012c1.217 0 2.193-.983 2.193-2.203V2.25a2.25 2.25 0 012.25-2.25h6a2.25 2.25 0 012.25 2.25v.158c0 1.22.977 2.203 2.193 2.203h.012a2.25 2.25 0 012.25 2.25v9.75a2.25 2.25 0 01-2.25 2.25h-.012c-1.217 0-2.193.983-2.193 2.203v.158z" />
    </svg>
);

export const TrophyIcon: React.FC = () => (
    <svg {...iconProps}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9a7.5 7.5 0 100-15h9a7.5 7.5 0 100 15zM3 18.75V9.75" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 2.25c-3.314 0-6 2.686-6 6s2.686 6 6 6 6-2.686 6-6-2.686-6-6-6zM9 9l3 3m0 0l3-3m-3 3V3" />
    </svg>
);

export const RankIcon: React.FC = () => (
  <svg {...iconProps}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1.125-1.5M9 16.5l1.125-1.5M9 16.5v3.75m0-10.5l-1.125-1.5M9 6l1.125-1.5" />
  </svg>
);

export const CharacterIcon: React.FC = () => (
    <svg {...iconProps}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

export const AdminIcon: React.FC = () => (
    <svg {...iconProps}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75l3 3m0 0l3-3m-3 3v-7.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

export const ManageUsersIcon: React.FC = () => (
    <svg {...iconProps}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-4.67c.12-.318.239-.636.354-.964M15 19.128c-1.097 0-2.136-.13-3.122-.362M7.5 14.25c0-1.06-.366-2.022-.973-2.808A9.07 9.07 0 004.5 9.75c-.868 0-1.707.133-2.524.382-1.076.325-2.132.754-3.11 1.258l.01 9.42a25.12 25.12 0 002.518-1.05A12.292 12.292 0 017.5 14.25z" />
    </svg>
);

export const ManageQuestsIcon: React.FC = () => (
    <svg {...iconProps}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
    </svg>
);

export const ManageMarketsIcon: React.FC = () => (
    <svg {...iconProps}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5a.75.75 0 00.75-.75V6.75a.75.75 0 00-.75-.75H3.75a.75.75 0 00-.75.75v13.5a.75.75 0 00.75.75zM8.25 16.5a.75.75 0 01-1.5 0V12a.75.75 0 011.5 0v4.5zM12.75 16.5a.75.75 0 01-1.5 0V12a.75.75 0 011.5 0v4.5zM17.25 16.5a.75.75 0 01-1.5 0V12a.75.75 0 011.5 0v4.5zM4.5 3.75a.75.75 0 01.75-.75h13.5a.75.75 0 010 1.5H5.25a.75.75 0 01-.75-.75z" />
    </svg>
);

export const ManageGuildsIcon: React.FC = () => (
    <svg {...iconProps}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h18M3 7.5h18M3 12h18M3 16.5h18" />
    </svg>
);

export const RewardsIcon: React.FC = () => (
    <svg {...iconProps}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12.75 8.25v-1.5a.75.75 0 00-1.5 0v1.5a.75.75 0 001.5 0zM12.75 12.75v-1.5a.75.75 0 00-1.5 0v1.5a.75.75 0 001.5 0zM12.75 17.25v-1.5a.75.75 0 00-1.5 0v1.5a.75.75 0 001.5 0zM5.25 8.25v-1.5a.75.75 0 011.5 0v1.5a.75.75 0 01-1.5 0zM5.25 12.75v-1.5a.75.75 0 011.5 0v1.5a.75.75 0 01-1.5 0zM5.25 17.25v-1.5a.75.75 0 011.5 0v1.5a.75.75 0 01-1.5 0zM9 8.25v-1.5a.75.75 0 011.5 0v1.5a.75.75 0 01-1.5 0zM9 12.75v-1.5a.75.75 0 011.5 0v1.5a.75.75 0 01-1.5 0zM9 17.25v-1.5a.75.75 0 011.5 0v1.5a.75.75 0 01-1.5 0zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

export const DigitalAssetsIcon: React.FC = () => (
    <svg {...iconProps}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.94 12.122l-2.08-3.604m2.08 3.604l3.603 2.08m-3.603-2.08l-3.604 2.08m3.604-2.08l2.08 3.604M12 3.75a8.25 8.25 0 100 16.5 8.25 8.25 0 000-16.5z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 12a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
    </svg>
);

export const SettingsIcon: React.FC = () => (
    <svg {...iconProps}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-1.007 1.113-1.113l.448-.11c.54-.133 1.096-.133 1.636 0l.448.11c.554.106 1.023.571 1.113 1.113l.068.418c.49.373.954.801 1.38 1.28l.317.317c.426.426.954.757 1.514.93l.415.127c.524.16.98.497 1.294.94l.261.364c.32.44.474.979.474 1.514v.448c-.046.549-.247 1.06-.57 1.486l-.272.359c-.314.413-.57.878-.778 1.38l-.068.418c-.09.542-.56 1.007-1.113 1.113l-.448.11c-.54.133-1.096-.133-1.636 0l-.448-.11c-.554-.106-1.023-.571-1.113-1.113l-.068-.418c-.49-.373-.954-.801-1.38-1.28l-.317-.317c-.426-.426-.954-.757-1.514-.93l-.415-.127c-.524-.16-.98-.497-1.294-.94l-.261-.364c-.32-.44-.474-.979-.474-1.514v-.448c.046-.549.247 1.06.57-1.486l.272.359c.314-.413-.57-.878.778-1.38l.068-.418zM12 15a3 3 0 100-6 3 3 0 000 6z" />
    </svg>
);

export const ApprovalsIcon: React.FC = () => (
    <svg {...iconProps}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

export const ChevronDownIcon: React.FC<{className?: string}> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
  </svg>
);

export const HelpIcon: React.FC = () => (
    <svg {...iconProps}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
    </svg>
);

export const ManageRanksIcon: React.FC = () => (
    <svg {...iconProps}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345h5.584a.563.563 0 01.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 21.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988h5.584a.563.563 0 00.475-.345L11.48 3.5z" />
    </svg>
);

export const ManageTrophiesIcon: React.FC = () => (
    <svg {...iconProps}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9a7.5 7.5 0 100-15h9a7.5 7.5 0 100 15zM3 18.75V9.75" />
    </svg>
);

export const ThemeIcon: React.FC = () => (
    <svg {...iconProps}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.098 19.902a3.75 3.75 0 005.304 0l6.401-6.402a3.75 3.75 0 00-5.304-5.304L4.098 14.598a3.75 3.75 0 000 5.304z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 19.5h.008v.008h-.008v-.008zM16.5 16.5h.008v.008h-.008v-.008zM13.5 13.5h.008v.008h-.008v-.008zM10.5 10.5h.008v.008h-.008v-.008z" />
    </svg>
);