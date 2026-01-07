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

    test('moveArgument - move right basic', async () => {
        const doc = await vscode.workspace.openTextDocument({
            content: 'func(100, 150, 50, 60)'
        });
        const editor = await vscode.window.showTextDocument(doc);

        editor.selection = new vscode.Selection(0, 5, 0, 5);

        await myExtension.moveArgument('right');

        const text = doc.getText();
        assert.strictEqual(text, 'func(150, 100, 50, 60)');
    });

    test('moveArgument - move left basic', async () => {
        const doc = await vscode.workspace.openTextDocument({
            content: 'func(100, 150, 50, 60)'
        });
        const editor = await vscode.window.showTextDocument(doc);

        editor.selection = new vscode.Selection(0, 10, 0, 10);

        await myExtension.moveArgument('left');

        const text = doc.getText();
        assert.strictEqual(text, 'func(150, 100, 50, 60)');
    });

    test('moveArgument - does nothing at leftmost position', async () => {
        const doc = await vscode.workspace.openTextDocument({
            content: 'func(100, 150, 50)'
        });
        const editor = await vscode.window.showTextDocument(doc);

        editor.selection = new vscode.Selection(0, 5, 0, 5);

        await myExtension.moveArgument('left');

        const text = doc.getText();
        assert.strictEqual(text, 'func(100, 150, 50)');
    });

    test('moveArgument - does nothing at rightmost position', async () => {
        const doc = await vscode.workspace.openTextDocument({
            content: 'func(100, 150, 50)'
        });
        const editor = await vscode.window.showTextDocument(doc);

        editor.selection = new vscode.Selection(0, 16, 0, 16);

        await myExtension.moveArgument('right');

        const text = doc.getText();
        assert.strictEqual(text, 'func(100, 150, 50)');
    });

    test('moveArgument - preserves nested function calls', async () => {
        const doc = await vscode.workspace.openTextDocument({
            content: 'outer(inner(a, b), c, d)'
        });
        const editor = await vscode.window.showTextDocument(doc);

        editor.selection = new vscode.Selection(0, 6, 0, 6);

        await myExtension.moveArgument('right');

        const text = doc.getText();
        assert.strictEqual(text, 'outer(c, inner(a, b), d)');
    });

    test('moveArgument - preserves quoted strings with commas', async () => {
        const doc = await vscode.workspace.openTextDocument({
            content: 'func("hello, world", b, c)'
        });
        const editor = await vscode.window.showTextDocument(doc);

        editor.selection = new vscode.Selection(0, 5, 0, 5);

        await myExtension.moveArgument('right');

        const text = doc.getText();
        assert.strictEqual(text, 'func(b, "hello, world", c)');
    });

    test('moveArgument - multi-line works', async () => {
        const doc = await vscode.workspace.openTextDocument({
            content: 'func(\n    100,\n    150,\n    50\n)'
        });
        const editor = await vscode.window.showTextDocument(doc);

        editor.selection = new vscode.Selection(1, 4, 1, 4);

        await myExtension.moveArgument('right');

        const text = doc.getText();
        assert.strictEqual(text, 'func(150, 100, 50)');
    });

    test('moveArgument - single-line with trailing comma', async () => {
        const doc = await vscode.workspace.openTextDocument({
            content: 'func(a, b, c,)'
        });
        const editor = await vscode.window.showTextDocument(doc);

        editor.selection = new vscode.Selection(0, 5, 0, 5);

        await myExtension.moveArgument('right');

        const text = doc.getText();
        assert.strictEqual(text, 'func(b, a, c)');
    });

    test('moveArgument - Go function declaration', async () => {
        const doc = await vscode.workspace.openTextDocument({
            content: 'func DrawRectangle(x, y, w, h int) {'
        });
        const editor = await vscode.window.showTextDocument(doc);

        editor.selection = new vscode.Selection(0, 19, 0, 19);

        await myExtension.moveArgument('right');

        const text = doc.getText();
        assert.strictEqual(text, 'func DrawRectangle(y, x, w, h int) {');
    });

    test('moveArgument - TypeScript function declaration', async () => {
        const doc = await vscode.workspace.openTextDocument({
            content: 'function greet(name: string, age: number, active: boolean) {'
        });
        const editor = await vscode.window.showTextDocument(doc);

        editor.selection = new vscode.Selection(0, 29, 0, 29);

        await myExtension.moveArgument('right');

        const text = doc.getText();
        assert.strictEqual(text, 'function greet(name: string, active: boolean, age: number) {');
    });

    test('moveArgument - arrow function', async () => {
        const doc = await vscode.workspace.openTextDocument({
            content: 'const fn = (a, b, c) => a + b + c;'
        });
        const editor = await vscode.window.showTextDocument(doc);

        editor.selection = new vscode.Selection(0, 12, 0, 12);

        await myExtension.moveArgument('right');

        const text = doc.getText();
        assert.strictEqual(text, 'const fn = (b, a, c) => a + b + c;');
    });

    test('moveArgument - Python-style function', async () => {
        const doc = await vscode.workspace.openTextDocument({
            content: 'def process(data, callback, options=None):'
        });
        const editor = await vscode.window.showTextDocument(doc);

        editor.selection = new vscode.Selection(0, 12, 0, 12);

        await myExtension.moveArgument('right');

        const text = doc.getText();
        assert.strictEqual(text, 'def process(callback, data, options=None):');
    });

    test('moveArgument - empty parentheses does nothing', async () => {
        const doc = await vscode.workspace.openTextDocument({
            content: 'func()'
        });
        const editor = await vscode.window.showTextDocument(doc);

        editor.selection = new vscode.Selection(0, 5, 0, 5);

        await myExtension.moveArgument('right');

        const text = doc.getText();
        assert.strictEqual(text, 'func()');
    });

    test('moveArgument - single argument does nothing', async () => {
        const doc = await vscode.workspace.openTextDocument({
            content: 'func(onlyOne)'
        });
        const editor = await vscode.window.showTextDocument(doc);

        editor.selection = new vscode.Selection(0, 5, 0, 5);

        await myExtension.moveArgument('right');

        const text = doc.getText();
        assert.strictEqual(text, 'func(onlyOne)');
    });

    test('moveArgument - cursor before opening paren does nothing', async () => {
        const doc = await vscode.workspace.openTextDocument({
            content: 'func(a, b, c)'
        });
        const editor = await vscode.window.showTextDocument(doc);

        editor.selection = new vscode.Selection(0, 2, 0, 2);

        await myExtension.moveArgument('right');

        const text = doc.getText();
        assert.strictEqual(text, 'func(a, b, c)');
    });

    test('moveArgument - multiple parens on line uses nearest enclosing', async () => {
        const doc = await vscode.workspace.openTextDocument({
            content: 'outer(inner(a, b), c)'
        });
        const editor = await vscode.window.showTextDocument(doc);

        editor.selection = new vscode.Selection(0, 12, 0, 12);

        await myExtension.moveArgument('right');

        const text = doc.getText();
        assert.strictEqual(text, 'outer(inner(b, a), c)');
    });

    test('moveArgument - handles array literals', async () => {
        const doc = await vscode.workspace.openTextDocument({
            content: 'const arr = func([1, 2, 3], other)'
        });
        const editor = await vscode.window.showTextDocument(doc);

        editor.selection = new vscode.Selection(0, 17, 0, 17);

        await myExtension.moveArgument('right');

        const text = doc.getText();
        assert.strictEqual(text, 'const arr = func(other, [1, 2, 3])');
    });

    test('moveArgument - handles object literals', async () => {
        const doc = await vscode.workspace.openTextDocument({
            content: 'call({a: 1, b: 2}, second)'
        });
        const editor = await vscode.window.showTextDocument(doc);

        editor.selection = new vscode.Selection(0, 5, 0, 5);

        await myExtension.moveArgument('right');

        const text = doc.getText();
        assert.strictEqual(text, 'call(second, {a: 1, b: 2})');
    });

    test('moveArgument - irregular whitespace normalizes result', async () => {
        const doc = await vscode.workspace.openTextDocument({
            content: 'func(  a  ,   b   ,  c  )'
        });
        const editor = await vscode.window.showTextDocument(doc);

        editor.selection = new vscode.Selection(0, 7, 0, 7);

        await myExtension.moveArgument('right');

        const text = doc.getText();

        assert.strictEqual(text, 'func(b, a, c)');
    });

    test('moveArgument - template literal argument', async () => {
        const doc = await vscode.workspace.openTextDocument({
            content: 'func(`hello ${name}`, b, c)'
        });
        const editor = await vscode.window.showTextDocument(doc);

        editor.selection = new vscode.Selection(0, 5, 0, 5);

        await myExtension.moveArgument('right');

        const text = doc.getText();
        assert.strictEqual(text, 'func(b, `hello ${name}`, c)');
    });

    test('moveArgument - deeply nested structure', async () => {
        const doc = await vscode.workspace.openTextDocument({
            content: 'a(b(c(d, e)), f)'
        });
        const editor = await vscode.window.showTextDocument(doc);

        editor.selection = new vscode.Selection(0, 2, 0, 2);

        await myExtension.moveArgument('right');

        const text = doc.getText();
        assert.strictEqual(text, 'a(f, b(c(d, e)))');
    });

    test('moveArgument - cursor at closing paren does nothing', async () => {
        const doc = await vscode.workspace.openTextDocument({
            content: 'func(a, b, c)'
        });
        const editor = await vscode.window.showTextDocument(doc);

        editor.selection = new vscode.Selection(0, 12, 0, 12);

        await myExtension.moveArgument('left');

        const text = doc.getText();
        assert.strictEqual(text, 'func(a, b, c)');
    });
});

