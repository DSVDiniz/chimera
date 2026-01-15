import * as assert from 'assert';
import * as vscode from 'vscode';
import * as myExtension from '../../extension';

suite('Word Separator Test Suite', () => {

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

    test('switchWordSeparators - switch to Default + _ profile', async () => {
        const expectedSeparators = "`~!@#$%^&*()-=+[{]}\\|;:'\",.<>/?_";

        await myExtension.switchWordSeparators('Default + _');

        const config = vscode.workspace.getConfiguration('editor');
        const currentSeparators = config.get<string>('wordSeparators');

        assert.strictEqual(currentSeparators, expectedSeparators);
    });

    test('status bar updates correctly', async () => {
        const config = vscode.workspace.getConfiguration('editor');
        const originalSeparators = config.get<string>('wordSeparators');

        try {
            await myExtension.switchWordSeparators('Default');
            await new Promise(resolve => setTimeout(resolve, 500));
            await myExtension.switchWordSeparators('Default + _');
            await new Promise(resolve => setTimeout(resolve, 500));

            const statusText = await vscode.commands.executeCommand('chimera.getWordSeparatorStatusText');
            assert.strictEqual(statusText, '$(file-code) Default + _');

            await myExtension.switchWordSeparators('Default');
            await new Promise(resolve => setTimeout(resolve, 500));
        } finally {
            await config.update('wordSeparators', originalSeparators, vscode.ConfigurationTarget.Global);
        }
    });
});
