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

const findParentheses = (text: string, cursorOffset: number): { openParen: number; closeParen: number } | null => {
    let parenLevel = 0;
    let openParen = -1;

    for (let i = cursorOffset; i >= 0; i--) {
        const char = text[i];
        if (char === ')') {
            parenLevel++;
        } else if (char === '(') {
            if (parenLevel === 0) {
                openParen = i;
                break;
            }
            parenLevel--;
        }
    }

    if (openParen === -1) {
        return null;
    }

    parenLevel = 0;
    let closeParen = -1;
    for (let i = openParen; i < text.length; i++) {
        const char = text[i];
        if (char === '(') {
            parenLevel++;
        } else if (char === ')') {
            parenLevel--;
            if (parenLevel === 0) {
                closeParen = i;
                break;
            }
        }
    }

    if (closeParen === -1) {
        return null;
    }

    return { openParen, closeParen };
};

const smartSplitPreserveWhitespace = (text: string): string[] => {
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

const smartSplitPreserveRaw = (text: string): string[] => {
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
                        parts.push(currentPart);
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
    if (currentPart) {
        parts.push(currentPart);
    }
    return parts;
};

const findArgumentIndex = (args: string[], cursorOffsetInArgs: number): number => {
    let currentOffset = 0;
    for (let i = 0; i < args.length; i++) {
        const argLength = args[i].length;
        const endOffset = currentOffset + argLength;
        if (cursorOffsetInArgs <= endOffset) {
            return i;
        }
        currentOffset = endOffset + 1;
    }
    return args.length - 1;
};

const findArgumentIndexRaw = (rawArgs: string[], cursorOffsetInArgs: number): number => {
    let currentOffset = 0;
    for (let i = 0; i < rawArgs.length; i++) {
        const argLength = rawArgs[i].length;
        const endOffset = currentOffset + argLength;
        if (cursorOffsetInArgs <= endOffset) {
            return i;
        }
        currentOffset = endOffset + 1;
    }
    return rawArgs.length - 1;
};

export const moveArgument = async (direction: 'left' | 'right') => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        return;
    }

    const document = editor.document;
    const cursorPosition = editor.selection.active;

    const fullText = document.getText();
    const cursorOffset = document.offsetAt(cursorPosition);

    const parens = findParentheses(fullText, cursorOffset);
    if (!parens) {
        return;
    }

    const argsText = fullText.substring(parens.openParen + 1, parens.closeParen);
    const rawArgs = smartSplitPreserveRaw(argsText);
    const args = rawArgs.map(a => a.trim());

    if (args.length < 2) {
        return;
    }

    const cursorOffsetInArgs = cursorOffset - parens.openParen - 1;
    const argIndex = findArgumentIndexRaw(rawArgs, cursorOffsetInArgs);

    let targetIndex: number;
    if (direction === 'left') {
        if (argIndex <= 0) {
            return;
        }
        targetIndex = argIndex - 1;
    } else {
        if (argIndex >= args.length - 1) {
            return;
        }
        targetIndex = argIndex + 1;
    }

    const newArgs = [...args];
    [newArgs[argIndex], newArgs[targetIndex]] = [newArgs[targetIndex], newArgs[argIndex]];

    const newArgsText = newArgs.join(', ');

    const startPos = document.positionAt(parens.openParen + 1);
    const endPos = document.positionAt(parens.closeParen);
    const range = new vscode.Range(startPos, endPos);

    let newCursorOffsetInArgs = 0;
    for (let i = 0; i < targetIndex; i++) {
        newCursorOffsetInArgs += newArgs[i].length + 2;
    }
    const newCursorOffset = parens.openParen + 1 + newCursorOffsetInArgs;

    await editor.edit((editBuilder) => {
        editBuilder.replace(range, newArgsText);
    });

    const newPosition = document.positionAt(newCursorOffset);
    editor.selection = new vscode.Selection(newPosition, newPosition);
};


