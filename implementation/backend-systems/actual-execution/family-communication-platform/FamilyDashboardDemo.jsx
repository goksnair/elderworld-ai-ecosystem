/**
 * Family Dashboard Demo Page
 * Meta-Prompt 2 Implementation Verification
 * Tests the NRI-Focused Family Dashboard component
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { CssBaseline } from '@mui/material';
import FamilyDashboard from './FamilyDashboard';

// Demo App component
const FamilyDashboardDemo = () => {
    // Demo family member ID (NRI family in USA)
    const demoFamilyId = '456e7890-e89b-12d3-a456-426614174001';

    return (
        <>
            <CssBaseline />
            <FamilyDashboard
                familyId={demoFamilyId}
                initialTimezone="America/Los_Angeles"
                initialCurrency="USD"
            />
        </>
    );
};

// Render the demo if this file is used directly
if (typeof document !== 'undefined') {
    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(<FamilyDashboardDemo />);
}

export default FamilyDashboardDemo;
