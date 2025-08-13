(() => {
    const SSE_PORT = 35730;

    try {
        const source = new EventSource(`http://localhost:${SSE_PORT}/events`);
        source.addEventListener('reload', () => window.location.reload());
        source.onopen = () => console.info('[DEV] Live reload connected.');
    } catch (error) {
        console.warn('[DEV] Live reload not available:', error);
    }
})();
