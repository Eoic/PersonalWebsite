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

    const handleTabSwitch = (event) => {
        const main = document.body.getElementsByTagName('main')[0];
        const sections = main.getElementsByTagName('section');

        [].forEach.call(event.target.parentElement.children, (element) => {
            if (element === event.target) {
                element.setAttribute('data-active', '');
                return;
            }

            element.removeAttribute('data-active');
        });

        [].forEach.call(sections, (element) => {
            if (element.dataset.content === event.target.dataset.contentTarget) {
                element.setAttribute('data-active', '');
                return;
            }

            element.removeAttribute('data-active');
        });
    }

    document.addEventListener('DOMContentLoaded', () => {
        const themeSwitchBtn = document.getElementById('theme-switcher');
        const tabsNavigator = document.getElementById('tabs');

        if (themeSwitchBtn) {
            themeSwitchBtn.addEventListener('click', handleThemeSwitch);
        }

        if (tabsNavigator) {
            tabsNavigator.addEventListener('click', handleTabSwitch);
        }

        loadPreferredTheme(themeSwitchBtn);
    });
})();