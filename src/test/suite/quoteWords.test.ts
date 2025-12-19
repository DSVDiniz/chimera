import * as assert from 'assert';
import * as vscode from 'vscode';
import * as myExtension from '../../extension';

suite('Quote Words Test Suite', () => {
    test('quoteWords - convert to quoted words', async () => {
        const doc = await vscode.workspace.openTextDocument({
            content: 'assim que eu arrumar um bug aqui'
        });
        const editor = await vscode.window.showTextDocument(doc);

        editor.selection = new vscode.Selection(0, 0, 0, 33);

        await myExtension.quoteWords();

        const text = doc.getText();

        assert.strictEqual(text, '"assim", "que", "eu", "arrumar", "um", "bug", "aqui"');
    });

    test('quoteWords - multiple words with extra spacing', async () => {
        const doc = await vscode.workspace.openTextDocument({
            content: 'hello   world    test'
        });
        const editor = await vscode.window.showTextDocument(doc);

        editor.selection = new vscode.Selection(0, 0, 0, 21);

        await myExtension.quoteWords();

        const text = doc.getText();

        assert.strictEqual(text, '"hello", "world", "test"');
    });

    test('quoteWords - single word', async () => {
        const doc = await vscode.workspace.openTextDocument({
            content: 'hello'
        });
        const editor = await vscode.window.showTextDocument(doc);

        editor.selection = new vscode.Selection(0, 0, 0, 5);

        await myExtension.quoteWords();

        const text = doc.getText();

        assert.strictEqual(text, '"hello"');
    });
});
