import * as assert from 'assert';
import * as vscode from 'vscode';
import * as myExtension from '../../extension';

suite('Next Error Test Suite', () => {
    const contextMock = {
        subscriptions: [],
        workspaceState: {
            get: (key: string, defaultValue: any) => defaultValue,
            update: async (key: string, value: any) => { }
        }
    } as unknown as vscode.ExtensionContext;

    setup(async () => {
        await vscode.commands.executeCommand('workbench.action.closeAllEditors');
    });

    teardown(async () => {
        await vscode.commands.executeCommand('workbench.action.closeAllEditors');
    });

    test('nextError jumps to error in current file after cursor', async () => {
        const collection = vscode.languages.createDiagnosticCollection('test-after-cursor');
        const doc = await vscode.workspace.openTextDocument({
            content: 'line 0\nline 1\nline 2\nline 3'
        });
        const uri = doc.uri;

        collection.set(uri, [
            new vscode.Diagnostic(new vscode.Range(1, 0, 1, 4), 'Error 1', vscode.DiagnosticSeverity.Error),
            new vscode.Diagnostic(new vscode.Range(3, 0, 3, 4), 'Error 2', vscode.DiagnosticSeverity.Error),
        ]);

        const editor = await vscode.window.showTextDocument(doc);
        editor.selection = new vscode.Selection(2, 0, 2, 0);

        await myExtension.nextError(contextMock);

        const activeEditor = vscode.window.activeTextEditor;
        assert.ok(activeEditor, 'Editor should be open');
        assert.strictEqual(activeEditor.selection.start.line, 3, 'Should jump to error on line 3');

        collection.dispose();
    });

    test('nextError goes to other files when no errors after cursor', async () => {
        const collection = vscode.languages.createDiagnosticCollection('test-other-files');

        const docA = await vscode.workspace.openTextDocument({
            content: 'line 0\nline 1\nline 2'
        });
        const uriA = docA.uri;

        const docB = await vscode.workspace.openTextDocument({
            content: 'error1\nerror2'
        });
        const uriB = docB.uri;

        collection.set(uriA, [
            new vscode.Diagnostic(new vscode.Range(0, 0, 0, 4), 'Error A1', vscode.DiagnosticSeverity.Error),
        ]);
        collection.set(uriB, [
            new vscode.Diagnostic(new vscode.Range(0, 0, 0, 6), 'Error B1', vscode.DiagnosticSeverity.Error),
        ]);

        const editor = await vscode.window.showTextDocument(docA);
        editor.selection = new vscode.Selection(2, 0, 2, 0);

        await myExtension.nextError(contextMock);

        const activeEditor = vscode.window.activeTextEditor;
        assert.ok(activeEditor);
        assert.strictEqual(activeEditor.document.uri.toString(), uriB.toString(), 'Should go to file B');

        collection.dispose();
    });

    test('nextError goes to first error when no editor is open', async () => {
        const collection = vscode.languages.createDiagnosticCollection('test-no-editor');
        const doc = await vscode.workspace.openTextDocument({
            content: 'error here'
        });
        const uri = doc.uri;
        const diag = new vscode.Diagnostic(
            new vscode.Range(0, 0, 0, 5),
            'Test Error',
            vscode.DiagnosticSeverity.Error
        );
        collection.set(uri, [diag]);

        await vscode.commands.executeCommand('workbench.action.closeAllEditors');

        await myExtension.nextError(contextMock);

        const editor = vscode.window.activeTextEditor;
        assert.ok(editor, 'Editor should be open');
        assert.strictEqual(editor.document.uri.toString(), uri.toString());
        assert.strictEqual(editor.selection.start.line, 0);
        assert.strictEqual(editor.selection.start.character, 0);

        collection.dispose();
    });

    test('nextError advances to next error on same line', async () => {
        const collection = vscode.languages.createDiagnosticCollection('test-same-line');
        const doc = await vscode.workspace.openTextDocument({
            content: 'error1 error2 error3'
        });
        const uri = doc.uri;

        collection.set(uri, [
            new vscode.Diagnostic(new vscode.Range(0, 0, 0, 6), 'Error 1', vscode.DiagnosticSeverity.Error),
            new vscode.Diagnostic(new vscode.Range(0, 7, 0, 13), 'Error 2', vscode.DiagnosticSeverity.Error),
            new vscode.Diagnostic(new vscode.Range(0, 14, 0, 20), 'Error 3', vscode.DiagnosticSeverity.Error),
        ]);

        const editor = await vscode.window.showTextDocument(doc);
        editor.selection = new vscode.Selection(0, 8, 0, 8);

        await myExtension.nextError(contextMock);

        const activeEditor = vscode.window.activeTextEditor;
        assert.ok(activeEditor, 'Editor should be open');
        assert.strictEqual(activeEditor.selection.start.character, 14, 'Should jump to error3 at char 14');

        collection.dispose();
    });

    test('nextError advances when cursor is at error position', async () => {
        const collection = vscode.languages.createDiagnosticCollection('test-at-error');
        const doc = await vscode.workspace.openTextDocument({
            content: 'line 0\nline 1\nline 2'
        });
        const uri = doc.uri;

        collection.set(uri, [
            new vscode.Diagnostic(new vscode.Range(0, 0, 0, 4), 'Error 1', vscode.DiagnosticSeverity.Error),
            new vscode.Diagnostic(new vscode.Range(2, 0, 2, 4), 'Error 2', vscode.DiagnosticSeverity.Error),
        ]);

        const editor = await vscode.window.showTextDocument(doc);
        editor.selection = new vscode.Selection(0, 0, 0, 0);

        await myExtension.nextError(contextMock);

        const activeEditor = vscode.window.activeTextEditor;
        assert.ok(activeEditor, 'Editor should be open');
        assert.strictEqual(activeEditor.selection.start.line, 2, 'Should advance to error on line 2');

        collection.dispose();
    });

    test('nextError stays on only error when no other files have errors', async () => {
        const collection = vscode.languages.createDiagnosticCollection('test-single-only');
        const doc = await vscode.workspace.openTextDocument({
            content: 'line 0\nline 1'
        });
        const uri = doc.uri;

        collection.set(uri, [
            new vscode.Diagnostic(new vscode.Range(0, 0, 0, 4), 'Only Error', vscode.DiagnosticSeverity.Error),
        ]);

        const editor = await vscode.window.showTextDocument(doc);
        editor.selection = new vscode.Selection(0, 0, 0, 0);

        await myExtension.nextError(contextMock);

        const activeEditor = vscode.window.activeTextEditor;
        assert.ok(activeEditor, 'Editor should be open');
        assert.strictEqual(activeEditor.selection.start.line, 0, 'Should stay on only error');

        collection.dispose();
    });
});
