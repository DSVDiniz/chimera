import * as vscode from 'vscode';

export const quoteWords = async () => {
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
            const words = text.trim().split(/\s+/);
            const quotedWords = words.map(word => `"${word}"`);
            const newText = quotedWords.join(', ');

            editBuilder.replace(selection, newText);
        }
    });
};

export const cycleQuotes = async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        return;
    }

    const selections = editor.selections;
    if (!selections || selections.length === 0) {
        return;
    }

    await editor.edit((editBuilder) => {
        for (const selection of selections) {
            let range = selection;
            let text = editor.document.getText(selection);

            const firstChar = text.charAt(0);
            const lastChar = text.charAt(text.length - 1);
            const singleQuote = firstChar === "'" && lastChar === "'";
            const doubleQuote = firstChar === '"' && lastChar === '"';
            let backtick = firstChar === '`' && lastChar === '`';

            if (text.length >= 2 && firstChar === '`' && lastChar === '`') {
                backtick = true;
            }

            const isQuoted = (singleQuote || doubleQuote || backtick) && text.length >= 2;

            if (!isQuoted) {
                const doc = editor.document;
                const startPos = selection.start;
                const endPos = selection.end;

                let foundStartQuote: vscode.Position | null = null;
                let foundEndQuote: vscode.Position | null = null;
                let quoteChar = '';

                const maxLinesBack = 200;
                let currentLine = startPos.line;

                searchBack: for (let l = currentLine; l >= Math.max(0, currentLine - maxLinesBack); l--) {
                    const line = doc.lineAt(l);
                    const lineStr = line.text;
                    const startIndex = (l === startPos.line) ? startPos.character - 1 : lineStr.length - 1;

                    for (let i = startIndex; i >= 0; i--) {
                        const char = lineStr[i];
                        if ((char === '"' || char === "'" || char === '`') && (i === 0 || lineStr[i - 1] !== '\\')) {
                            if ((char === '"' || char === "'") && l !== startPos.line) {
                                continue;
                            }

                            quoteChar = char;
                            foundStartQuote = new vscode.Position(l, i);
                            break searchBack;
                        }
                    }
                }

                if (foundStartQuote) {
                    const maxLinesForward = 200;
                    currentLine = endPos.line;

                    searchFwd: for (let l = currentLine; l < Math.min(doc.lineCount, currentLine + maxLinesForward); l++) {
                        const line = doc.lineAt(l);
                        const lineStr = line.text;
                        const startIndex = (l === endPos.line) ? endPos.character : 0;

                        for (let i = startIndex; i < lineStr.length; i++) {
                            if (lineStr[i] === quoteChar && (i === 0 || lineStr[i - 1] !== '\\')) {
                                foundEndQuote = new vscode.Position(l, i);
                                break searchFwd;
                            }
                        }

                        if ((quoteChar === '"' || quoteChar === "'") && l > foundStartQuote.line) {
                            break searchFwd;
                        }
                    }
                }

                if (foundStartQuote && foundEndQuote) {
                    range = new vscode.Selection(foundStartQuote, foundEndQuote.translate(0, 1));
                    text = doc.getText(range);
                } else {
                    continue;
                }
            }

            const newFirst = text.charAt(0);
            let newText = text;

            if (newFirst === '"') {
                const content = text.substring(1, text.length - 1);
                newText = `'${content.replace(/\\"/g, '"').replace(/'/g, "\\'")}'`;
            } else if (newFirst === "'") {
                const content = text.substring(1, text.length - 1);
                newText = `\`${content.replace(/`/g, "\\`").replace(/\\'/g, "'")}\``;
            } else if (newFirst === '`') {
                const content = text.substring(1, text.length - 1);
                newText = `"${content.replace(/"/g, '\\"').replace(/\\`/g, "`")}"`;
            }

            editBuilder.replace(range, newText);
        }
    });
};
