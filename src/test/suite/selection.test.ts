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

    test('increaseSelection does nothing with no active selection', async () => {
        const doc = await vscode.workspace.openTextDocument({
            content: 'hello world'
        });
        const editor = await vscode.window.showTextDocument(doc);

        editor.selection = new vscode.Selection(0, 5, 0, 5);

        await myExtension.increaseSelection('left');

        assert.strictEqual(editor.selection.isEmpty, true);
        assert.strictEqual(editor.selection.start.character, 5);
    });

    test('moveSelectionLeft - basic', async () => {
        const doc = await vscode.workspace.openTextDocument({
            content: 'this is a text'
        });
        const editor = await vscode.window.showTextDocument(doc);
        editor.selection = new vscode.Selection(0, 11, 0, 13);

        await myExtension.moveSelection('left', false);

        assert.strictEqual(doc.getText(), 'this is a extt');
        assert.strictEqual(editor.selection.start.character, 10);
        assert.strictEqual(editor.selection.end.character, 12);
        assert.strictEqual(doc.getText(editor.selection), 'ex');
    });

    test('moveSelectionRight - basic', async () => {
        const doc = await vscode.workspace.openTextDocument({
            content: 'this is a text'
        });
        const editor = await vscode.window.showTextDocument(doc);
        editor.selection = new vscode.Selection(0, 11, 0, 13);

        await myExtension.moveSelection('right', false);

        assert.strictEqual(doc.getText(), 'this is a ttex');
        assert.strictEqual(editor.selection.start.character, 12);
        assert.strictEqual(editor.selection.end.character, 14);
        assert.strictEqual(doc.getText(editor.selection), 'ex');
    });

    test('moveSelectionLeft - at start of document does nothing', async () => {
        const doc = await vscode.workspace.openTextDocument({
            content: 'hello world'
        });
        const editor = await vscode.window.showTextDocument(doc);
        editor.selection = new vscode.Selection(0, 0, 0, 2);

        await myExtension.moveSelection('left', false);

        assert.strictEqual(doc.getText(), 'hello world');
        assert.strictEqual(editor.selection.start.character, 0);
    });

    test('moveSelectionRight - at end of document does nothing', async () => {
        const doc = await vscode.workspace.openTextDocument({
            content: 'hello world'
        });
        const editor = await vscode.window.showTextDocument(doc);
        editor.selection = new vscode.Selection(0, 9, 0, 11);

        await myExtension.moveSelection('right', false);

        assert.strictEqual(doc.getText(), 'hello world');
        assert.strictEqual(editor.selection.end.character, 11);
    });

    test('moveSelection does nothing with no selection', async () => {
        const doc = await vscode.workspace.openTextDocument({
            content: 'hello world'
        });
        const editor = await vscode.window.showTextDocument(doc);
        editor.selection = new vscode.Selection(0, 5, 0, 5); // Just cursor, no selection

        await myExtension.moveSelection('left', false);

        assert.strictEqual(doc.getText(), 'hello world');
        assert.strictEqual(editor.selection.isEmpty, true);
    });

    test('moveSelectionWordLeft - basic', async () => {
        const doc = await vscode.workspace.openTextDocument({
            content: 'hello world test'
        });
        const editor = await vscode.window.showTextDocument(doc);
        editor.selection = new vscode.Selection(0, 12, 0, 16);

        await myExtension.moveSelection('left', true);

        const text = doc.getText();
        assert.ok(text.includes('test'), 'Text should still contain "test"');
        assert.strictEqual(doc.getText(editor.selection), 'test');
    });

    test('moveSelectionWordRight - basic', async () => {
        const doc = await vscode.workspace.openTextDocument({
            content: 'hello world test'
        });
        const editor = await vscode.window.showTextDocument(doc);
        editor.selection = new vscode.Selection(0, 0, 0, 5);

        await myExtension.moveSelection('right', true);

        const text = doc.getText();
        assert.ok(text.includes('hello'), 'Text should still contain "hello"');
        assert.strictEqual(doc.getText(editor.selection), 'hello');
    });

    test('moveSelectionLeft - moves across newline', async () => {
        const doc = await vscode.workspace.openTextDocument({
            content: 'line1\nABC'
        });
        const editor = await vscode.window.showTextDocument(doc);
        editor.selection = new vscode.Selection(1, 0, 1, 1);

        await myExtension.moveSelection('left', false);

        assert.strictEqual(doc.getText(), 'line1A\nBC');
    });
});
