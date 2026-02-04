/**
 * API service for handling backend requests
 */

const API_BASE_URL = 'http://127.0.0.1:8000';

/**
 * Sends an image file to the backend for pneumonia prediction
 * @param {File} file - The image file to analyze
 * @returns {Promise<Object>} - The prediction result { score, label, threshold }
 */
export const analyzeImage = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    // The backend expects 'type=image/jpeg' or similar in the Content-Type header for the file part,
    // but browsers handle this automatically when using FormData.
    // The previous curl command showed: -F 'file=@xray-normal.jpeg;type=image/jpeg'
    // Standard FormData append uses the file's type property automatically.

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
