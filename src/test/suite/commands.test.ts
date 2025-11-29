import * as assert from 'assert';
import * as vscode from 'vscode';
import * as myExtension from '../../extension';

suite('Extension Test Suite', () => {
    vscode.window.showInformationMessage('Start all tests.');

    test('alignCursors test', async () => {
        const doc = await vscode.workspace.openTextDocument({
            content: 'a\nbb\nccc'
        });
        const editor = await vscode.window.showTextDocument(doc);

        editor.selections = [
            new vscode.Selection(0, 1, 0, 1),
            new vscode.Selection(1, 2, 1, 2),
            new vscode.Selection(2, 3, 2, 3)
        ];

        await myExtension.alignCursors();

        const text = doc.getText();
        const lines = text.split('\n');
        assert.strictEqual(lines[0], 'a  ');
        assert.strictEqual(lines[1], 'bb ');
        assert.strictEqual(lines[2], 'ccc');
    });

    test('cycleCasing test', async () => {
        const doc = await vscode.workspace.openTextDocument({
            content: 'helloWorld'
        });
        const editor = await vscode.window.showTextDocument(doc);
        editor.selection = new vscode.Selection(0, 0, 0, 10);

        // camel -> pascal
        await myExtension.cycleCasing();
        assert.strictEqual(doc.getText(), 'HelloWorld');
        // pascal -> upper
        await myExtension.cycleCasing();
        assert.strictEqual(doc.getText(), 'HELLOWORLD');
        // upper -> upper-snake
        await myExtension.cycleCasing();
        assert.strictEqual(doc.getText(), 'HELLO_WORLD');
        // upper-snake -> pascal-snake
        await myExtension.cycleCasing();
        assert.strictEqual(doc.getText(), 'Hello_World');
        // pascal-snake -> camel-snake
        await myExtension.cycleCasing();
        assert.strictEqual(doc.getText(), 'hello_World');
        // camel-snake -> kebab-lower
        await myExtension.cycleCasing();
        assert.strictEqual(doc.getText(), 'hello-world');
        // kebab-lower -> kebab-upper
        await myExtension.cycleCasing();
        assert.strictEqual(doc.getText(), 'HELLO-WORLD');
        // upper-kebab -> lowercase
        await myExtension.cycleCasing();
        assert.strictEqual(doc.getText(), 'helloworld');
        // lowercase -> camel
        await myExtension.cycleCasing();
        assert.strictEqual(doc.getText(), 'helloWorld');
    });

    test('addNumbersToCursors test', async () => {
        const doc = await vscode.workspace.openTextDocument({
            content: 'item\nitem\nitem'
        });
        const editor = await vscode.window.showTextDocument(doc);

        editor.selections = [
            new vscode.Selection(0, 4, 0, 4),
            new vscode.Selection(1, 4, 1, 4),
            new vscode.Selection(2, 4, 2, 4)
        ];

        await myExtension.addNumbersToCursors(10);

        const text = doc.getText();
        const lines = text.split('\n');
        assert.strictEqual(lines[0], 'item10');
        assert.strictEqual(lines[1], 'item11');
        assert.strictEqual(lines[2], 'item12');
    });

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

        await myExtension.nextError(contextMock);

        const editor = vscode.window.activeTextEditor;
        assert.ok(editor, 'Editor should be open');
        assert.strictEqual(editor.document.uri.toString(), uri.toString());
        assert.strictEqual(editor.selection.start.line, 0);
        assert.strictEqual(editor.selection.start.character, 0);
    });

    test('scrollFast test', async () => {
        // Create a long document
        const content = Array.from({ length: 100 }, (_, i) => `line ${i}`).join('\n');
        const doc = await vscode.workspace.openTextDocument({ content });
        const editor = await vscode.window.showTextDocument(doc);

        // Initial cursor at 0,0
        assert.strictEqual(editor.selection.start.line, 0);

        // Scroll down fast
        await myExtension.scrollFast('down');

        // Should be at line 10
        assert.strictEqual(editor.selection.start.line, 10);

        // Scroll up fast
        await myExtension.scrollFast('up');

        // Should be back at line 0
        assert.strictEqual(editor.selection.start.line, 0);
    });
});
