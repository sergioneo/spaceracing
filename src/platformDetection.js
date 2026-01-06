/**
 * Detects the platform (PC or Mobile) based on user agent and touch capabilities
 * @returns {string} 'pc' or 'mobile'
 */
export function detectPlatform() {
    // Check for touch capability
    const isTouchDevice = 'ontouchstart' in window ||
                         navigator.maxTouchPoints > 0 ||
                         navigator.msMaxTouchPoints > 0;

    // Check user agent for mobile patterns
    const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
    const isMobileUA = mobileRegex.test(navigator.userAgent);

    // Check for small screen size (tablets and phones)
    const isSmallScreen = window.innerWidth <= 1024;

    // Determine platform: if any mobile indicator is true, it's mobile
    if ((isTouchDevice && isSmallScreen) || isMobileUA) {
        return 'mobile';
    }

    return 'pc';
}

/**
 * Gets a human-readable platform name
 * @returns {string} 'PC' or 'Mobile'
 */
export function getPlatformName() {
    const platform = detectPlatform();
    return platform === 'pc' ? 'PC' : 'Mobile';
}
