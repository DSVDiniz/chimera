import * as vscode from 'vscode';

export const uniqueLines = async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        return;
    }

    const document = editor.document;
    const selections = editor.selections;

    await editor.edit((editBuilder) => {
        for (const selection of selections) {
            let range: vscode.Range;

            if (selection.isEmpty) {
                const firstLine = document.lineAt(0);
                const lastLine = document.lineAt(document.lineCount - 1);
                range = new vscode.Range(firstLine.range.start, lastLine.range.end);
            } else {
                const startLine = document.lineAt(selection.start.line);
                const endLine = document.lineAt(selection.end.line);
                range = new vscode.Range(startLine.range.start, endLine.range.end);
            }

            const text = document.getText(range);
            const lines = text.split('\n');

            const seen = new Set<string>();
            const uniqueLines: string[] = [];

            for (const line of lines) {
                if (!seen.has(line)) {
                    seen.add(line);
                    uniqueLines.push(line);
                }
            }

            const newText = uniqueLines.join('\n');
            editBuilder.replace(range, newText);
        }
    });
};

export const reverseLines = async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        return;
    }

    const document = editor.document;
    const selections = editor.selections;

    await editor.edit((editBuilder) => {
        for (const selection of selections) {
            let range: vscode.Range;

            if (selection.isEmpty) {
                const firstLine = document.lineAt(0);
                const lastLine = document.lineAt(document.lineCount - 1);
                range = new vscode.Range(firstLine.range.start, lastLine.range.end);
            } else {
                const startLine = document.lineAt(selection.start.line);
                const endLine = document.lineAt(selection.end.line);
                range = new vscode.Range(startLine.range.start, endLine.range.end);
            }

            const text = document.getText(range);
            const lines = text.split('\n');
            const reversedLines = lines.reverse();
            const newText = reversedLines.join('\n');
            editBuilder.replace(range, newText);
        }
    });
};

export const shuffleLines = async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        return;
    }

    const document = editor.document;
    const selections = editor.selections;

    await editor.edit((editBuilder) => {
        for (const selection of selections) {
            let range: vscode.Range;

            if (selection.isEmpty) {
                const firstLine = document.lineAt(0);
                const lastLine = document.lineAt(document.lineCount - 1);
                range = new vscode.Range(firstLine.range.start, lastLine.range.end);
            } else {
                const startLine = document.lineAt(selection.start.line);
                const endLine = document.lineAt(selection.end.line);
                range = new vscode.Range(startLine.range.start, endLine.range.end);
            }

            const text = document.getText(range);
            const lines = text.split('\n');

            for (let i = lines.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [lines[i], lines[j]] = [lines[j], lines[i]];
            }

            const newText = lines.join('\n');
            editBuilder.replace(range, newText);
        }
    });
};

export const sortLines = async (caseSensitive: boolean) => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        return;
    }

    const document = editor.document;
    const selections = editor.selections;

    await editor.edit((editBuilder) => {
        for (const selection of selections) {
            let range: vscode.Range;

            if (selection.isEmpty) {
                const firstLine = document.lineAt(0);
                const lastLine = document.lineAt(document.lineCount - 1);
                range = new vscode.Range(firstLine.range.start, lastLine.range.end);
            } else {
                const startLine = document.lineAt(selection.start.line);
                const endLine = document.lineAt(selection.end.line);
                range = new vscode.Range(startLine.range.start, endLine.range.end);
            }

            const text = document.getText(range);
            const lines = text.split('\n');

            if (caseSensitive) {
                lines.sort();
            } else {
                lines.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
            }

            const newText = lines.join('\n');
            editBuilder.replace(range, newText);
        }
    });
};
