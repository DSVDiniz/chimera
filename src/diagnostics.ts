import * as vscode from 'vscode';

export const nextError = async (context: vscode.ExtensionContext) => {
    const allDiagnostics = vscode.languages.getDiagnostics();
    let errors: { uri: vscode.Uri; diag: vscode.Diagnostic }[] = [];

    for (const [uri, diags] of allDiagnostics) {
        for (const d of diags) {
            if (d.severity === vscode.DiagnosticSeverity.Error) {
                errors.push({ uri, diag: d });
            }
        }
    }

    if (errors.length === 0) {
        vscode.window.showInformationMessage("No errors in workspace.");
        return;
    }

    errors.sort((a, b) => {
        if (a.uri.fsPath !== b.uri.fsPath) {
            return a.uri.fsPath.localeCompare(b.uri.fsPath);
        }
        if (a.diag.range.start.line !== b.diag.range.start.line) {
            return a.diag.range.start.line - b.diag.range.start.line;
        }
        return a.diag.range.start.character - b.diag.range.start.character;
    });

    const lastIndex = context.workspaceState.get<number>('chimera.lastErrorIndex', -1);
    const nextIndex = (lastIndex + 1) % errors.length;

    const err = errors[nextIndex];

    await context.workspaceState.update('chimera.lastErrorIndex', nextIndex);

    const doc = await vscode.workspace.openTextDocument(err.uri);
    const newEditor = await vscode.window.showTextDocument(doc);

    newEditor.revealRange(err.diag.range, vscode.TextEditorRevealType.InCenter);
    newEditor.selection = new vscode.Selection(err.diag.range.start, err.diag.range.start);
};
