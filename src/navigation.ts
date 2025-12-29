import * as vscode from 'vscode';

export const scrollFast = async (direction: 'up' | 'down') => {
    const config = vscode.workspace.getConfiguration('chimera');
    const lineCount = config.get<number>('scrollFastLineCount', 3);

    await vscode.commands.executeCommand('cursorMove', {
        to: direction,
        by: 'line',
        value: lineCount,
        select: false
    });
};
