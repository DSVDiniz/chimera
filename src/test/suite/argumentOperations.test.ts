import * as assert from 'assert';
import * as vscode from 'vscode';
import * as myExtension from '../../extension';

suite('Argument Operations Test Suite', () => {
    test('splitArguments - basic split', async () => {
        const doc = await vscode.workspace.openTextDocument({
            content: 'hello, hello world, a, xxxx, bla'
        });
        const editor = await vscode.window.showTextDocument(doc);

        editor.selection = new vscode.Selection(0, 0, 0, 32);

        await myExtension.splitArguments();

        const text = doc.getText();
        const lines = text.split('\n');

        assert.strictEqual(lines.length, 5);
        assert.strictEqual(lines[0], 'hello,');
        assert.strictEqual(lines[1], 'hello world,');
        assert.strictEqual(lines[2], 'a,');
        assert.strictEqual(lines[3], 'xxxx,');
        assert.strictEqual(lines[4], 'bla');
    });

    test('splitArguments - with extra whitespace', async () => {
        const doc = await vscode.workspace.openTextDocument({
            content: 'foo,  bar,   baz'
        });
        const editor = await vscode.window.showTextDocument(doc);

        editor.selection = new vscode.Selection(0, 0, 0, 16);

        await myExtension.splitArguments();

        const text = doc.getText();
        const lines = text.split('\n');

        assert.strictEqual(lines.length, 3);
        assert.strictEqual(lines[0], 'foo,');
        assert.strictEqual(lines[1], 'bar,');
        assert.strictEqual(lines[2], 'baz');
    });

    test('unsplitArguments - basic unsplit', async () => {
        const doc = await vscode.workspace.openTextDocument({
            content: 'hello,\nhello world,\na,\nxxxx,\nbla'
        });
        const editor = await vscode.window.showTextDocument(doc);

        editor.selection = new vscode.Selection(0, 0, 4, 3);

        await myExtension.unsplitArguments();

        const text = doc.getText();

        assert.strictEqual(text, 'hello,hello world,a,xxxx,bla');
    });

    test('unsplitArguments - with indentation', async () => {
        const doc = await vscode.workspace.openTextDocument({
            content: '  foo,\n  bar,\n  baz'
        });
        const editor = await vscode.window.showTextDocument(doc);

        editor.selection = new vscode.Selection(0, 0, 2, 5);

        await myExtension.unsplitArguments();

        const text = doc.getText();

        assert.strictEqual(text, 'foo,bar,baz');
    });

    test('splitArguments and unsplitArguments - round trip', async () => {
        const original = 'alpha,beta,gamma,delta';
        const doc = await vscode.workspace.openTextDocument({
            content: original
        });
        const editor = await vscode.window.showTextDocument(doc);

        editor.selection = new vscode.Selection(0, 0, 0, original.length);
        await myExtension.splitArguments();

        const split = doc.getText();
        assert.ok(split.includes('\n'));

        const lineCount = split.split('\n').length;
        editor.selection = new vscode.Selection(0, 0, lineCount - 1, split.split('\n')[lineCount - 1].length);
        await myExtension.unsplitArguments();

        const final = doc.getText();
        assert.strictEqual(final, original);
    });

    test('splitArguments - complex cases (quotes and parens)', async () => {
        const input = '"aaaaaa yeah, yeah, yeah",aux string, \'aux\'+ 5,func(a,b,c int)';
        const doc = await vscode.workspace.openTextDocument({
            content: input
        });
        const editor = await vscode.window.showTextDocument(doc);

        editor.selection = new vscode.Selection(0, 0, 0, input.length);

        await myExtension.splitArguments();

        const text = doc.getText();
        const lines = text.split('\n');

        assert.strictEqual(lines.length, 4);
        assert.strictEqual(lines[0], '"aaaaaa yeah, yeah, yeah",');
        assert.strictEqual(lines[1], 'aux string,');
        assert.strictEqual(lines[2], '\'aux\'+ 5,');
        assert.strictEqual(lines[3], 'func(a,b,c int)');
    });

    test('unsplitArguments - complex cases (user example)', async () => {
        const input = '"aaaaaa yeah, yeah, yeah",\naux string, \n\'aux\'+ 5,\nfunc(a,b,c int),';
        const expected = '"aaaaaa yeah, yeah, yeah",aux string,\'aux\'+ 5,func(a,b,c int),';

        const doc = await vscode.workspace.openTextDocument({
            content: input
        });
        const editor = await vscode.window.showTextDocument(doc);

        editor.selection = new vscode.Selection(0, 0, 3, 20); // Select all

        await myExtension.unsplitArguments();

        const text = doc.getText();

        assert.strictEqual(text, expected);
    });
});
