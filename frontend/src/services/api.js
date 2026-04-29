/**
 * API service for handling backend requests
 */
import { auth } from '../firebase';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

const getFirebaseIdToken = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
        throw new Error('You must be signed in to use the API.');
    }

    return currentUser.getIdToken();
};

const withAuthQuery = (url, token) => {
    if (!url) return url;

    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}token=${encodeURIComponent(token)}`;
};

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
        const token = await getFirebaseIdToken();
        const response = await fetch(`${API_BASE_URL}/predict`, {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: formData,
        });

        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
        }

        const data = await response.json();
        return {
            ...data,
            image_url: withAuthQuery(data.image_url, token),
            heatmap_url: withAuthQuery(data.heatmap_url, token),
        };
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
        const token = await getFirebaseIdToken();
        const response = await fetch(`${API_BASE_URL}/history/${userId}`, {
            method: 'GET',
            headers: {
                'accept': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
        }

        const data = await response.json();
        return {
            ...data,
            history: (data.history || []).map((item) => ({
                ...item,
                image_url: withAuthQuery(item.image_url, token),
                heatmap_url: withAuthQuery(item.heatmap_url, token),
            })),
        };
    } catch (error) {
        console.error('Error fetching history:', error);
        throw error;
    }
};
