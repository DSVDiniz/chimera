import * as vscode from 'vscode';

export let originalSelectionsText: string[] = [];
let lastResultSelections: readonly vscode.Selection[] = [];
type CaseType = 'camel' | 'pascal' | 'upper' | 'upperSnake' | 'snake' | 'snakeCamel' | 'snakePascal' | 'kebab' | 'upperKebab' | 'lower';
let defaultCycle: CaseType[] = ['camel', 'pascal', 'upper', 'upperSnake', 'snakePascal', 'snakeCamel', 'kebab', 'upperKebab', 'lower'];

export const cycleCasing = async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        return;
    }
    const selections = editor.selections;
    if (!selections || selections.length === 0) {
        return;
    }

    const config = vscode.workspace.getConfiguration('chimera');
    const cycleOrder = config.get<CaseType[]>('cycleCasingOrder', defaultCycle);

    let isContinuing = false;
    if (lastResultSelections.length === selections.length) {
        isContinuing = selections.every((sel, i) => sel.isEqual(lastResultSelections[i]));
    }

    if (!isContinuing) {
        originalSelectionsText = selections.map(sel => editor.document.getText(sel));
    }

    await editor.edit((editBuilder) => {
        for (let i = 0; i < selections.length; i++) {
            const selection = selections[i];
            if (selection.isEmpty) {
                continue;
            }
            const originalText = originalSelectionsText[i];
            const currentText = editor.document.getText(selection);
            const currentCase = detectCase(currentText);

            const currentIndex = cycleOrder.indexOf(currentCase);
            const nextIndex = (currentIndex + 1) % cycleOrder.length;
            const nextCase = cycleOrder[nextIndex];

            editBuilder.replace(selection, caseConverters[nextCase](originalText));
        }
    });

    lastResultSelections = [...editor.selections];
};

const detectCase = (text: string): CaseType => {
    if (!text || text.length === 0) {
        return 'lower';
    }

    if (text.includes('-')) {
        if (text === text.toUpperCase() && text !== text.toLowerCase()) {
            return 'upperKebab';
        }
        return 'kebab';
    }

    if (text.includes('_')) {
        if (text === text.toUpperCase() && text !== text.toLowerCase()) {
            return 'upperSnake';
        }
        if (/_[A-Z]/.test(text)) {
            if (/^[A-Z]/.test(text)) {
                return 'snakePascal';
            }
            return 'snakeCamel';
        }
        return 'snake';
    }

    if (text === text.toUpperCase() && text !== text.toLowerCase()) {
        return 'upper';
    }
    if (text === text.toLowerCase()) {
        return 'lower';
    }
    if (/^[A-Z]/.test(text)) {
        return 'pascal';
    }
    return 'camel';
};

const splitIntoWords = (text: string): string[] => {
    return text
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/[_-]/g, ' ')
        .trim()
        .toLowerCase()
        .split(/\s+/)
        .filter(w => w.length > 0);
};

const capitalize = (word: string): string => word.charAt(0).toUpperCase() + word.slice(1);

const caseConverters: Record<CaseType, (text: string) => string> = {
    camel: (text) => {
        const words = splitIntoWords(text);
        if (words.length === 0) {
            return text;
        }
        return words[0] + words.slice(1).map(capitalize).join('');
    },
    pascal: (text) => {
        const words = splitIntoWords(text);
        if (words.length === 0) {
            return text;
        }
        return words.map(capitalize).join('');
    },
    upper: (text) => text.toUpperCase(),
    upperSnake: (text) => {
        const words = splitIntoWords(text);
        if (words.length === 0) {
            return text;
        }
        return words.join('_').toUpperCase();
    },
    snake: (text) => {
        const words = splitIntoWords(text);
        if (words.length === 0) {
            return text;
        }
        return words.join('_');
    },
    snakeCamel: (text) => {
        const words = splitIntoWords(text);
        if (words.length === 0) {
            return text;
        }
        return words[0] + words.slice(1).map(w => '_' + capitalize(w)).join('');
    },
    snakePascal: (text) => {
        const words = splitIntoWords(text);
        if (words.length === 0) {
            return text;
        }
        return words.map(capitalize).join('_');
    },
    kebab: (text) => {
        const words = splitIntoWords(text);
        if (words.length === 0) {
            return text;
        }
        return words.join('-');
    },
    upperKebab: (text) => {
        const words = splitIntoWords(text);
        if (words.length === 0) {
            return text;
        }
        return words.join('-').toUpperCase();
    },
    lower: (text) => text.replace(/[-_]/g, '').toLowerCase()
};

export const swapCase = async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        return;
    }

    await editor.edit((editBuilder) => {
        for (const selection of editor.selections) {
            if (selection.isEmpty) {
                continue;
            }
            const text = editor.document.getText(selection);
            let swapped = '';
            for (const c of text) {
                if (c === c.toUpperCase()) {
                    swapped += c.toLowerCase();
                } else {
                    swapped += c.toUpperCase();
                }
            }
            editBuilder.replace(selection, swapped);
        }
    });
};
