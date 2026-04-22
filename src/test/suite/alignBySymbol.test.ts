import * as assert from 'assert';
import * as vscode from 'vscode';
import * as myExtension from '../../extension';

suite('Align By Symbol Test Suite', () => {
    test('aligns selected lines by first symbol occurrence', async () => {
        const doc = await vscode.workspace.openTextDocument({
            content: 'my_var := 10\nmy_var_name := 10\nmy_var_name_bigger := 10'
        });
        const editor = await vscode.window.showTextDocument(doc);

        editor.selection = new vscode.Selection(0, 0, 2, doc.lineAt(2).text.length);

        await myExtension.alignBySymbol(':');

        const lines = doc.getText().split('\n');
        assert.strictEqual(lines[0], 'my_var             := 10');
        assert.strictEqual(lines[1], 'my_var_name        := 10');
        assert.strictEqual(lines[2], 'my_var_name_bigger := 10');
    });

    test('does nothing with single empty cursor (no selection)', async () => {
        const doc = await vscode.workspace.openTextDocument({
            content: 'a: 1\nbbb: 2'
        });
        const editor = await vscode.window.showTextDocument(doc);

        editor.selection = new vscode.Selection(0, 1, 0, 1);

        await myExtension.alignBySymbol(':');

        assert.strictEqual(doc.getText(), 'a: 1\nbbb: 2');
    });

    test('uses each cursor line when multiple empty cursors exist', async () => {
        const doc = await vscode.workspace.openTextDocument({
            content: 'a: 1\nbbb: 2\ncccc: 3'
        });
        const editor = await vscode.window.showTextDocument(doc);

        editor.selections = [
            new vscode.Selection(0, 0, 0, 0),
            new vscode.Selection(1, 0, 1, 0),
            new vscode.Selection(2, 0, 2, 0)
        ];

        await myExtension.alignBySymbol(':');

        const lines = doc.getText().split('\n');
        assert.strictEqual(lines[0], 'a   : 1');
        assert.strictEqual(lines[1], 'bbb : 2');
        assert.strictEqual(lines[2], 'cccc: 3');
    });

    test('aligns by first occurrence only', async () => {
        const doc = await vscode.workspace.openTextDocument({
            content: 'x: y: z\nlonger_name: k: v'
        });
        const editor = await vscode.window.showTextDocument(doc);

        editor.selection = new vscode.Selection(0, 0, 1, doc.lineAt(1).text.length);

        await myExtension.alignBySymbol(':');

        const lines = doc.getText().split('\n');
        assert.strictEqual(lines[0], 'x          : y: z');
        assert.strictEqual(lines[1], 'longer_name: k: v');
    });

    test('ignores lines without symbol while aligning others', async () => {
        const doc = await vscode.workspace.openTextDocument({
            content: 'short = 1\nno symbol here\nlong_name = 2'
        });
        const editor = await vscode.window.showTextDocument(doc);

        editor.selection = new vscode.Selection(0, 0, 2, doc.lineAt(2).text.length);

        await myExtension.alignBySymbol('=');

        const lines = doc.getText().split('\n');
        assert.strictEqual(lines[0], 'short     = 1');
        assert.strictEqual(lines[1], 'no symbol here');
        assert.strictEqual(lines[2], 'long_name = 2');
    });
});
