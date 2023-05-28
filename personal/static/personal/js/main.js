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

    const computeEntryTimespans = () => {
        const timespans = document.querySelectorAll('div[data-timespan]')
        
        timespans.forEach((timespan) => {
            const durationElement = [].find.call(timespan.children, ((item) => item.getAttribute('data-duration') === ''));
            const dateFrom = new Date(durationElement.getAttribute('data-date-from'));
            const dateTo = durationElement.getAttribute('data-date-to') || new Date();
            let months = (dateTo.getFullYear() - dateFrom.getFullYear()) * 12;
            months -= dateFrom.getMonth();
            months += dateTo.getMonth();
            months = months <= 0 ? 0 : months;

            if (months < 1) {
                durationElement.innerHTML = "(Less than a month)"
                return;
            }

            const years = Math.floor(months / 12);
            months = months % 12;

            durationElement.innerHTML = '(';

            if (years > 0) {
                durationElement.innerHTML += `${years} year${years > 1 ? 's' : ''}`;
            }

            if (months > 0) {
                durationElement.innerHTML += `${years > 0 ? ', ' : ''}${months} month${months > 1 ? 's' : ''}`;
            }

            durationElement.innerHTML += ')';
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

        computeEntryTimespans();
        loadPreferredTheme(themeSwitchBtn);
    });
})();