import * as assert from 'assert';
import * as vscode from 'vscode';
import * as myExtension from '../../extension';

suite('Swap Casing Test Suite', () => {
    test('swapCase test', async () => {
        const doc = await vscode.workspace.openTextDocument({
            content: 'Hello World'
        });
        const editor = await vscode.window.showTextDocument(doc);
        editor.selection = new vscode.Selection(0, 0, 0, 11);

        await myExtension.swapCase();
        assert.strictEqual(doc.getText(), 'hELLO wORLD');

        editor.selection = new vscode.Selection(0, 0, 0, 11);
        await myExtension.swapCase();
        assert.strictEqual(doc.getText(), 'Hello World');
    });
});
