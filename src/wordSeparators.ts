import * as vscode from 'vscode';

let suppressStatusUpdate = false;

export const activateWordSeparators = (context: vscode.ExtensionContext) => {
    const wordSeparatorStatus = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    wordSeparatorStatus.tooltip = "Current Word Separator Profile";
    context.subscriptions.push(wordSeparatorStatus);

    const updateWordSeparatorStatus = () => {
        if (suppressStatusUpdate) {
            return;
        }

        const config = vscode.workspace.getConfiguration('chimera');
        const profiles = config.get<Record<string, string>>('wordSeparatorProfiles', {});
        const editorConfig = vscode.workspace.getConfiguration('editor');
        const currentSeparators = editorConfig.get<string>('wordSeparators');

        let matchedProfile: string | undefined;

        for (const [name, separators] of Object.entries(profiles)) {
            if (separators === currentSeparators) {
                matchedProfile = name;
                break;
            }
        }

        if (matchedProfile && matchedProfile.toLowerCase() !== 'default') {
            wordSeparatorStatus.text = `$(file-code) ${matchedProfile}`;
            wordSeparatorStatus.show();
        } else {
            wordSeparatorStatus.hide();
        }
    };

    updateWordSeparatorStatus();

    context.subscriptions.push(
        vscode.workspace.onDidChangeConfiguration((e) => {
            if (e.affectsConfiguration('editor.wordSeparators') || e.affectsConfiguration('chimera.wordSeparatorProfiles')) {
                updateWordSeparatorStatus();
            }
        }),
        vscode.commands.registerCommand('chimera.getWordSeparatorStatusText', () => {
            return wordSeparatorStatus.text;
        })
    );
};

export const switchWordSeparators = async (profileName?: string) => {
    const config = vscode.workspace.getConfiguration('chimera');
    const profiles = config.get<Record<string, string>>('wordSeparatorProfiles', {});

    if (Object.keys(profiles).length === 0) {
        vscode.window.showInformationMessage('No word separator profiles defined in settings (chimera.wordSeparatorProfiles).');
        return;
    }

    let selectedProfile = profileName;

    if (!selectedProfile) {
        const items = Object.entries(profiles).map(([key, value]) => ({
            label: key,
            description: value
        }));

        const selection = await vscode.window.showQuickPick(items, {
            placeHolder: 'Select a word separator profile'
        });

        if (selection) {
            selectedProfile = selection.label;
        }
    }

    if (selectedProfile) {
        const separators = profiles[selectedProfile];
        if (separators === undefined) {
            vscode.window.showErrorMessage(`Profile "${selectedProfile}" not found.`);
            return;
        }
        const editorConfig = vscode.workspace.getConfiguration('editor');
        await editorConfig.update('wordSeparators', separators, vscode.ConfigurationTarget.Global);
        if (!profileName) {
            vscode.window.showInformationMessage(`Switched word separators to profile "${selectedProfile}"`);
        }
    }
};

const getSecondaryWordSeparators = (): string => {
    const config = vscode.workspace.getConfiguration('chimera');
    const profileName = config.get<string>('secondaryWordSeparatorProfile', 'Eclipse-like');
    const profiles = config.get<Record<string, string>>('wordSeparatorProfiles', {});
    return profiles[profileName] || '';
};

export const cursorWordSecondary = async (direction: 'left' | 'right') => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        return;
    }

    const separators = getSecondaryWordSeparators();
    if (!separators) {
        return;
    }

    const editorConfig = vscode.workspace.getConfiguration('editor');
    const originalSeparators = editorConfig.get<string>('wordSeparators');

    suppressStatusUpdate = true;
    try {
        await editorConfig.update('wordSeparators', separators, vscode.ConfigurationTarget.Global);

        if (direction === 'right') {
            await vscode.commands.executeCommand('cursorWordRight');
        } else {
            await vscode.commands.executeCommand('cursorWordLeft');
        }
    } finally {
        await editorConfig.update('wordSeparators', originalSeparators, vscode.ConfigurationTarget.Global);
        suppressStatusUpdate = false;
    }
};


export const switchSecondaryWordSeparators = async () => {
    const config = vscode.workspace.getConfiguration('chimera');
    const profiles = config.get<Record<string, string>>('wordSeparatorProfiles', {});
    const currentProfile = config.get<string>('secondaryWordSeparatorProfile', '');

    if (Object.keys(profiles).length === 0) {
        vscode.window.showInformationMessage('No word separator profiles defined.');
        return;
    }

    const items = Object.entries(profiles).map(([key, value]) => ({
        label: key,
        description: value,
        picked: key === currentProfile
    }));

    const selection = await vscode.window.showQuickPick(items, {
        placeHolder: 'Select a secondary word separator profile'
    });

    if (selection) {
        await config.update('secondaryWordSeparatorProfile', selection.label, vscode.ConfigurationTarget.Global);
        vscode.window.showInformationMessage(`Secondary word separator set to "${selection.label}"`);
    }
};
