import { Stroke } from './types';

const MAX_HISTORY = 50;

export type HistoryAction = {
    action: 'draw' | 'erase';
    stroke: Stroke;
};

export interface WhiteboardHistory {
    pointer: number;
    stack: HistoryAction[];
    record(action: HistoryAction): void;
    undo(): HistoryAction | null;
    redo(): HistoryAction | null;
    clear(): void;
};

export function createHistory(): WhiteboardHistory {
    return {
        stack: [],
        pointer: -1,
        record(action: HistoryAction) {
            if (this.pointer < this.stack.length - 1) 
                this.stack = this.stack.slice(0, this.pointer + 1);

            this.stack.push(action);

            if (this.stack.length > MAX_HISTORY) 
                this.stack.shift();
            else this.pointer++;
        },
        undo() {
            if (this.pointer < 0)
                return null;

            return this.stack[this.pointer--];
        },
        redo() {
            if (this.pointer >= this.stack.length - 1)
                return null;

            return this.stack[++this.pointer];
        },
        clear() {
            this.stack = [];
            this.pointer = -1;
        },
    };
}
