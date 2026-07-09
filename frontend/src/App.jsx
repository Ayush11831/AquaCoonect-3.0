// frontend/src/App.jsx
import React, { useState } from 'react';
import { AppBar, Toolbar, Typography, Container, Tabs, Tab, Box } from '@mui/material';
import ComplaintForm from './components/ComplaintForm';
import ComplaintDashboard from './components/ComplaintDashboard';

function TabPanel({ value, index, children }) {
    if (value !== index) return null;
    return <Box sx={{ py: 3 }}>{children}</Box>;
}

export default function App() {
    const [tab, setTab] = useState(0);

    return (
        <>
            <AppBar position="static">
                <Toolbar>
                    <Typography variant="h6" sx={{ flexGrow: 1 }}>
                        AquaConnect · Bhopal Water Issues
                    </Typography>
                </Toolbar>
            </AppBar>

            <Container maxWidth="lg">
                <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{ mt: 2 }}>
                    <Tab label="Report an Issue" />
                    <Tab label="Officer Dashboard" />
                </Tabs>

                <TabPanel value={tab} index={0}>
                    <ComplaintForm />
                </TabPanel>
                <TabPanel value={tab} index={1}>
                    <ComplaintDashboard />
                </TabPanel>
            </Container>
        </>
    );
}
