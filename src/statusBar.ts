import * as vscode from 'vscode';

export const activateSelectionStatus = (context: vscode.ExtensionContext) => {
    const selectionStatus =
        vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 101);

    selectionStatus.tooltip = "Selection: lines and characters";
    context.subscriptions.push(selectionStatus);

    const updateStatus = () => {
        const editor = vscode.window.activeTextEditor;

        if (!editor) {
            selectionStatus.hide();
            return;
        }

        const selections = editor.selections;
        if (!selections || selections.length === 0) {
            selectionStatus.hide();
            return;
        }

        const single = selections.length === 1 && selections[0].isEmpty;
        if (single) {
            selectionStatus.hide();
            return;
        }

        let totalLines = 0;

        for (const sel of selections) {
            const startLine = sel.start.line;
            const endLine = sel.end.line;
            const lines = Math.abs(endLine - startLine) + 1;
            totalLines += lines;
        }

        const linesText = totalLines === 1 ? "1 line" : `${totalLines} lines`;

        selectionStatus.text = `${linesText}`;
        selectionStatus.show();
    };

    context.subscriptions.push(
        vscode.window.onDidChangeTextEditorSelection(updateStatus),
        vscode.window.onDidChangeActiveTextEditor(updateStatus),
        vscode.workspace.onDidChangeTextDocument((_) => updateStatus())
    );

    updateStatus();
};
