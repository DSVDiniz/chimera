import * as assert from 'assert';
import * as vscode from 'vscode';
import * as myExtension from '../../extension';

suite('Selection Commands Test Suite', () => {
    test('increaseSelectionLeft test', async () => {
        const doc = await vscode.workspace.openTextDocument({
            content: 'hello world'
        });
        const editor = await vscode.window.showTextDocument(doc);
        editor.selection = new vscode.Selection(0, 1, 0, 5);

        await myExtension.increaseSelection('left');

        assert.strictEqual(editor.selection.start.character, 0);
        assert.strictEqual(editor.selection.end.character, 5);
        assert.strictEqual(doc.getText(editor.selection), 'hello');
    });

    test('increaseSelectionRight test', async () => {
        const doc = await vscode.workspace.openTextDocument({
            content: 'hello world'
        });
        const editor = await vscode.window.showTextDocument(doc);
        editor.selection = new vscode.Selection(0, 0, 0, 4);

        await myExtension.increaseSelection('right');

        assert.strictEqual(editor.selection.start.character, 0);
        assert.strictEqual(editor.selection.end.character, 5);
        assert.strictEqual(doc.getText(editor.selection), 'hello');
    });

    test('increaseSelection wrap line test', async () => {
        const doc = await vscode.workspace.openTextDocument({
            content: 'line1\nline2'
        });
        const editor = await vscode.window.showTextDocument(doc);

        const line2Start = doc.positionAt(6);
        const line2End = doc.positionAt(11);
        editor.selection = new vscode.Selection(line2Start, line2End);

        await myExtension.increaseSelection('left');

        assert.strictEqual(doc.getText(editor.selection), '\nline2');

        await myExtension.increaseSelection('left');
        await myExtension.increaseSelection('left');
        assert.strictEqual(doc.getText(editor.selection), '1\nline2');
    });

    test('increaseSelection multiple selections test', async () => {
        const doc = await vscode.workspace.openTextDocument({
            content: 'foo bar\nbaz qux'
        });
        const editor = await vscode.window.showTextDocument(doc);

        editor.selections = [
            new vscode.Selection(0, 1, 0, 3),
            new vscode.Selection(1, 1, 1, 3)
        ];

        await myExtension.increaseSelection('left');

        const sels = editor.selections;
        assert.strictEqual(doc.getText(sels[0]), 'foo');
        assert.strictEqual(doc.getText(sels[1]), 'baz');
    });
});
