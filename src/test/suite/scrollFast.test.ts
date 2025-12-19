import * as assert from 'assert';
import * as vscode from 'vscode';
import * as myExtension from '../../extension';

suite('Scroll Fast Test Suite', () => {
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
});
