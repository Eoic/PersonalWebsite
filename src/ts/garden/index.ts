import { initGarden } from './garden';

document.addEventListener('DOMContentLoaded', () => {
    const root = document.querySelector<HTMLElement>('[data-garden-root]');

    if (root) 
        initGarden(root);
});
