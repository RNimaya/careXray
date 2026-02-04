export const simulateDetection = async (file) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            // Logic: 
            // - If filename contains "pneumonia", return detected.
            // - If filename contains "normal", return normal.
            // - Otherwise, random result.

            const name = file.name.toLowerCase();
            let result = 'normal';
            let confidence = 0.85 + (Math.random() * 0.14); // 85% - 99%

            if (name.includes('pneumonia')) {
                result = 'pneumonia';
            } else if (name.includes('normal')) {
                result = 'normal';
            } else {
                result = Math.random() > 0.5 ? 'pneumonia' : 'normal';
            }

            resolve({
                diagnosis: result,
                confidence: confidence.toFixed(2),
                timestamp: new Date().toISOString()
            });
        }, 2500); // 2.5s delay to simulate processing
    });
};
