import * as assert from 'assert';
import * as vscode from 'vscode';
import * as myExtension from '../../extension';

suite('Unique Lines Test Suite', () => {
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
});
