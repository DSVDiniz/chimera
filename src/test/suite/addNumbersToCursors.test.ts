import * as assert from 'assert';
import * as vscode from 'vscode';
import * as myExtension from '../../extension';

suite('Add Numbers To Cursors Test Suite', () => {
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
});
