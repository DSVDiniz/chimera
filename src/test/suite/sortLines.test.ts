import * as assert from 'assert';
import * as vscode from 'vscode';
import * as myExtension from '../../extension';

suite('Sort Lines Test Suite', () => {
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
