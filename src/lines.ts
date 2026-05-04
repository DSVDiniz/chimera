import * as vscode from 'vscode';

const getSelectionRange = (document: vscode.TextDocument, selection: vscode.Selection): vscode.Range => {
    if (selection.isEmpty) {
        const firstLine = document.lineAt(0);
        const lastLine = document.lineAt(document.lineCount - 1);
        return new vscode.Range(firstLine.range.start, lastLine.range.end);
    }
    const startLine = document.lineAt(selection.start.line);
    const endLine = document.lineAt(selection.end.line);
    return new vscode.Range(startLine.range.start, endLine.range.end);
};

export const uniqueLines = async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        return;
    }

    const document = editor.document;

    await editor.edit((editBuilder) => {
        for (const selection of editor.selections) {
            const range = getSelectionRange(document, selection);
            const lines = document.getText(range).split('\n');

            const seen = new Set<string>();
            const uniqueLines: string[] = [];
            for (const line of lines) {
                if (!seen.has(line)) {
                    seen.add(line);
                    uniqueLines.push(line);
                }
            }

            editBuilder.replace(range, uniqueLines.join('\n'));
        }
    });
};

export const reverseLines = async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        return;
    }

    const document = editor.document;

    await editor.edit((editBuilder) => {
        for (const selection of editor.selections) {
            const range = getSelectionRange(document, selection);
            const lines = document.getText(range).split('\n');
            editBuilder.replace(range, lines.reverse().join('\n'));
        }
    });
};

export const shuffleLines = async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        return;
    }

    const document = editor.document;

    await editor.edit((editBuilder) => {
        for (const selection of editor.selections) {
            const range = getSelectionRange(document, selection);
            const lines = document.getText(range).split('\n');

            for (let i = lines.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [lines[i], lines[j]] = [lines[j], lines[i]];
            }

            editBuilder.replace(range, lines.join('\n'));
        }
    });
};

export const sortLines = async (caseSensitive: boolean) => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        return;
    }

    const document = editor.document;

    await editor.edit((editBuilder) => {
        for (const selection of editor.selections) {
            const range = getSelectionRange(document, selection);
            const lines = document.getText(range).split('\n');

            if (caseSensitive) {
                lines.sort();
            } else {
                lines.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
            }

            editBuilder.replace(range, lines.join('\n'));
        }
    });
};

const replaceAllOccurrences = (text: string, symbol: string): string => text.split(symbol).join('\n');

export const splitBySymbol = async (symbolArg?: string) => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        return;
    }

    let symbol = symbolArg;
    if (symbol === undefined) {
        symbol = await vscode.window.showInputBox({
            placeHolder: 'Symbol to split by'
        });
    }

    if (!symbol) {
        return;
    }

    const document = editor.document;
    const nonEmptySelections = editor.selections.filter(selection => !selection.isEmpty);

    await editor.edit((editBuilder) => {
        if (nonEmptySelections.length > 0) {
            for (const selection of nonEmptySelections) {
                const text = document.getText(selection);
                editBuilder.replace(selection, replaceAllOccurrences(text, symbol));
            }
            return;
        }

        const lineNumbers = new Set<number>();
        if (editor.selections.length > 1) {
            for (const selection of editor.selections) {
                lineNumbers.add(selection.active.line);
            }
        } else {
            lineNumbers.add(editor.selection.active.line);
        }

        for (const lineNumber of Array.from(lineNumbers)) {
            const line = document.lineAt(lineNumber);
            editBuilder.replace(line.range, replaceAllOccurrences(line.text, symbol));
        }
    });
};
