// frontend/src/api.js
// Central axios instance. In dev, REACT_APP_API_URL is empty so calls stay
// relative ("/api/...") and go through the CRA proxy. In a Firebase Hosting
// build, set REACT_APP_API_URL to the deployed backend origin
// (e.g. https://aquaconnect-api.onrender.com) so the static SPA calls it directly.
import axios from 'axios';

const api = axios.create({
    baseURL: process.env.REACT_APP_API_URL || '',
});

export default api;
