
import React from 'react';

const DungeonIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M4 20h16"/>
        <path d="M6 20V10"/>
        <path d="M12 20V4"/>
        <path d="M18 20V10"/>
        <path d="M4 10h4"/>
        <path d="M10 10h4"/>
        <path d="M16 10h4"/>
        <path d="M10 4h4"/>
    </svg>
);

export default DungeonIcon;
