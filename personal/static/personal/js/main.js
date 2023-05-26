(() => {
    const loadPreferredTheme = (themeSwitchBtn) => {
        const nextTheme = localStorage.getItem('theme') || 'dark';
        const currentTheme = nextTheme === 'dark' ? 'light' : 'dark';
        switchTheme(currentTheme, nextTheme, themeSwitchBtn);
    }
    
    const switchTheme = (currentTheme, nextTheme, themeSwitchBtn) => {
        const body = document.body;
        body.setAttribute('data-theme', nextTheme);
        body.classList.remove(currentTheme);
        body.classList.add(nextTheme);
        themeSwitchBtn.setAttribute('data-next-theme', currentTheme);
        localStorage.setItem('theme', nextTheme);
    }

    const handleThemeSwitch = (event) => {
        const body = document.body;
        const currentTheme = body.dataset.theme;
        const nextTheme = event.target.dataset.nextTheme;

        if (nextTheme) {
            switchTheme(currentTheme, nextTheme, event.target);
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        const themeSwitchBtn = document.getElementById('theme-switcher');

        if (themeSwitchBtn) {
            themeSwitchBtn.addEventListener('click', handleThemeSwitch);
        }

        loadPreferredTheme(themeSwitchBtn);
    });
})();