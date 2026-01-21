import * as vscode from 'vscode';

export function increaseSelection(direction: 'left' | 'right') {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        return;
    }

    if (editor.selections.every(s => s.isEmpty)) {
        return;
    }

    const doc = editor.document;
    const newSelections = editor.selections.map(selection => {
        let newStart = selection.start;
        let newEnd = selection.end;

        if (direction === 'left') {
            const offset = doc.offsetAt(newStart);
            if (offset > 0) {
                newStart = doc.positionAt(offset - 1);
            }
        } else {
            const offset = doc.offsetAt(newEnd);
            if (offset < doc.getText().length) {
                newEnd = doc.positionAt(offset + 1);
            }
        }
        return new vscode.Selection(selection.isReversed ? newEnd : newStart, selection.isReversed ? newStart : newEnd);
    });

    editor.selections = newSelections;
}

export async function moveSelection(direction: 'left' | 'right', byWord: boolean) {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        return;
    }

    if (editor.selections.every(s => s.isEmpty)) {
        return;
    }

    const doc = editor.document;
    const selection = editor.selection;
    if (selection.isEmpty) {
        return;
    }

    const selectedText = doc.getText(selection);
    const selectionLength = selectedText.length;
    const selectionStartOffset = doc.offsetAt(selection.start);
    const selectionEndOffset = doc.offsetAt(selection.end);

    let swapStartOffset: number;
    let swapEndOffset: number;

    if (byWord) {
        const originalSelections = editor.selections;

        if (direction === 'left') {
            editor.selection = new vscode.Selection(selection.start, selection.start);
            await vscode.commands.executeCommand('cursorWordLeft');
            swapStartOffset = doc.offsetAt(editor.selection.active);
            swapEndOffset = selectionEndOffset;
        } else {
            editor.selection = new vscode.Selection(selection.end, selection.end);
            await vscode.commands.executeCommand('cursorWordRight');
            swapEndOffset = doc.offsetAt(editor.selection.active);
            swapStartOffset = selectionStartOffset;
        }

        editor.selections = originalSelections;
    } else {
        if (direction === 'left') {
            if (selectionStartOffset === 0) {
                return;
            }
            swapStartOffset = selectionStartOffset - 1;
            swapEndOffset = selectionEndOffset;
        } else {
            if (selectionEndOffset >= doc.getText().length) {
                return;
            }
            swapStartOffset = selectionStartOffset;
            swapEndOffset = selectionEndOffset + 1;
        }
    }

    const swapRange = new vscode.Range(
        doc.positionAt(swapStartOffset),
        doc.positionAt(swapEndOffset)
    );
    const fullText = doc.getText(swapRange);

    let newText: string;
    let newSelectionStartOffset: number;

    if (direction === 'left') {
        const prefixLength = selectionStartOffset - swapStartOffset;
        const prefix = fullText.substring(0, prefixLength);
        newText = selectedText + prefix;
        newSelectionStartOffset = swapStartOffset;
    } else {
        const suffixLength = swapEndOffset - selectionEndOffset;
        const suffix = fullText.substring(selectionLength);
        newText = suffix + selectedText;
        newSelectionStartOffset = swapStartOffset + suffixLength;
    }

    await editor.edit(editBuilder => {
        editBuilder.replace(swapRange, newText);
    });

    const newStart = doc.positionAt(newSelectionStartOffset);
    const newEnd = doc.positionAt(newSelectionStartOffset + selectionLength);
    editor.selection = new vscode.Selection(newStart, newEnd);
}
