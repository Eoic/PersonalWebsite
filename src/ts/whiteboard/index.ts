import { initWhiteboard } from './whiteboard';

document.addEventListener('DOMContentLoaded', () => {
    const root = document.querySelector<HTMLElement>('[data-whiteboard-root]');

    if (root) 
        initWhiteboard(root);
});
