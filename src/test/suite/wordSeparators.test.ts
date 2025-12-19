import * as assert from 'assert';
import * as vscode from 'vscode';
import * as myExtension from '../../extension';

suite('Word Separator Test Suite', () => {

    test('switchWordSeparators - switch to Default + _ profile', async () => {
        // defined in package.json
        const expectedSeparators = "`~!@#$%^&*()-=+[{]}\\|;:'\",.<>/?_";

        await myExtension.switchWordSeparators('Default + _');

        const config = vscode.workspace.getConfiguration('editor');
        const currentSeparators = config.get<string>('wordSeparators');

        assert.strictEqual(currentSeparators, expectedSeparators);
    });

    test('switchWordSeparators - switch to Default profile', async () => {
        // defined in package.json
        const expectedSeparators = "`~!@#$%^&*()-=+[{]}\\|;:'\",.<>/?";

        await myExtension.switchWordSeparators('Default');

        const config = vscode.workspace.getConfiguration('editor');
        const currentSeparators = config.get<string>('wordSeparators');

        assert.strictEqual(currentSeparators, expectedSeparators);
    });

    test('switchWordSeparators - invalid profile', async () => {
        const configBefore = vscode.workspace.getConfiguration('editor');
        const separatorsBefore = configBefore.get<string>('wordSeparators');

        await myExtension.switchWordSeparators('InvalidProfileName');

        const configAfter = vscode.workspace.getConfiguration('editor');
        const separatorsAfter = configAfter.get<string>('wordSeparators');

        assert.strictEqual(separatorsAfter, separatorsBefore);
    });
    test('cursor movement integration test', async () => {
        const doc = await vscode.workspace.openTextDocument({
            content: 'hello_world'
        });
        const editor = await vscode.window.showTextDocument(doc);

        const config = vscode.workspace.getConfiguration('editor');
        const originalSeparators = config.get<string>('wordSeparators');

        try {
            await myExtension.switchWordSeparators('Default + _');

            const positionEnd = new vscode.Position(0, 11);
            editor.selection = new vscode.Selection(positionEnd, positionEnd);

            await vscode.commands.executeCommand('cursorWordLeft');
            assert.strictEqual(editor.selection.active.character, 6, 'With "_" as separator, cursor should stop at start of "world"');
            await myExtension.switchWordSeparators('Default');

            editor.selection = new vscode.Selection(positionEnd, positionEnd);
            await vscode.commands.executeCommand('cursorWordLeft');
            assert.strictEqual(editor.selection.active.character, 0, 'Without "_" as separator, cursor should stop at start of "hello_world"');

        } finally {
            await config.update('wordSeparators', originalSeparators, vscode.ConfigurationTarget.Global);
        }
    });
});
