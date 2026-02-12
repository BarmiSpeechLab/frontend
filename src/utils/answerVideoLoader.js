/**
 * Utility to load answer videos from src/assets/img/answer
 * Filename format: [id].mp4
 */

// Import all .mp4 files from the directory dynamically
const answerVideos = import.meta.glob('../assets/img/answer/*.mp4', { eager: true });

const videoMap = {};

Object.keys(answerVideos).forEach((path) => {
    // Extract filename from path (e.g., "44.mp4")
    const filename = path.split('/').pop();
    if (!filename) return;

    // Remove extension to get ID
    const id = filename.replace(/\.[^/.]+$/, "");

    // Store by ID
    videoMap[id] = answerVideos[path].default;
});

console.log('%c[AnswerVideoLoader] Loaded Videos:', 'color: green; font-weight: bold;', Object.keys(videoMap));

/**
 * Get answer video by ID.
 * @param {string|number} id - The pronunciation item ID (e.g., 44)
 * @returns {string|null} - The video source URL or null if not found
 */
export const getAnswerVideo = (id) => {
    const safeId = id ? String(id) : null;

    if (safeId && videoMap[safeId]) {
        console.log(`[AnswerVideoLoader] Found by ID: ${safeId}`);
        return videoMap[safeId];
    }

    console.warn(`[AnswerVideoLoader] Not found for id=${safeId}. Available keys:`, Object.keys(videoMap));
    return null;
};

export default getAnswerVideo;
