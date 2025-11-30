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
        const content = Array.from({ length: 100 }, (_, i) => `line ${i}`).join('\n');
        const doc = await vscode.workspace.openTextDocument({ content });
        const editor = await vscode.window.showTextDocument(doc);
        assert.strictEqual(editor.selection.start.line, 0);
        await myExtension.scrollFast('down');
        assert.strictEqual(editor.selection.start.line, 3);
        await myExtension.scrollFast('up');
        assert.strictEqual(editor.selection.start.line, 0);
    });

    test('uniqueLines - basic duplicate removal', async () => {
        const doc = await vscode.workspace.openTextDocument({
            content: 'apple\nbanana\ncherry\napple\ndate\nbanana\nelderberry\ncherry\nfig\napple'
        });
        const editor = await vscode.window.showTextDocument(doc);

        editor.selection = new vscode.Selection(0, 0, 9, 5);

        await myExtension.uniqueLines();

        const text = doc.getText();
        const lines = text.split('\n');

        assert.strictEqual(lines.length, 6);
        assert.strictEqual(lines[0], 'apple');
        assert.strictEqual(lines[1], 'banana');
        assert.strictEqual(lines[2], 'cherry');
        assert.strictEqual(lines[3], 'date');
        assert.strictEqual(lines[4], 'elderberry');
        assert.strictEqual(lines[5], 'fig');
    });

    test('uniqueLines - entire document when no selection', async () => {
        const doc = await vscode.workspace.openTextDocument({
            content: 'line1\nline2\nline1\nline3\nline2'
        });
        const editor = await vscode.window.showTextDocument(doc);

        editor.selection = new vscode.Selection(0, 0, 0, 0);

        await myExtension.uniqueLines();

        const text = doc.getText();
        const lines = text.split('\n');

        assert.strictEqual(lines.length, 3);
        assert.strictEqual(lines[0], 'line1');
        assert.strictEqual(lines[1], 'line2');
        assert.strictEqual(lines[2], 'line3');
    });

    test('uniqueLines - partial selection', async () => {
        const doc = await vscode.workspace.openTextDocument({
            content: 'keep\napple\nbanana\napple\ncherry\nbanana\nkeep'
        });
        const editor = await vscode.window.showTextDocument(doc);

        editor.selection = new vscode.Selection(1, 0, 5, 6);

        await myExtension.uniqueLines();

        const text = doc.getText();
        const lines = text.split('\n');

        assert.strictEqual(lines.length, 5);
        assert.strictEqual(lines[0], 'keep');
        assert.strictEqual(lines[1], 'apple');
        assert.strictEqual(lines[2], 'banana');
        assert.strictEqual(lines[3], 'cherry');
        assert.strictEqual(lines[4], 'keep');
    });

    test('uniqueLines - empty lines handling', async () => {
        const doc = await vscode.workspace.openTextDocument({
            content: 'line1\n\nline2\n\nline1\n\nline2'
        });
        const editor = await vscode.window.showTextDocument(doc);

        editor.selection = new vscode.Selection(0, 0, 6, 5);

        await myExtension.uniqueLines();

        const text = doc.getText();
        const lines = text.split('\n');

        assert.strictEqual(lines.length, 3);
        assert.strictEqual(lines[0], 'line1');
        assert.strictEqual(lines[1], '');
        assert.strictEqual(lines[2], 'line2');
    });

    test('reverseLines - basic reversal', async () => {
        const doc = await vscode.workspace.openTextDocument({
            content: 'first\nsecond\nthird\nfourth'
        });
        const editor = await vscode.window.showTextDocument(doc);

        editor.selection = new vscode.Selection(0, 0, 3, 6);

        await myExtension.reverseLines();

        const text = doc.getText();
        const lines = text.split('\n');

        assert.strictEqual(lines.length, 4);
        assert.strictEqual(lines[0], 'fourth');
        assert.strictEqual(lines[1], 'third');
        assert.strictEqual(lines[2], 'second');
        assert.strictEqual(lines[3], 'first');
    });

    test('reverseLines - partial selection', async () => {
        const doc = await vscode.workspace.openTextDocument({
            content: 'keep1\nreverse1\nreverse2\nreverse3\nkeep2'
        });
        const editor = await vscode.window.showTextDocument(doc);

        editor.selection = new vscode.Selection(1, 0, 3, 8);

        await myExtension.reverseLines();

        const text = doc.getText();
        const lines = text.split('\n');

        assert.strictEqual(lines.length, 5);
        assert.strictEqual(lines[0], 'keep1');
        assert.strictEqual(lines[1], 'reverse3');
        assert.strictEqual(lines[2], 'reverse2');
        assert.strictEqual(lines[3], 'reverse1');
        assert.strictEqual(lines[4], 'keep2');
    });

    test('shuffleLines - maintains all lines', async () => {
        const doc = await vscode.workspace.openTextDocument({
            content: 'line1\nline2\nline3\nline4\nline5'
        });
        const editor = await vscode.window.showTextDocument(doc);

        editor.selection = new vscode.Selection(0, 0, 4, 5);

        await myExtension.shuffleLines();

        const text = doc.getText();
        const lines = text.split('\n');

        assert.strictEqual(lines.length, 5);
        assert.ok(lines.includes('line1'));
        assert.ok(lines.includes('line2'));
        assert.ok(lines.includes('line3'));
        assert.ok(lines.includes('line4'));
        assert.ok(lines.includes('line5'));
    });

    test('sortLines - case insensitive', async () => {
        const doc = await vscode.workspace.openTextDocument({
            content: 'Zebra\napple\nBanana\ncherry\nApple'
        });
        const editor = await vscode.window.showTextDocument(doc);

        editor.selection = new vscode.Selection(0, 0, 4, 5);

        await myExtension.sortLines(false);

        const text = doc.getText();
        const lines = text.split('\n');

        assert.strictEqual(lines.length, 5);
        assert.strictEqual(lines[0], 'apple');
        assert.strictEqual(lines[1], 'Apple');
        assert.strictEqual(lines[2], 'Banana');
        assert.strictEqual(lines[3], 'cherry');
        assert.strictEqual(lines[4], 'Zebra');
    });

    test('sortLines - case sensitive', async () => {
        const doc = await vscode.workspace.openTextDocument({
            content: 'Zebra\napple\nBanana\ncherry\nApple'
        });
        const editor = await vscode.window.showTextDocument(doc);

        editor.selection = new vscode.Selection(0, 0, 4, 5);

        await myExtension.sortLines(true);

        const text = doc.getText();
        const lines = text.split('\n');

        assert.strictEqual(lines.length, 5);
        assert.strictEqual(lines[0], 'Apple');
        assert.strictEqual(lines[1], 'Banana');
        assert.strictEqual(lines[2], 'Zebra');
        assert.strictEqual(lines[3], 'apple');
        assert.strictEqual(lines[4], 'cherry');
    });

    test('sortLines - numeric and special characters', async () => {
        const doc = await vscode.workspace.openTextDocument({
            content: '3. Third\n1. First\n10. Tenth\n2. Second'
        });
        const editor = await vscode.window.showTextDocument(doc);

        editor.selection = new vscode.Selection(0, 0, 3, 9);

        await myExtension.sortLines(false);

        const text = doc.getText();
        const lines = text.split('\n');

        assert.strictEqual(lines.length, 4);
        assert.strictEqual(lines[0], '1. First');
        assert.strictEqual(lines[1], '10. Tenth');
        assert.strictEqual(lines[2], '2. Second');
        assert.strictEqual(lines[3], '3. Third');
    });
});
