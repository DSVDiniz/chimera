import * as assert from 'assert';
import * as vscode from 'vscode';
import * as myExtension from '../../extension';

suite('Split By Symbol Test Suite', () => {
    test('splits current line when selection is empty', async () => {
        const doc = await vscode.workspace.openTextDocument({
            content: 'this is a sentence with spaces'
        });
        const editor = await vscode.window.showTextDocument(doc);

        editor.selection = new vscode.Selection(0, 4, 0, 4);

        await myExtension.splitBySymbol(' ');

        assert.strictEqual(doc.getText(), 'this\nis\na\nsentence\nwith\nspaces');
    });

    test('splits each multi-cursor line when all selections are empty', async () => {
        const doc = await vscode.workspace.openTextDocument({
            content: 'a-b-c\nkeep\n1-2-3'
        });
        const editor = await vscode.window.showTextDocument(doc);

        editor.selections = [
            new vscode.Selection(0, 0, 0, 0),
            new vscode.Selection(2, 1, 2, 1)
        ];

        await myExtension.splitBySymbol('-');

        assert.strictEqual(doc.getText(), 'a\nb\nc\nkeep\n1\n2\n3');
    });

    test('prioritizes non-empty selections over cursor lines', async () => {
        const doc = await vscode.workspace.openTextDocument({
            content: 'x-x\nalpha beta\ny-y'
        });
        const editor = await vscode.window.showTextDocument(doc);

        editor.selections = [
            new vscode.Selection(0, 0, 0, 0),
            new vscode.Selection(1, 0, 1, 10),
            new vscode.Selection(2, 0, 2, 0)
        ];

        await myExtension.splitBySymbol(' ');

        assert.strictEqual(doc.getText(), 'x-x\nalpha\nbeta\ny-y');
    });

    test('supports multiple non-empty selections', async () => {
        const doc = await vscode.workspace.openTextDocument({
            content: 'aa,bb\ncc,dd'
        });
        const editor = await vscode.window.showTextDocument(doc);

        editor.selections = [
            new vscode.Selection(0, 0, 0, 5),
            new vscode.Selection(1, 0, 1, 5)
        ];

        await myExtension.splitBySymbol(',');

        assert.strictEqual(doc.getText(), 'aa\nbb\ncc\ndd');
    });
});
