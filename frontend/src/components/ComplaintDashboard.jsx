// frontend/src/components/ComplaintDashboard.jsx
import React, { useState, useEffect } from 'react';
import {
    DataGrid,
    GridToolbar,
    GridActionsCellItem
} from '@mui/x-data-grid';
import {
    Box,
    Typography,
    Chip,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    TextField,
    Button
} from '@mui/material';
import {
    CheckCircle,
    Visibility,
    Map as MapIcon
} from '@mui/icons-material';
import api from '../api';

const ComplaintDashboard = () => {
    const [complaints, setComplaints] = useState([]);
    const [selectedComplaint, setSelectedComplaint] = useState(null);
    const [responseDialog, setResponseDialog] = useState(false);
    const [responseText, setResponseText] = useState('');
    
    const columns = [
        { field: 'id', headerName: 'ID', width: 70 },
        { field: 'title', headerName: 'Title', width: 200 },
        { 
            field: 'priority_score', 
            headerName: 'Priority', 
            width: 120,
            renderCell: (params) => (
                <Chip 
                    label={params.value}
                    color={getPriorityColor(params.value)}
                    variant="outlined"
                />
            )
        },
        { field: 'issue_type', headerName: 'Type', width: 150 },
        { field: 'address', headerName: 'Location', width: 200 },
        { field: 'created_at', headerName: 'Reported', width: 180 },
        {
            field: 'status',
            headerName: 'Status',
            width: 130,
            renderCell: (params) => (
                <Chip 
                    label={params.value}
                    color={getStatusColor(params.value)}
                />
            )
        },
        {
            field: 'actions',
            type: 'actions',
            width: 100,
            getActions: (params) => [
                <GridActionsCellItem
                    icon={<Visibility />}
                    label="View Details"
                    onClick={() => setSelectedComplaint(params.row)}
                />,
                <GridActionsCellItem
                    icon={<CheckCircle />}
                    label="Mark Resolved"
                    onClick={() => handleResolve(params.id)}
                    disabled={params.row.status === 'resolved'}
                />
            ]
        }
    ];
    
    useEffect(() => {
        fetchComplaints();
    }, []);
    
    const fetchComplaints = async () => {
        const response = await api.get('/api/complaints/list?sort_by=priority');
        setComplaints(response.data.data);
    };
    
    const getPriorityColor = (score) => {
        if (score >= 80) return 'error';
        if (score >= 60) return 'warning';
        if (score >= 40) return 'info';
        return 'success';
    };

    const getStatusColor = (status) => {
        if (status === 'resolved') return 'success';
        if (status === 'in_progress') return 'info';
        return 'default';
    };
    
    const handleResolve = (id) => {
        setSelectedComplaint(complaints.find(c => c.id === id));
        setResponseDialog(true);
    };
    
    const submitResponse = async () => {
        await api.post(`/api/complaints/${selectedComplaint.id}/respond`, {
            action_taken: responseText
        });
        setResponseDialog(false);
        fetchComplaints(); // Refresh list
    };
    
    return (
        <Box sx={{ height: '80vh', width: '100%' }}>
            <Typography variant="h4" gutterBottom>
                Water Complaints Dashboard
            </Typography>
            
            <DataGrid
                rows={complaints}
                columns={columns}
                pageSize={10}
                rowsPerPageOptions={[10, 25, 50]}
                components={{ Toolbar: GridToolbar }}
                sx={{
                    mt: 2,
                    border: 0,
                    backgroundColor: 'transparent',
                    '& .MuiDataGrid-columnHeaders': {
                        backgroundColor: 'rgba(255,255,255,0.4)',
                        borderRadius: 2,
                    },
                    '& .MuiDataGrid-cell': { borderColor: 'rgba(11,35,48,0.08)' },
                    '& .MuiDataGrid-footerContainer': { borderColor: 'rgba(11,35,48,0.08)' },
                    '& .MuiDataGrid-row:hover': { backgroundColor: 'rgba(255,255,255,0.35)' },
                }}
            />
            
            {/* Response Dialog */}
            <Dialog open={responseDialog} onClose={() => setResponseDialog(false)}>
                <DialogTitle>Submit Resolution</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Action Taken"
                        fullWidth
                        multiline
                        rows={4}
                        value={responseText}
                        onChange={(e) => setResponseText(e.target.value)}
                    />
                    <Button onClick={submitResponse} variant="contained" sx={{ mt: 2 }}>
                        Submit Response
                    </Button>
                </DialogContent>
            </Dialog>
        </Box>
    );
};

export default ComplaintDashboard;