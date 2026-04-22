import * as vscode from 'vscode';

export const alignCursors = async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        return;
    }

    const selections = editor.selections;
    if (!selections || selections.length < 2) {
        return;
    }

    let maxCol = 0;
    for (const selection of selections) {
        if (selection.start.character > maxCol) {
            maxCol = selection.start.character;
        }
    }

    await editor.edit((editBuilder) => {
        for (const selection of selections) {
            const currentCol = selection.start.character;
            const spacesNeeded = maxCol - currentCol;
            if (spacesNeeded > 0) {
                editBuilder.insert(selection.start, ' '.repeat(spacesNeeded));
            }
        }
    });
};

export const alignBySymbol = async (symbolArg?: string) => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        return;
    }

    const selections = editor.selections;
    if (!selections || selections.length === 0) {
        return;
    }

    const lineNumbers = new Set<number>();
    for (const selection of selections) {
        if (selection.isEmpty) {
            if (selections.length > 1) {
                lineNumbers.add(selection.active.line);
            }
            continue;
        }

        const startLine = Math.min(selection.start.line, selection.end.line);
        const endLine = Math.max(selection.start.line, selection.end.line);
        for (let line = startLine; line <= endLine; line++) {
            lineNumbers.add(line);
        }
    }

    if (lineNumbers.size === 0) {
        return;
    }

    let symbol = symbolArg;
    if (symbol === undefined) {
        symbol = await vscode.window.showInputBox({
            placeHolder: 'Symbol to align by (first occurrence on each line)'
        });
    }

    if (!symbol) {
        return;
    }

    const sortedLineNumbers = Array.from(lineNumbers).sort((a, b) => a - b);
    let maxSymbolColumn = -1;
    const lineData: Array<{ line: number; text: string; symbolIndex: number }> = [];

    for (const lineNumber of sortedLineNumbers) {
        const text = editor.document.lineAt(lineNumber).text;
        const symbolIndex = text.indexOf(symbol);
        if (symbolIndex === -1) {
            continue;
        }

        lineData.push({ line: lineNumber, text, symbolIndex });
        if (symbolIndex > maxSymbolColumn) {
            maxSymbolColumn = symbolIndex;
        }
    }

    if (maxSymbolColumn === -1) {
        return;
    }

    await editor.edit((editBuilder) => {
        for (const item of lineData) {
            const spacesNeeded = maxSymbolColumn - item.symbolIndex;
            if (spacesNeeded <= 0) {
                continue;
            }

            const updatedLine =
                item.text.slice(0, item.symbolIndex) +
                ' '.repeat(spacesNeeded) +
                item.text.slice(item.symbolIndex);

            editBuilder.replace(editor.document.lineAt(item.line).range, updatedLine);
        }
    });
};

export const addNumbersToCursors = async (startNumberArg?: number) => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        return;
    }

    const selections = editor.selections;
    if (!selections || selections.length < 2) {
        return;
    }

    let startNumber = 0;
    if (startNumberArg !== undefined) {
        startNumber = startNumberArg;
    } else {
        const startNumberStr = await vscode.window.showInputBox({
            placeHolder: 'Starting number (default: 0)',
            validateInput: (text) => {
                if (!text) {
                    return null;
                }
                return isNaN(Number(text)) ? 'Please enter a valid number' : null;
            }
        });

        if (startNumberStr === undefined) {
            return;
        }
        startNumber = startNumberStr ? Number(startNumberStr) : 0;
    }

    await editor.edit((editBuilder) => {
        for (let i = 0; i < selections.length; i++) {
            const selection = selections[i];
            editBuilder.replace(selection, "" + (i + startNumber));
        }
    });
};
