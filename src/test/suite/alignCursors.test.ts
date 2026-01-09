import * as assert from 'assert';
import * as vscode from 'vscode';
import * as myExtension from '../../extension';

suite('Align Cursors Test Suite', () => {
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

    test('alignCursors with selections aligns at selection start', async () => {
        const doc = await vscode.workspace.openTextDocument({
            content: 'const font_resolution = 64\nconst font_size = 18\nconst font_spacing = 2'
        });
        const editor = await vscode.window.showTextDocument(doc);

        editor.selections = [
            new vscode.Selection(0, 22, 0, 23),
            new vscode.Selection(1, 16, 1, 17),
            new vscode.Selection(2, 19, 2, 20)
        ];

        await myExtension.alignCursors();

        const text = doc.getText();
        const lines = text.split('\n');
        assert.strictEqual(lines[0], 'const font_resolution = 64');
        assert.strictEqual(lines[1], 'const font_size       = 18');
        assert.strictEqual(lines[2], 'const font_spacing    = 2');
    });
});

