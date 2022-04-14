import * as vscode from 'vscode';
import jwt_decode from "jwt-decode";

const jwtConstants = {
    noTextMessage: 'No text selected',
    invalidToken: 'Invalid token'
};

async function captureInput(): Promise<string | undefined> {
    const editor = vscode.window.activeTextEditor;
    let token: string | undefined = undefined;
    if (!!editor) {
        const selection = editor.selection;
        token = editor.document.getText(selection);
    }
    if (!token) {
        // trying to pick from clipboard
        token = await vscode.env.clipboard.readText();
    }
    return token;
}

export async function decodeToken() {
    const token = await captureInput();
    let decoded: any = undefined;
    let message: string | undefined = undefined;
    let header: any = undefined;
    if (!!token) {
        try {
            decoded = jwt_decode(token, { header: false });
            header = jwt_decode(token, { header: true });
        } catch (error) {
            console.error(error);
        }
        if (!!decoded) {
            showDecodedContent(JSON.stringify(decoded), token, JSON.stringify(header));
            return;
        } else {
            message = jwtConstants.invalidToken;
        }
    } else {
        message = jwtConstants.noTextMessage;
    }
    vscode.window.showInformationMessage(`JWT Extension: ${message}`);
}

function showDecodedContent(decoded: string, token: string, header: string) {
    const title = `JWT Decoded Token`;
    const panel = vscode.window.createWebviewPanel(
        'jwtDecode',
        title,
        vscode.ViewColumn.Beside,
        {}
    );
    panel.webview.html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        </head>
        <body>
            <div style='overflow-wrap: break-word;'>
                <h2>${title}</h2>
                <h3>Decoded</h3>
                <p>${decoded}</p>
                <h4>Header</h4>
                <p>${header}</p>             
                <br>
                <hr>
                <h3>Original token</h3>
                <p>${token}</p>
            </div>
        </body>
        </html>
    `;
}