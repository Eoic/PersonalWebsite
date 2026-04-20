export function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
}

export const isMobile = (): boolean => {
    if (navigator.userAgentData) 
        return navigator.userAgentData.mobile;
  
    return /Mobi|Android/i.test(navigator.userAgent);
};
