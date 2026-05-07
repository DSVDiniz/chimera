import * as vscode from 'vscode';

type SplitOptions = { trim: boolean; preserveEmpty: boolean };

const smartSplit = (text: string, options: SplitOptions = { trim: true, preserveEmpty: false }): string[] => {
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
                        const part = options.trim ? currentPart.trim() : currentPart;
                        if (options.preserveEmpty || part) {
                            parts.push(part);
                        }
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

    const finalPart = options.trim ? currentPart.trim() : currentPart;
    if (options.preserveEmpty || finalPart) {
        parts.push(finalPart);
    }
    return parts;
};

export const splitArguments = async () => {
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
            const parts = smartSplit(text);
            editBuilder.replace(selection, parts.join(',\n'));
        }
    });
};

export const unsplitArguments = async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        return;
    }

    const document = editor.document;

    await editor.edit((editBuilder) => {
        for (const selection of editor.selections) {
            if (selection.isEmpty) {
                continue;
            }

            const startLine = document.lineAt(selection.start.line);
            const endLine = document.lineAt(selection.end.line);
            const range = new vscode.Range(startLine.range.start, endLine.range.end);

            const lines = document.getText(range).split('\n');
            const trimmedLines = lines.map(line => line.trim());

            const newText = trimmedLines.reduce((acc, curr, idx) => {
                if (idx === 0) {
                    return curr;
                }
                const prev = trimmedLines[idx - 1];
                return prev.endsWith(',') ? acc + curr : acc + ' ' + curr;
            }, '');

            editBuilder.replace(range, newText);
        }
    });
};

type DelimiterSpan = {
    open: number;
    close: number;
};

type ParsedArgument = {
    raw: string;
    trimmed: string;
    rawStart: number;
    rawEnd: number;
    trimmedStart: number;
    trimmedEnd: number;
};

const OPEN_TO_CLOSE: Record<string, string> = {
    '(': ')',
    '[': ']',
    '{': '}'
};

const CLOSE_TO_OPEN: Record<string, string> = {
    ')': '(',
    ']': '[',
    '}': '{'
};

const parseArguments = (text: string): ParsedArgument[] => {
    const args: ParsedArgument[] = [];
    let currentPart = '';
    let inQuote: string | null = null;
    let parenLevel = 0;
    let braceLevel = 0;
    let bracketLevel = 0;
    let segmentStart = 0;

    const pushSegment = (segmentEnd: number) => {
        const raw = currentPart;
        const leadingTrim = raw.length - raw.trimStart().length;
        const trailingTrim = raw.length - raw.trimEnd().length;
        const trimmed = raw.trim();

        args.push({
            raw,
            trimmed,
            rawStart: segmentStart,
            rawEnd: segmentEnd,
            trimmedStart: segmentStart + leadingTrim,
            trimmedEnd: segmentEnd - trailingTrim
        });
    };

    for (let i = 0; i < text.length; i++) {
        const char = text[i];

        if (inQuote) {
            currentPart += char;
            if (char === inQuote && text[i - 1] !== '\\') {
                inQuote = null;
            }
            continue;
        }

        switch (char) {
            case '"':
            case '\'':
            case '`':
                inQuote = char;
                currentPart += char;
                break;
            case '(':
                parenLevel++;
                currentPart += char;
                break;
            case ')':
                parenLevel--;
                currentPart += char;
                break;
            case '{':
                braceLevel++;
                currentPart += char;
                break;
            case '}':
                braceLevel--;
                currentPart += char;
                break;
            case '[':
                bracketLevel++;
                currentPart += char;
                break;
            case ']':
                bracketLevel--;
                currentPart += char;
                break;
            case ',':
                if (parenLevel === 0 && braceLevel === 0 && bracketLevel === 0) {
                    pushSegment(i);
                    currentPart = '';
                    segmentStart = i + 1;
                } else {
                    currentPart += char;
                }
                break;
            default:
                currentPart += char;
        }
    }

    pushSegment(text.length);

    return args;
};

