// frontend/src/App.jsx
import React, { useState } from 'react';
import {
    AppBar,
    Toolbar,
    Typography,
    Container,
    Tabs,
    Tab,
    Box,
    Paper,
    Avatar,
} from '@mui/material';
import ComplaintForm from './components/ComplaintForm';
import ComplaintDashboard from './components/ComplaintDashboard';

function TabPanel({ value, index, children }) {
    if (value !== index) return null;
    return (
        <Paper
            elevation={0}
            sx={{
                p: { xs: 2, md: 4 },
                borderRadius: 4,
            }}
        >
            {children}
        </Paper>
    );
}

export default function App() {
    const [tab, setTab] = useState(0);

    return (
        <>
            <AppBar position="sticky">
                <Toolbar>
                    <Avatar
                        sx={{
                            mr: 1.5,
                            bgcolor: 'rgba(255,255,255,0.15)',
                            border: '1px solid rgba(255,255,255,0.25)',
                        }}
                    >
                        💧
                    </Avatar>
                    <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="h6" sx={{ lineHeight: 1.1 }}>
                            AquaConnect
                        </Typography>
                        <Typography variant="caption" sx={{ opacity: 0.75 }}>
                            Bhopal Water Issues
                        </Typography>
                    </Box>
                </Toolbar>
            </AppBar>

            <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
                <Tabs
                    value={tab}
                    onChange={(e, v) => setTab(v)}
                    sx={{
                        mb: 3,
                        '& .MuiTab-root': { color: 'rgba(255,255,255,0.7)' },
                        '& .Mui-selected': { color: '#fff !important' },
                        '& .MuiTabs-indicator': {
                            height: 3,
                            borderRadius: 3,
                            background: 'linear-gradient(90deg, #3b5bb5, #6b8cff)',
                        },
                    }}
                >
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
