import * as assert from 'assert';
import * as vscode from 'vscode';
import * as myExtension from '../../extension';

suite('Cycle Quotes Test Suite', () => {

    test('Cycle quotes - double to single (selection)', async () => {
        const doc = await vscode.workspace.openTextDocument({
            content: 'const a = "hello";'
        });
        const editor = await vscode.window.showTextDocument(doc);
        editor.selection = new vscode.Selection(new vscode.Position(0, 10), new vscode.Position(0, 17)); // "hello"

        await myExtension.cycleQuotes();

        assert.strictEqual(doc.getText(), "const a = 'hello';");
    });

    test('Cycle quotes - single to backtick (selection)', async () => {
        const doc = await vscode.workspace.openTextDocument({
            content: "const a = 'hello';"
        });
        const editor = await vscode.window.showTextDocument(doc);
        editor.selection = new vscode.Selection(new vscode.Position(0, 10), new vscode.Position(0, 17)); // 'hello'

        await myExtension.cycleQuotes();

        assert.strictEqual(doc.getText(), 'const a = `hello`;');
    });

    test('Cycle quotes - backtick to double (selection)', async () => {
        const doc = await vscode.workspace.openTextDocument({
            content: 'const a = `hello`;'
        });
        const editor = await vscode.window.showTextDocument(doc);
        editor.selection = new vscode.Selection(new vscode.Position(0, 10), new vscode.Position(0, 17)); // `hello`

        await myExtension.cycleQuotes();

        assert.strictEqual(doc.getText(), 'const a = "hello";');
    });

    test('Cycle quotes - no selection, cursor inside string', async () => {
        const doc = await vscode.workspace.openTextDocument({
            content: 'const a = "hello";'
        });
        const editor = await vscode.window.showTextDocument(doc);
        editor.selection = new vscode.Selection(new vscode.Position(0, 13), new vscode.Position(0, 13)); // Inside hello

        await myExtension.cycleQuotes();

        assert.strictEqual(doc.getText(), "const a = 'hello';");
    });



    test('Cycle quotes - selection without quotes', async () => {
        const doc = await vscode.workspace.openTextDocument({
            content: '"hello"'
        });
        const editor = await vscode.window.showTextDocument(doc);
        editor.selection = new vscode.Selection(new vscode.Position(0, 1), new vscode.Position(0, 5)); // hello

        await myExtension.cycleQuotes();

        assert.strictEqual(doc.getText(), "'hello'");
    });

    test('Cycle quotes - multi-line backticks', async () => {
        const content = `const test = \`
        aaaa
        bbb
        \`;`;
        const doc = await vscode.workspace.openTextDocument({ content });
        const editor = await vscode.window.showTextDocument(doc);
        const lines = content.split('\n');
        editor.selection = new vscode.Selection(new vscode.Position(1, 10), new vscode.Position(1, 10));

        await myExtension.cycleQuotes();

        const text = doc.getText();
        assert.ok(text.includes('const test = "'), 'Should start with "');
        assert.ok(text.endsWith('";'), 'Should end with "');
    });
});
