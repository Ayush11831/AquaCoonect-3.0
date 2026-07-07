// frontend/src/components/ComplaintForm.jsx
import React, { useState } from 'react';
import { 
    TextField, 
    Select, 
    MenuItem, 
    Button, 
    Box, 
    Typography,
    CircularProgress 
} from '@mui/material';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import axios from 'axios';

const ComplaintForm = () => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        issue_type: '',
        latitude: 23.2599,
        longitude: 77.4126
    });
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(false);
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        
        const formDataObj = new FormData();
        Object.keys(formData).forEach(key => {
            formDataObj.append(key, formData[key]);
        });
        
        images.forEach(image => {
            formDataObj.append('images', image);
        });
        
        try {
            const response = await axios.post('/api/complaints/submit', formDataObj, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            alert(`Complaint submitted! Priority Score: ${response.data.priority_score}`);
            // Reset form
        } catch (error) {
            alert('Error submitting complaint');
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
            <Typography variant="h5" gutterBottom>
                Report Water Issue
            </Typography>
            
            <TextField
                fullWidth
                label="Title"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                margin="normal"
                required
            />
            
            <Select
                fullWidth
                value={formData.issue_type}
                onChange={(e) => setFormData({...formData, issue_type: e.target.value})}
                displayEmpty
                margin="normal"
                required
            >
                <MenuItem value="">Select Issue Type</MenuItem>
                <MenuItem value="pipe_breakage">Pipe Breakage</MenuItem>
                <MenuItem value="water_leakage">Water Leakage</MenuItem>
                <MenuItem value="water_logging">Water Logging</MenuItem>
                <MenuItem value="contamination">Water Contamination</MenuItem>
                <MenuItem value="low_pressure">Low Water Pressure</MenuItem>
            </Select>
            
            <Box sx={{ height: '300px', width: '100%', my: 2 }}>
                <MapContainer 
                    center={[formData.latitude, formData.longitude]} 
                    zoom={13} 
                    style={{ height: '100%', width: '100%' }}
                >
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <LocationPicker 
                        onLocationSelect={(lat, lng) => 
                            setFormData({...formData, latitude: lat, longitude: lng})
                        }
                    />
                </MapContainer>
            </Box>
            
            <Button
                variant="contained"
                component="label"
                sx={{ mr: 2 }}
            >
                Upload Photos
                <input
                    type="file"
                    hidden
                    multiple
                    accept="image/*"
                    onChange={(e) => setImages([...e.target.files])}
                />
            </Button>
            
            <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={loading}
                sx={{ mt: 2 }}
            >
                {loading ? <CircularProgress size={24} /> : 'Submit Complaint'}
            </Button>
        </Box>
    );
};

export default ComplaintForm;