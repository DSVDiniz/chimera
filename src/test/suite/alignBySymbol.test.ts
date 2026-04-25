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

    test('aligns by visual column when lines have different tab indentation', async () => {
        // line 0: 1 tab indent, lines 2+3: 2 tab indent — tabs must be expanded before computing max column
        const doc = await vscode.workspace.openTextDocument({
            content: '\ts.HasResized = s.PrevFrameScreen.X != width\n\tif s.HasResized {\n\t\ts.PrevFrameScreen.X = width\n\t\ts.PrevFrameScreen.Y = height\n\t}'
        });
        const editor = await vscode.window.showTextDocument(doc);

        editor.selection = new vscode.Selection(0, 0, 4, doc.lineAt(4).text.length);

        await myExtension.alignBySymbol('=');

        const tabSize = 4;
        const visualCol = (text: string, charIdx: number) => {
            let col = 0;
            for (let i = 0; i < charIdx; i++) {
                col = text[i] === '\t' ? Math.floor(col / tabSize) * tabSize + tabSize : col + 1;
            }
            return col;
        };

        const lines = doc.getText().split('\n');
        const vcLine0 = visualCol(lines[0], lines[0].indexOf('='));
        const vcLine2 = visualCol(lines[2], lines[2].indexOf('='));
        const vcLine3 = visualCol(lines[3], lines[3].indexOf('='));
        assert.strictEqual(vcLine0, vcLine2, 'visual columns of = should match between 1-tab and 2-tab lines');
        assert.strictEqual(vcLine2, vcLine3, 'lines with same indentation stay equal');
        assert.strictEqual(lines[1], '\tif s.HasResized {', 'non-matching line unchanged');
        assert.strictEqual(lines[4], '\t}', 'non-matching line unchanged');
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
