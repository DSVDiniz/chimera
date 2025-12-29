import * as vscode from 'vscode';

const smartSplit = (text: string): string[] => {
    const parts: string[] = [];
    let currentPart = '';
    let inQuote: string | null = null;
    let parenLevel = 0;
    let braceLevel = 0;
    let bracketLevel = 0;

    for (let i = 0; i < text.length; i++) {
        const char = text[i];

        if (inQuote) {
            currentPart += char;
            if (char === inQuote && text[i - 1] !== '\\') {
                inQuote = null;
            }
        } else {
            switch (char) {
                case '"':
                case "'":
                case '`':
                    inQuote = char;
                    currentPart += char;
                    break;
                case '(': parenLevel++; currentPart += char; break;
                case ')': parenLevel--; currentPart += char; break;
                case '{': braceLevel++; currentPart += char; break;
                case '}': braceLevel--; currentPart += char; break;
                case '[': bracketLevel++; currentPart += char; break;
                case ']': bracketLevel--; currentPart += char; break;
                case ',':
                    if (parenLevel === 0 && braceLevel === 0 && bracketLevel === 0) {
                        parts.push(currentPart.trim());
                        currentPart = '';
                    } else {
                        currentPart += char;
                    }
                    break;
                default:
                    currentPart += char;
            }
        }
    }
    if (currentPart.trim()) {
        parts.push(currentPart.trim());
    }
    return parts;
};

export const splitArguments = async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        return;
    }

    const selections = editor.selections;

    await editor.edit((editBuilder) => {
        for (const selection of selections) {
            if (selection.isEmpty) {
                continue;
            }

            const text = editor.document.getText(selection);

            const parts = smartSplit(text);

            const newText = parts.join(',\n');
            editBuilder.replace(selection, newText);
        }
    });
};

export const unsplitArguments = async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        return;
    }

    const document = editor.document;
    const selections = editor.selections;

    await editor.edit((editBuilder) => {
        for (const selection of selections) {
            if (selection.isEmpty) {
                continue;
            }

            const startLine = document.lineAt(selection.start.line);
            const endLine = document.lineAt(selection.end.line);
            const range = new vscode.Range(startLine.range.start, endLine.range.end);

            const text = document.getText(range);
            const lines = text.split('\n');

            const trimmedLines = lines.map(line => line.trim());

            const newText = trimmedLines.reduce((acc, curr, idx) => {
                if (idx === 0) {
                    return curr;
                }
                const prev = trimmedLines[idx - 1];
                if (prev.endsWith(',')) {
                    return acc + curr;
                }
                return acc + ' ' + curr;
            }, '');
            editBuilder.replace(range, newText);
        }
    });
};
