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
        isContinuing = true;
        for (let i = 0; i < selections.length; i++) {
            if (!selections[i].isEqual(lastResultSelections[i])) {
                isContinuing = false;
                break;
            }
        }
    }

    if (!isContinuing) {
        originalSelectionsText = [];
        for (let i = 0; i < selections.length; i++) {
            const currentText = editor.document.getText(selections[i]);
            originalSelectionsText.push(currentText);
        }
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

            const converter = caseConverters[nextCase];
            const newText = converter(originalText);

            editBuilder.replace(selection, newText);
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
        const hasUpperAfterUnderscore = /_[A-Z]/.test(text);
        if (hasUpperAfterUnderscore) {
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

const toCamelCase = (text: string): string => {
    const words = text
        .replace(/([A-Z])/g, ' $1')
        .replace(/_/g, ' ')
        .trim()
        .toLowerCase()
        .split(/\s+/);

    if (words.length === 0) {
        return text;
    }

    return words[0] + words.slice(1).map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('');
};

const toPascalCase = (text: string): string => {
    const words = text
        .replace(/([A-Z])/g, ' $1')
        .replace(/[_-]/g, ' ')
        .trim()
        .toLowerCase()
        .split(/\s+/);

    if (words.length === 0) {
        return text;
    }

    return words.map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('');
};

const toUpperSnakeCase = (text: string): string => {
    const words = text
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/[_-]/g, ' ')
        .trim()
        .toLowerCase()
        .split(/\s+/);

    if (words.length === 0) {
        return text;
    }

    return words.join('_').toUpperCase();
};

const toSnakeCase = (text: string): string => {
    const words = text
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/[_-]/g, ' ')
        .trim()
        .toLowerCase()
        .split(/\s+/);

    if (words.length === 0) {
        return text;
    }

    return words.join('_');
};

const toSnakeCamelCase = (text: string): string => {
    const words = text
        .replace(/([A-Z])/g, ' $1')
        .replace(/[_-]/g, ' ')
        .trim()
        .toLowerCase()
        .split(/\s+/);

    if (words.length === 0) {
        return text;
    }

    return words[0] + words.slice(1).map(word => '_' + word.charAt(0).toUpperCase() + word.slice(1)).join('');
};

const toSnakePascalCase = (text: string): string => {
    if (text.includes('_') || text.includes('-')) {
        const words = text
            .split(/[_-]/)
            .filter(w => w.length > 0)
            .map(w => w.toLowerCase());

        if (words.length === 0) {
            return text;
        }

        return words.map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('_');
    }
    const words = text
        .replace(/([A-Z])/g, ' $1')
        .trim()
        .toLowerCase()
        .split(/\s+/);

    if (words.length === 0) {
        return text;
    }

    return words.map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('_');
};

const toKebabCase = (text: string): string => {
    return text
        .replace(/([A-Z])/g, '-$1')
        .replace(/[\s_]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-/, '')
        .toLowerCase();
};

const toUpperKebabCase = (text: string): string => {
    return text
        .replace(/([A-Z])/g, '-$1')
        .replace(/[\s_]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-/, '')
        .toUpperCase();
};

const caseConverters: Record<CaseType, (text: string) => string> = {
    camel: toCamelCase,
    pascal: toPascalCase,
    upper: (text: string) => text.toUpperCase(),
    upperSnake: toUpperSnakeCase,
    snake: toSnakeCase,
    snakeCamel: toSnakeCamelCase,
    snakePascal: toSnakePascalCase,
    kebab: toKebabCase,
    upperKebab: toUpperKebabCase,
    lower: (text: string) => text.replace(/[-_]/g, '').toLowerCase()
};
