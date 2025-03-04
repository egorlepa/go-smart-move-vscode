const vscode = require("vscode");

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    let renameListener = vscode.workspace.onDidRenameFiles(async (event) => {
        for (const file of event.files) {
            if (file.newUri.fsPath.endsWith(".go")) {
                await handleGoFileMove(file.oldUri, file.newUri);
            }
        }
    });

    let createListener = vscode.workspace.onDidCreateFiles(async (event) => {
        for (const file of event.files) {
            if (file.fsPath.endsWith(".go")) {
                await handleGoFileCreation(file);
            }
        }
    });

    context.subscriptions.push(renameListener, createListener);
}

/**
 * @param {vscode.Uri} oldUri
 * @param {vscode.Uri} newUri
 */
async function handleGoFileMove(oldUri, newUri) {
    const oldPathParts = oldUri.fsPath.split("/");
    const newPathParts = newUri.fsPath.split("/");

    const oldPackage = oldPathParts[oldPathParts.length - 2];
    const newPackage = newPathParts[newPathParts.length - 2];

    if (oldPackage !== newPackage) {
        const document = await vscode.workspace.openTextDocument(newUri);
        const text = document.getText();
        const updatedText = text.replace(/^package\s+\w+/m, `package ${newPackage}`);

        const edit = new vscode.WorkspaceEdit();
        edit.replace(newUri, new vscode.Range(0, 0, document.lineCount, 0), updatedText);
        await vscode.workspace.applyEdit(edit);
        // vscode.window.showInformationMessage(`Updated package name to '${newPackage}'`);
    }
}

/**
 * @param {vscode.Uri} fileUri
 */
async function handleGoFileCreation(fileUri) {
    const pathParts = fileUri.fsPath.split("/");
    const packageName = pathParts[pathParts.length - 2];

    const document = await vscode.workspace.openTextDocument(fileUri);
    if (document.getText().trim() === "") {
        const edit = new vscode.WorkspaceEdit();
        edit.insert(fileUri, new vscode.Position(0, 0), `package ${packageName}\n`);
        await vscode.workspace.applyEdit(edit);
        // vscode.window.showInformationMessage(`Set package to '${packageName}' in new file.`);
    }
}

function deactivate() {}

module.exports = {
    activate,
    deactivate
};
