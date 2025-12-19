import * as assert from 'assert';
import * as vscode from 'vscode';
import * as myExtension from '../../extension';

suite('Next Error Test Suite', () => {
    test('nextError test', async () => {
        const collection = vscode.languages.createDiagnosticCollection('test');
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

        const contextMock = {
            subscriptions: [],
            workspaceState: {
                get: (key: string, defaultValue: any) => defaultValue,
                update: async (key: string, value: any) => { }
            }
        } as unknown as vscode.ExtensionContext;

        await vscode.commands.executeCommand('workbench.action.closeAllEditors');

        await myExtension.nextError(contextMock);

        const editor = vscode.window.activeTextEditor;
        assert.ok(editor, 'Editor should be open');
        assert.strictEqual(editor.document.uri.toString(), uri.toString());
        assert.strictEqual(editor.selection.start.line, 0);
        assert.strictEqual(editor.selection.start.character, 0);
    });
});
