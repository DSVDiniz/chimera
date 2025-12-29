import * as assert from 'assert';
import * as vscode from 'vscode';
import * as myExtension from '../../extension';
import { originalSelectionsText } from '../../extension';

suite('Cycle Casing Test Suite', () => {
    test('cycleCasing test', async () => {
        const doc = await vscode.workspace.openTextDocument({
            content: 'helloWorld'
        });
        const editor = await vscode.window.showTextDocument(doc);
        editor.selection = new vscode.Selection(0, 0, 0, 10);

        // camel -> pascal
        await myExtension.cycleCasing();
        assert.strictEqual(doc.getText(), 'HelloWorld');
        // pascal -> upper
        await myExtension.cycleCasing();
        assert.strictEqual(doc.getText(), 'HELLOWORLD');
        // upper -> upper-snake
        await myExtension.cycleCasing();
        assert.strictEqual(doc.getText(), 'HELLO_WORLD');
        // upper-snake -> pascal-snake
        await myExtension.cycleCasing();
        assert.strictEqual(doc.getText(), 'Hello_World');
        // pascal-snake -> camel-snake
        await myExtension.cycleCasing();
        assert.strictEqual(doc.getText(), 'hello_World');
        // camel-snake -> kebab-lower
        await myExtension.cycleCasing();
        assert.strictEqual(doc.getText(), 'hello-world');
        // kebab-lower -> kebab-upper
        await myExtension.cycleCasing();
        assert.strictEqual(doc.getText(), 'HELLO-WORLD');
        // upper-kebab -> lowercase
        await myExtension.cycleCasing();
        assert.strictEqual(doc.getText(), 'helloworld');
        // lowercase -> camel
        await myExtension.cycleCasing();
        assert.strictEqual(doc.getText(), 'helloWorld');
    });

    test('cycleCasing test camel -> pascal', async () => {
        originalSelectionsText.push("helloWorld");
        const doc = await vscode.workspace.openTextDocument({
            content: 'helloWorld'
        });
        const editor = await vscode.window.showTextDocument(doc);
        editor.selection = new vscode.Selection(0, 0, 0, 10);

        // camel -> pascal
        await myExtension.cycleCasing();
        assert.strictEqual(doc.getText(), 'HelloWorld');
    });

    test('cycleCasing test pascal -> upper', async () => {
        originalSelectionsText.push("helloWorld");
        const doc = await vscode.workspace.openTextDocument({
            content: 'HelloWorld'
        });
        const editor = await vscode.window.showTextDocument(doc);
        editor.selection = new vscode.Selection(0, 0, 0, 10);

        // pascal -> upper
        await myExtension.cycleCasing();
        assert.strictEqual(doc.getText(), 'HELLOWORLD');
    });

    test('cycleCasing test upper -> upper-snake', async () => {
        originalSelectionsText.push("helloWorld");
        const doc = await vscode.workspace.openTextDocument({
            content: 'HELLOWORLD'
        });
        const editor = await vscode.window.showTextDocument(doc);
        editor.selection = new vscode.Selection(0, 0, 0, 10);

        // upper -> upper-snake
        await myExtension.cycleCasing();
        assert.strictEqual(doc.getText(), 'HELLO_WORLD');
    });


    test('cycleCasing test upper-snake -> pascal-snake', async () => {
        originalSelectionsText.push("helloWorld");
        const doc = await vscode.workspace.openTextDocument({
            content: 'HELLO_WORLD'
        });
        const editor = await vscode.window.showTextDocument(doc);
        editor.selection = new vscode.Selection(0, 0, 0, 11);

        // upper-snake -> pascal-snake
        await myExtension.cycleCasing();
        assert.strictEqual(doc.getText(), 'Hello_World');
    });
    test('cycleCasing test pascal-snake -> camel-snake', async () => {
        originalSelectionsText.push("helloWorld");
        const doc = await vscode.workspace.openTextDocument({
            content: 'Hello_World'
        });
        const editor = await vscode.window.showTextDocument(doc);
        editor.selection = new vscode.Selection(0, 0, 0, 11);

        // pascal-snake -> camel-snake
        await myExtension.cycleCasing();
        assert.strictEqual(doc.getText(), 'hello_World');
    });
    test('cycleCasing test camel-snake -> kebab-lower', async () => {
        originalSelectionsText.push("helloWorld");
        const doc = await vscode.workspace.openTextDocument({
            content: 'hello_World'
        });
        const editor = await vscode.window.showTextDocument(doc);
        editor.selection = new vscode.Selection(0, 0, 0, 11);

        // camel-snake -> kebab-lower
        await myExtension.cycleCasing();
        assert.strictEqual(doc.getText(), 'hello-world');
    });
    test('cycleCasing test kebab-lower -> kebab-upper', async () => {
        originalSelectionsText.push("helloWorld");
        const doc = await vscode.workspace.openTextDocument({
            content: 'hello-world'
        });
        const editor = await vscode.window.showTextDocument(doc);
        editor.selection = new vscode.Selection(0, 0, 0, 11);

        // kebab-lower -> kebab-upper
        await myExtension.cycleCasing();
        assert.strictEqual(doc.getText(), 'HELLO-WORLD');
    });
    test('cycleCasing test upper-kebab -> lowercase', async () => {
        originalSelectionsText.push("helloWorld");
        const doc = await vscode.workspace.openTextDocument({
            content: 'HELLO-WORLD'
        });
        const editor = await vscode.window.showTextDocument(doc);
        editor.selection = new vscode.Selection(0, 0, 0, 11);

        // upper-kebab -> lowercase
        await myExtension.cycleCasing();
        assert.strictEqual(doc.getText(), 'helloworld');
    });

    test('cycleCasing test kebab-lower -> kebab-upper', async () => {
        originalSelectionsText.push("helloWorld");
        const doc = await vscode.workspace.openTextDocument({
            content: 'helloworld'
        });
        const editor = await vscode.window.showTextDocument(doc);
        editor.selection = new vscode.Selection(0, 0, 0, 10);

        // kebab-lower -> kebab-upper
        await myExtension.cycleCasing();
        assert.strictEqual(doc.getText(), 'helloWorld');
    });
});