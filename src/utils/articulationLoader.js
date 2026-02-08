/**
 * Utility to load articulation images from src/assets/articulation_img
 * Filename format: [id]_[symbol].gif
 */

// Import all .gif files from the directory dynamically
const articulationImages = import.meta.glob('../assets/img/articulation_img/*.gif', { eager: true });

/**
 * Parses the filename to extract ID and Symbol.
 * Expects path like: "/src/assets/articulation_img/1_ɑ.gif" or "../assets/articulation_img/1_ɑ.gif"
 */
const imageMap = {};

Object.keys(articulationImages).forEach((path) => {
    // Extract filename from path (e.g., "1_ɑ.gif")
    const filename = path.split('/').pop();
    if (!filename) return;

    // Remove extension
    const nameWithoutExt = filename.replace(/\.[^/.]+$/, "");

    // Normalize (NFC) to handle special characters consistently
    const normalizedName = nameWithoutExt.normalize('NFC');

    // Split by underscore: [id, symbol]
    const parts = normalizedName.split('_');
    if (parts.length >= 2) {
        const id = parts[0];
        const symbol = parts[1];

        // Store by ID and Symbol for flexible lookup
        const imageUrl = articulationImages[path].default;
        imageMap[id] = imageUrl;

        // Also store by symbol if needed (might have duplicates, ID is safer)
        if (!imageMap[symbol]) {
            imageMap[symbol] = imageUrl;
        }
    }
});

// Debug: Log loaded keys to verify file reading
console.log('%c[ArticulationLoader] Loaded Keys:', 'color: blue; font-weight: bold;', Object.keys(imageMap));

/**
 * Get articulation image by ID (preferred) or Symbol.
 * @param {string|number} id - The pronunciation item ID (e.g., 1)
 * @param {string} symbol - The IPA symbol (e.g., 'ɑ')
 * @returns {string|null} - The image source URL or null if not found
 */
export const getArticulationImage = (id, symbol) => {
    const safeSymbol = symbol ? symbol.normalize('NFC') : null;
    const safeId = id ? String(id) : null;

    // 1. Try lookup by ID
    if (safeId && imageMap[safeId]) {
        console.log(`[ArticulationLoader] Found by ID: ${safeId}`);
        return imageMap[safeId];
    }

    // 2. Try lookup by Symbol
    if (safeSymbol && imageMap[safeSymbol]) {
        console.log(`[ArticulationLoader] Found by Symbol: ${safeSymbol}`);
        return imageMap[safeSymbol];
    }

    console.warn(`[ArticulationLoader] Not found for id=${safeId}, symbol=${safeSymbol}. Available keys:`, Object.keys(imageMap));
    return null;
};

export default getArticulationImage;
