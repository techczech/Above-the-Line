import React from 'react';

const ArrowPathIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M16.4 18.2A8.5 8.5 0 1 1 20 12h-4" />
        <polyline points="20 8 20 12 16 12" />
    </svg>
);

export default ArrowPathIcon;
