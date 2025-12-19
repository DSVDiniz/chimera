import * as assert from 'assert';
import * as vscode from 'vscode';
import * as myExtension from '../../extension';

suite('Reverse Lines Test Suite', () => {
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
});
