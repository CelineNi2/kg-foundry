export const ENTITY_COLORS: Record<string, string> = {
    'PERSON': '#3b82f6',       // Blue
    'ORGANIZATION': '#ef4444', // Red
    'LOCATION': '#10b981',     // Green
    'CONCEPT': '#8b5cf6',      // Purple
    'EVENT': '#f59e0b',        // Amber
    'PRODUCT': '#ec4899',      // Pink
    'WORK_OF_ART': '#06b6d4',  // Cyan
};

export const getHashColor = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h = Math.abs(hash) % 360;
    return `hsl(${h}, 70%, 45%)`;
};

export const getEntityTypeColor = (type: string) => {
    const upperType = type.toUpperCase();
    return ENTITY_COLORS[upperType] || getHashColor(upperType || 'UNKNOWN');
};
