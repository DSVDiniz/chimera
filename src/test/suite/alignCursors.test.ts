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

    test('alignCursors aligns by visual column when cursors are on tab-indented lines', async () => {
        // line 0: `\ta: 1`, cursor after `\ta` at char 2 → visual col 5 (tab=4)
        // line 1: `\t\ta: 2`, cursor after `\t\ta` at char 3 → visual col 9
        // line 0 needs 4 spaces inserted so both cursors land at visual col 9
        const doc = await vscode.workspace.openTextDocument({
            content: '\ta: 1\n\t\ta: 2'
        });
        const editor = await vscode.window.showTextDocument(doc);

        editor.selections = [
            new vscode.Selection(0, 2, 0, 2),
            new vscode.Selection(1, 3, 1, 3)
        ];

        await myExtension.alignCursors();

        const lines = doc.getText().split('\n');
        assert.strictEqual(lines[0], '\ta    : 1');
        assert.strictEqual(lines[1], '\t\ta: 2');
    });
});

