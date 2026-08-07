// backend/src/services/mlService.js
const axios = require('axios');
const config = require('../config/config');

/**
 * Ask the ML microservice to score a complaint's priority.
 * The service is treated as best-effort: if it is unreachable or errors,
 * we fall back to a neutral score so complaint submission never fails
 * just because the model is down.
 *
 * @param {{latitude:number, longitude:number, issue_type:string}} payload
 * @returns {Promise<{priority_score:number, risk_level?:string, environmental_data?:any}>}
 */
async function callMLService(payload) {
    try {
        const { data } = await axios.post(
            `${config.mlServiceUrl}/predict/priority`,
            payload,
            { timeout: 8000 }
        );
        return data;
    } catch (err) {
        console.error('ML service unavailable, using fallback score:', err.message);
        return { priority_score: 50, risk_level: 'MEDIUM', fallback: true, environmental_data: null };
    }
}

module.exports = { callMLService };