const findEnclosingDelimiterSpans = (
    text: string,
    selectionStart: number,
    selectionEnd: number
): DelimiterSpan[] => {
    const spans: DelimiterSpan[] = [];
    const stack: Array<{ char: string; pos: number }> = [];
    let inQuote: string | null = null;

    for (let i = 0; i < text.length; i++) {
        const char = text[i];

        if (inQuote) {
            if (char === inQuote && text[i - 1] !== '\\') {
                inQuote = null;
            }
            continue;
        }

        if (char === '"' || char === '\'' || char === '`') {
            inQuote = char;
            continue;
        }

        if (char in OPEN_TO_CLOSE) {
            stack.push({ char, pos: i });
            continue;
        }

        if (char in CLOSE_TO_OPEN) {
            const expectedOpen = CLOSE_TO_OPEN[char];
            let openEntry: { char: string; pos: number } | undefined;

            while (stack.length > 0) {
                const candidate = stack.pop();
                if (!candidate) {
                    break;
                }
                if (candidate.char === expectedOpen) {
                    openEntry = candidate;
                    break;
                }
            }

            if (openEntry) {
                const encloses = openEntry.pos < selectionStart && selectionEnd < i;
                if (encloses) {
                    spans.push({ open: openEntry.pos, close: i });
                }
            }
        }
    }

    return spans.sort((a, b) => (a.close - a.open) - (b.close - b.open));
};

const findArgumentIndex = (
    args: ParsedArgument[],
    cursorOffsetInArgs: number,
    selectionStartInArgs: number,
    selectionEndInArgs: number
): number => {
    if (selectionStartInArgs < selectionEndInArgs) {
        for (let i = 0; i < args.length; i++) {
            if (selectionStartInArgs >= args[i].trimmedStart && selectionEndInArgs <= args[i].trimmedEnd) {
                return i;
            }
        }

        for (let i = 0; i < args.length; i++) {
            const intersects = selectionStartInArgs < args[i].trimmedEnd && selectionEndInArgs > args[i].trimmedStart;
            if (intersects) {
                return i;
            }
        }
    }

    for (let i = 0; i < args.length; i++) {
        if (cursorOffsetInArgs <= args[i].rawEnd) {
            return i;
        }
    }

    return args.length - 1;
};

export const moveArgument = async (direction: 'left' | 'right') => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        return;
    }

    const document = editor.document;
    const selection = editor.selection;
    const cursorPosition = selection.active;
    const fullText = document.getText();
    const cursorOffset = document.offsetAt(cursorPosition);
    const selectionStartOffset = document.offsetAt(selection.start);
    const selectionEndOffset = document.offsetAt(selection.end);

    const currentLine = cursorPosition.line;
    const candidates = findEnclosingDelimiterSpans(fullText, selectionStartOffset, selectionEndOffset)
        .filter(c => document.positionAt(c.open).line === currentLine && document.positionAt(c.close).line === currentLine);
    if (candidates.length === 0) {
        return;
    }

    for (const candidate of candidates) {
        const argsText = fullText.substring(candidate.open + 1, candidate.close);
        const parsedArgs = parseArguments(argsText).filter(arg => arg.trimmed.length > 0);

        if (parsedArgs.length < 2) {
            continue;
        }

        const containerStart = candidate.open + 1;
        const cursorOffsetInArgs = cursorOffset - containerStart;
        const selectionStartInArgs = selectionStartOffset - containerStart;
        const selectionEndInArgs = selectionEndOffset - containerStart;

        const argIndex = findArgumentIndex(parsedArgs, cursorOffsetInArgs, selectionStartInArgs, selectionEndInArgs);

        let targetIndex: number;
        if (direction === 'left') {
            if (argIndex <= 0) {
                return;
            }
            targetIndex = argIndex - 1;
        } else {
            if (argIndex >= parsedArgs.length - 1) {
                return;
            }
            targetIndex = argIndex + 1;
        }

        const args = parsedArgs.map(arg => arg.trimmed);
        const newArgs = [...args];
        [newArgs[argIndex], newArgs[targetIndex]] = [newArgs[targetIndex], newArgs[argIndex]];

        const newArgsText = newArgs.join(', ');

        const originalArg = parsedArgs[argIndex];
        const relativeCursorInArg = Math.max(0, Math.min(
            originalArg.trimmed.length,
            cursorOffsetInArgs - originalArg.trimmedStart
        ));

        let newCursorOffsetInArgs = 0;
        for (let i = 0; i < targetIndex; i++) {
            newCursorOffsetInArgs += newArgs[i].length + 2;
        }
        newCursorOffsetInArgs += Math.min(relativeCursorInArg, newArgs[targetIndex].length);

        const startPos = document.positionAt(containerStart);
        const endPos = document.positionAt(candidate.close);
        const range = new vscode.Range(startPos, endPos);
        const newCursorOffset = containerStart + newCursorOffsetInArgs;

        await editor.edit((editBuilder) => {
            editBuilder.replace(range, newArgsText);
        });

        const newPosition = document.positionAt(newCursorOffset);
        editor.selection = new vscode.Selection(newPosition, newPosition);
        return;
    }
};
