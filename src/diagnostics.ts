import * as vscode from 'vscode';

const isUriInWorkspace = (uri: vscode.Uri): boolean => {
    if (uri.scheme === 'untitled') {
        return true;
    }
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
        return false;
    }
    return workspaceFolders.some(folder => uri.fsPath.startsWith(folder.uri.fsPath));
};

export const nextError = async (_context: vscode.ExtensionContext) => {
    const allDiagnostics = vscode.languages.getDiagnostics();
    let errors: { uri: vscode.Uri; diag: vscode.Diagnostic }[] = [];

    for (const [uri, diags] of allDiagnostics) {
        if (!isUriInWorkspace(uri)) {
            continue;
        }
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

    const editor = vscode.window.activeTextEditor;
    const currentUri = editor?.document.uri;
    const currentLine = editor?.selection.active.line ?? 0;
    const currentChar = editor?.selection.active.character ?? 0;

    const currentFileErrors = currentUri
        ? errors.filter(e => e.uri.fsPath === currentUri.fsPath)
        : [];

    let targetError: { uri: vscode.Uri; diag: vscode.Diagnostic } | undefined;

    if (currentFileErrors.length > 0) {
        targetError = currentFileErrors.find(e => {
            const startLine = e.diag.range.start.line;
            const startChar = e.diag.range.start.character;
            return startLine > currentLine ||
                (startLine === currentLine && startChar > currentChar);
        });
    }

    if (!targetError) {
        const otherFileErrors = currentUri
            ? errors.filter(e => e.uri.fsPath !== currentUri.fsPath)
            : errors;
        targetError = otherFileErrors.length > 0 ? otherFileErrors[0] : errors[0];
    }

    const doc = vscode.workspace.textDocuments.find(
        d => d.uri.toString() === targetError.uri.toString()
    ) ?? await vscode.workspace.openTextDocument(targetError.uri);
    const newEditor = await vscode.window.showTextDocument(doc);

    newEditor.revealRange(targetError.diag.range, vscode.TextEditorRevealType.InCenter);
    newEditor.selection = new vscode.Selection(targetError.diag.range.start, targetError.diag.range.start);
};

export const nextErrorInFile = async (_context: vscode.ExtensionContext) => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        return;
    }

    const currentUri = editor.document.uri;
    const currentLine = editor.selection.active.line;
    const currentChar = editor.selection.active.character;

    const allDiagnostics = vscode.languages.getDiagnostics(currentUri);
    const errors = allDiagnostics
        .filter(d => d.severity === vscode.DiagnosticSeverity.Error)
        .sort((a, b) => {
            if (a.range.start.line !== b.range.start.line) {
                return a.range.start.line - b.range.start.line;
            }
            return a.range.start.character - b.range.start.character;
        });

    if (errors.length === 0) {
        vscode.window.showInformationMessage("No errors in current file.");
        return;
    }

    let targetError = errors.find(e => {
        const startLine = e.range.start.line;
        const startChar = e.range.start.character;
        return startLine > currentLine ||
            (startLine === currentLine && startChar > currentChar);
    });

    if (!targetError) {
        targetError = errors[0];
    }

    editor.revealRange(targetError.range, vscode.TextEditorRevealType.InCenter);
    editor.selection = new vscode.Selection(targetError.range.start, targetError.range.start);
};
