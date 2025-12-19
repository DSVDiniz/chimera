import * as assert from 'assert';
import * as vscode from 'vscode';
import * as myExtension from '../../extension';

suite('Shuffle Lines Test Suite', () => {
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
});
