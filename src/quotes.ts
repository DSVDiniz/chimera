import * as vscode from 'vscode';

export const quoteWords = async () => {
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
            const words = text.trim().split(/\s+/);
            const newText = words.map(word => `"${word}"`).join(', ');
            editBuilder.replace(selection, newText);
        }
    });
};

const QUOTE_CHARS = ['"', "'", '`'] as const;
type QuoteChar = typeof QUOTE_CHARS[number];

const isQuoteChar = (char: string): char is QuoteChar => {
    return QUOTE_CHARS.includes(char as QuoteChar);
};

const getQuotedRange = (text: string): { isQuoted: boolean; quoteChar: QuoteChar | null } => {
    if (text.length < 2) {
        return { isQuoted: false, quoteChar: null };
    }
    const first = text.charAt(0);
    const last = text.charAt(text.length - 1);
    if (isQuoteChar(first) && first === last) {
        return { isQuoted: true, quoteChar: first };
    }
    return { isQuoted: false, quoteChar: null };
};

const findQuoteBackward = (
    doc: vscode.TextDocument,
    startPos: vscode.Position,
    maxLines: number
): { pos: vscode.Position; char: QuoteChar } | null => {
    for (let l = startPos.line; l >= Math.max(0, startPos.line - maxLines); l--) {
        const lineStr = doc.lineAt(l).text;
        const startIndex = (l === startPos.line) ? startPos.character - 1 : lineStr.length - 1;

        for (let i = startIndex; i >= 0; i--) {
            const char = lineStr[i];
            if (isQuoteChar(char) && (i === 0 || lineStr[i - 1] !== '\\')) {
                if ((char === '"' || char === "'") && l !== startPos.line) {
                    continue;
                }
                return { pos: new vscode.Position(l, i), char };
            }
        }
    }
    return null;
};

const findQuoteForward = (
    doc: vscode.TextDocument,
    startPos: vscode.Position,
    quoteChar: QuoteChar,
    startQuoteLine: number,
    maxLines: number
): vscode.Position | null => {
    for (let l = startPos.line; l < Math.min(doc.lineCount, startPos.line + maxLines); l++) {
        const lineStr = doc.lineAt(l).text;
        const startIndex = (l === startPos.line) ? startPos.character : 0;

        for (let i = startIndex; i < lineStr.length; i++) {
            if (lineStr[i] === quoteChar && (i === 0 || lineStr[i - 1] !== '\\')) {
                return new vscode.Position(l, i);
            }
        }

        if ((quoteChar === '"' || quoteChar === "'") && l > startQuoteLine) {
            break;
        }
    }
    return null;
};

const cycleQuote = (text: string): string => {
    const quoteChar = text.charAt(0) as QuoteChar;
    const content = text.substring(1, text.length - 1);

    if (quoteChar === '"') {
        return `'${content.replace(/\\"/g, '"').replace(/'/g, "\\'")}'`;
    }
    if (quoteChar === "'") {
        return `\`${content.replace(/`/g, "\\`").replace(/\\'/g, "'")}\``;
    }
    return `"${content.replace(/"/g, '\\"').replace(/\\`/g, "`")}"`;
};

export const cycleQuotes = async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        return;
    }

    const doc = editor.document;

    await editor.edit((editBuilder) => {
        for (const selection of editor.selections) {
            let range: vscode.Selection | vscode.Range = selection;
            let text = doc.getText(selection);

            const { isQuoted } = getQuotedRange(text);

            if (!isQuoted) {
                const startQuote = findQuoteBackward(doc, selection.start, 200);
                if (!startQuote) {
                    continue;
                }

                const endQuote = findQuoteForward(doc, selection.end, startQuote.char, startQuote.pos.line, 200);
                if (!endQuote) {
                    continue;
                }

                range = new vscode.Selection(startQuote.pos, endQuote.translate(0, 1));
                text = doc.getText(range);
            }

            editBuilder.replace(range, cycleQuote(text));
        }
    });
};
