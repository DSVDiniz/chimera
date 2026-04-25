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

    test('alignCursors aligns mixed-indent Go function body (1-tab vs 2-tab lines)', async () => {
        // cursors placed at '=' on lines 1, 3, 4, 6 — same scenario as the alignBySymbol tab test
        const content = [
            'func UpdateScreenResize(s *ScreenData, width, height float32) {',
            '\ts.HasResized = s.PrevFrameScreen.X != width || s.PrevFrameScreen.Y != height',
            '\tif s.HasResized {',
            '\t\ts.PrevFrameScreen.X = width',
            '\t\ts.PrevFrameScreen.Y = height',
            '\t}',
            '\ts.HasResized = s.PrevFrameScreen.X != width || s.PrevFrameScreen.Y != height',
            '}'
        ].join('\n');

        const doc = await vscode.workspace.openTextDocument({ content });
        const editor = await vscode.window.showTextDocument(doc);

        // '=' is at char 14 on 1-tab lines, char 22 on 2-tab lines
        editor.selections = [
            new vscode.Selection(1, 14, 1, 14),
            new vscode.Selection(3, 22, 3, 22),
            new vscode.Selection(4, 22, 4, 22),
            new vscode.Selection(6, 14, 6, 14)
        ];

        await myExtension.alignCursors();

        const lines = doc.getText().split('\n');
        assert.strictEqual(lines[0], 'func UpdateScreenResize(s *ScreenData, width, height float32) {');
        assert.strictEqual(lines[1], '\ts.HasResized            = s.PrevFrameScreen.X != width || s.PrevFrameScreen.Y != height');
        assert.strictEqual(lines[2], '\tif s.HasResized {');
        assert.strictEqual(lines[3], '\t\ts.PrevFrameScreen.X = width');
        assert.strictEqual(lines[4], '\t\ts.PrevFrameScreen.Y = height');
        assert.strictEqual(lines[5], '\t}');
        assert.strictEqual(lines[6], '\ts.HasResized            = s.PrevFrameScreen.X != width || s.PrevFrameScreen.Y != height');
        assert.strictEqual(lines[7], '}');
    });

    test('alignCursors aligns mixed-indent Go function body (4-space vs 8-space lines)', async () => {
        // same scenario as above but using spaces instead of tabs
        const content = [
            'func UpdateScreenResize(s *ScreenData, width, height float32) {',
            '    s.HasResized = s.PrevFrameScreen.X != width || s.PrevFrameScreen.Y != height',
            '    if s.HasResized {',
            '        s.PrevFrameScreen.X = width',
            '        s.PrevFrameScreen.Y = height',
            '    }',
            '    s.HasResized = s.PrevFrameScreen.X != width || s.PrevFrameScreen.Y != height',
            '}'
        ].join('\n');

        const doc = await vscode.workspace.openTextDocument({ content });
        const editor = await vscode.window.showTextDocument(doc);

        // '=' is at char 17 on 4-space lines, char 28 on 8-space lines
        editor.selections = [
            new vscode.Selection(1, 17, 1, 17),
            new vscode.Selection(3, 28, 3, 28),
            new vscode.Selection(4, 28, 4, 28),
            new vscode.Selection(6, 17, 6, 17)
        ];

        await myExtension.alignCursors();

        const lines = doc.getText().split('\n');
        assert.strictEqual(lines[0], 'func UpdateScreenResize(s *ScreenData, width, height float32) {');
        assert.strictEqual(lines[1], '    s.HasResized            = s.PrevFrameScreen.X != width || s.PrevFrameScreen.Y != height');
        assert.strictEqual(lines[2], '    if s.HasResized {');
        assert.strictEqual(lines[3], '        s.PrevFrameScreen.X = width');
        assert.strictEqual(lines[4], '        s.PrevFrameScreen.Y = height');
        assert.strictEqual(lines[5], '    }');
        assert.strictEqual(lines[6], '    s.HasResized            = s.PrevFrameScreen.X != width || s.PrevFrameScreen.Y != height');
        assert.strictEqual(lines[7], '}');
    });
});

