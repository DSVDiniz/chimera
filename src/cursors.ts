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
        if (selection.active.character > maxCol) {
            maxCol = selection.active.character;
        }
    }

    await editor.edit((editBuilder) => {
        for (let i = 0; i < selections.length; i++) {
            const selection = selections[i];
            const currentCol = selection.active.character;
            let spacesNeeded = maxCol - currentCol;
            if (spacesNeeded > 0) {
                editBuilder.insert(selection.active, ' '.repeat(spacesNeeded));
            }
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
