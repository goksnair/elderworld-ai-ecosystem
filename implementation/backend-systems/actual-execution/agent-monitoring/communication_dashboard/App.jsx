// React Demo App Entry Point - App.jsx
import React from 'react';
import AgentMonitorDashboard from './AgentMonitorDashboardComplete';

const App = () => {
    return (
        <div className="App">
            <AgentMonitorDashboard
                websocketUrl="ws://localhost:8080/agent-monitor"
                apiEndpoint="/api/agent-monitor"
                autoConnect={true}
            />
        </div>
    );
};

export default App;
