(() => {
    if (typeof EventSource === 'undefined') {
        console.warn('[DEV] SSE not supported — live reload disabled.');
        return;
    }

    try {
        const source = new EventSource('/dev/events');
        source.addEventListener('reload', () => window.location.reload());
        source.onopen = () => console.info('[DEV] Live reload connected.');
        source.onerror = () => console.warn('[DEV] Live reload connection lost — retrying...');
    } catch (error) {
        console.warn('[DEV] Live reload not available:', error);
    }
})();
