import * as assert from 'assert';
import * as vscode from 'vscode';
import * as myExtension from '../../extension';

suite('Word Separator Test Suite', () => {

    test('switchWordSeparators - switch to Default + _ profile', async () => {
        const expectedSeparators = "`~!@#$%^&*()-=+[{]}\\|;:'\",.<>/?_";

        await myExtension.switchWordSeparators('Default + _');

        const config = vscode.workspace.getConfiguration('editor');
        const currentSeparators = config.get<string>('wordSeparators');

        assert.strictEqual(currentSeparators, expectedSeparators);
    });

    test('switchWordSeparators - switch to Default profile', async () => {
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

    test('switchWordSeparators - switch to eclipse profile', async () => {
        const expectedSeparators = "`~!@#$%^&*()-=+[{]}\\|;:'\",.<>/?ABCDEFGHIJKLMNOPQRSTUVWXYZ";

        await myExtension.switchWordSeparators('Eclipse-like');

        const config = vscode.workspace.getConfiguration('editor');
        const currentSeparators = config.get<string>('wordSeparators');

        assert.strictEqual(currentSeparators, expectedSeparators);
    });

    test('eclipse cursor movement', async () => {
        const doc = await vscode.workspace.openTextDocument({
            content: 'methodWithJavaNamingConvention'
        });
        const editor = await vscode.window.showTextDocument(doc);

        const config = vscode.workspace.getConfiguration('editor');
        const originalSeparators = config.get<string>('wordSeparators');

        try {
            await myExtension.switchWordSeparators('Eclipse-like');
            editor.selection = new vscode.Selection(new vscode.Position(0, 0), new vscode.Position(0, 0));

            await vscode.commands.executeCommand('cursorWordRight');
            assert.strictEqual(editor.selection.active.character, 6, 'Should stop after "method"');

            await vscode.commands.executeCommand('cursorWordRight');
            assert.strictEqual(editor.selection.active.character, 10, 'Should stop after "With"');

            await vscode.commands.executeCommand('cursorWordRight');
            assert.strictEqual(editor.selection.active.character, 14, 'Should stop after "Java"');
        } finally {
            await config.update('wordSeparators', originalSeparators, vscode.ConfigurationTarget.Global);
        }
    });

    test('status bar updates correctly', async () => {
        const config = vscode.workspace.getConfiguration('editor');
        const originalSeparators = config.get<string>('wordSeparators');

        try {
            await myExtension.switchWordSeparators('Default');
            await new Promise(resolve => setTimeout(resolve, 500));
            await myExtension.switchWordSeparators('Eclipse-like');
            await new Promise(resolve => setTimeout(resolve, 500));

            const statusText = await vscode.commands.executeCommand('chimera.getWordSeparatorStatusText');
            assert.strictEqual(statusText, '$(file-code) Eclipse-like');

            await myExtension.switchWordSeparators('Default');
            await new Promise(resolve => setTimeout(resolve, 500));
        } finally {
            await config.update('wordSeparators', originalSeparators, vscode.ConfigurationTarget.Global);
        }
    });
});
