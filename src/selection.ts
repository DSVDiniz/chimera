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
