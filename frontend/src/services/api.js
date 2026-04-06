/**
 * API service for handling backend requests
 */

const API_BASE_URL = 'http://127.0.0.1:8000';

/**
 * Sends an image file to the backend for pneumonia prediction
 * @param {File} file - The image file to analyze
 * @param {string} userId - The Firebase Auth UID of the current user
 * @param {string} patientId - The patient ID entered by the user
 * @returns {Promise<Object>} - The prediction result { score, label, threshold, image_url }
 */
export const analyzeImage = async (file, userId, patientId) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('user_id', userId);
    formData.append('patient_id', patientId);

    try {
        const response = await fetch(`${API_BASE_URL}/predict`, {
            method: 'POST',
            headers: {
                'accept': 'application/json',
            },
            body: formData,
        });

        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error analyzing image:', error);
        throw error;
    }
};

/**
 * Fetches the analysis history for a given user
 * @param {string} userId - The Firebase Auth UID of the user
 * @returns {Promise<Object>} - The history { history: [...] }
 */
export const fetchHistory = async (userId) => {
    try {
        const response = await fetch(`${API_BASE_URL}/history/${userId}`, {
            method: 'GET',
            headers: {
                'accept': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching history:', error);
        throw error;
    }
};
