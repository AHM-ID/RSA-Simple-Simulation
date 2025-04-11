// Helper functions for ArrayBuffer/Base64 conversion
function arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    bytes.forEach((b) => (binary += String.fromCharCode(b)));
    return window.btoa(binary);
}

function base64ToArrayBuffer(base64) {
    const binary = window.atob(base64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
}

// Export public key to PEM format
async function exportPublicKey(key) {
    const spki = await crypto.subtle.exportKey("spki", key);
    const b64 = arrayBufferToBase64(spki);
    const pemHeader = "-----BEGIN PUBLIC KEY-----\n";
    const pemFooter = "\n-----END PUBLIC KEY-----";
    const pemBody = b64.match(/.{1,64}/g).join("\n");
    return pemHeader + pemBody + pemFooter;
}

// RSA-OAEP encryption/decryption functions
async function encryptMessage(message, publicKey) {
    const encoder = new TextEncoder();
    const encoded = encoder.encode(message);
    const encryptedBuffer = await crypto.subtle.encrypt(
        { name: "RSA-OAEP" },
        publicKey,
        encoded
    );
    return arrayBufferToBase64(encryptedBuffer);
}

async function decryptMessage(cipherText, privateKey) {
    try {
        const cipherBuffer = base64ToArrayBuffer(cipherText);
        const decryptedBuffer = await crypto.subtle.decrypt(
            { name: "RSA-OAEP" },
            privateKey,
            cipherBuffer
        );
        const decoder = new TextDecoder();
        return decoder.decode(decryptedBuffer);
    } catch (e) {
        return null;
    }
}

// Function to create an icon element
function createIcon(iconClass) {
    const icon = document.createElement("i");
    icon.className = iconClass;
    return icon;
}

// Main application logic
document.addEventListener("DOMContentLoaded", async function () {
    // Generate RSA key pair (1024-bit for demo purposes)
    const rsaKeyPair = await crypto.subtle.generateKey(
        {
            name: "RSA-OAEP",
            modulusLength: 1024,
            publicExponent: new Uint8Array([1, 0, 1]),
            hash: "SHA-256",
        },
        true, // extractable keys
        ["encrypt", "decrypt"]
    );

    // Export and display public key
    const publicPEM = await exportPublicKey(rsaKeyPair.publicKey);
    document.getElementById("publicKey").textContent = publicPEM;

    // Define 20 pre-written messages from Amirhossein to Sara in Fingilish
    const messages = [
        "Salam Sara, in Amirhossein ast.",
        "Man yek payam makhfi ba RSA ersal mikonam.",
        "Ramznegari etminan midahad ke ertebat ma amn ast.",
        "Aya be ghodrat ramznegari etemad darid?",
        "Omidvaram betavanid in payam ra ramzgoshayi konid.",
        "RSA mokhafaf Rivest–Shamir–Adleman ast.",
        "In shabih-sazi az ramznegari vaghei RSA estefade mikonad!",
        "Kelidhaye ma ba estefade az Web Crypto API tolid mishavand.",
        "Kelidhaye khosoosi bayad makhfi negah dashte shavand.",
        "Hamishe esalat kelidha ra ta'yid konid.",
        "Payamresani amn emrooze zarori ast.",
        "Man az be eshterak gozashtan in demo ba shoma heyajan-zadam",
        "Tasavor konid tamam asrar ma dar hal enteghal amn hastand.",
        "Ramznegari modern ham ziba va ham ghodratmand ast.",
        "Hargez kelid khosoosi khod ra ba kasi be eshterak nagozaarid.",
        "Man montazer goftoguye amn do tarafe hastam.",
        "Ramznegari kelid harim khosoosi ast.",
        "In fanavari zirbanaye ertebatat amn interneti ast.",
        "Etemad be ramznegari separ ma ast.",
        "Khodahafez baraye alan, va imen bemanid!"
    ];

    // Pre-encrypt all messages with the public key
    const encryptedMessages = [];
    for (let i = 0; i < messages.length; i++) {
        const cipher = await encryptMessage(messages[i], rsaKeyPair.publicKey);
        encryptedMessages.push({ plain: messages[i], cipher });
    }

    const chatWindow = document.querySelector(".chat-window");
    const privateKeyInput = document.getElementById("privateKey");
    const privateKeyIcon = document.getElementById("privateKey-icon");
    let messageIndex = 0;

    // Function to display the next message
    async function displayNextMessage() {
        if (messageIndex >= encryptedMessages.length) {
            messageIndex = 0;
            chatWindow.innerHTML = "";
        }
        const msgObj = encryptedMessages[messageIndex];
        const msgDiv = document.createElement("div");
        msgDiv.classList.add("message", "ahm");
        msgDiv.dataset.cipher = msgObj.cipher;

        // Create sender and message content spans
        const senderSpan = document.createElement("span");
        senderSpan.classList.add("sender");
        senderSpan.textContent = "Amirhossein: ";

        const messageSpan = document.createElement("span");
        messageSpan.classList.add("message-content");

        if (privateKeyInput.value.trim() === "parsara") {
            const decrypted = await decryptMessage(msgObj.cipher, rsaKeyPair.privateKey);
            if (decrypted) {
                messageSpan.textContent = decrypted;
                msgDiv.classList.add("decrypted");
                msgDiv.prepend(createIcon("fas fa-unlock"));
            } else {
                messageSpan.textContent = "Decryption error";
            }
        } else {
            messageSpan.textContent = msgObj.cipher;
            msgDiv.prepend(createIcon("fas fa-lock"));
        }

        // Append sender and message content to the message div
        msgDiv.appendChild(senderSpan);
        msgDiv.appendChild(messageSpan);

        chatWindow.appendChild(msgDiv);
        chatWindow.scrollTop = chatWindow.scrollHeight;
        messageIndex++;
    }

    // Display messages every 5 seconds
    setInterval(displayNextMessage, 5000);

    // Handle private key input changes
    privateKeyInput.addEventListener("input", async function () {
        if (this.value.trim() === "parsara") {
            this.classList.add("valid");
            privateKeyIcon.classList.remove("invalid");
            privateKeyIcon.classList.add("valid");
            privateKeyIcon.classList.replace("fa-times", "fa-check");

            const messageDivs = document.querySelectorAll(".message");
            for (let div of messageDivs) {
                const cipher = div.dataset.cipher;
                const decrypted = await decryptMessage(cipher, rsaKeyPair.privateKey);

                // Clear existing content and re-append with sender prefix
                div.innerHTML = "";
                const senderSpan = document.createElement("span");
                senderSpan.classList.add("sender");
                senderSpan.textContent = "Amirhossein: ";
                const messageSpan = document.createElement("span");
                messageSpan.classList.add("message-content");

                if (decrypted) {
                    messageSpan.textContent = decrypted;
                    div.classList.add("decrypted");
                    div.prepend(createIcon("fas fa-unlock"));
                } else {
                    messageSpan.textContent = "Decryption error";
                }
                div.appendChild(senderSpan);
                div.appendChild(messageSpan);
            }
        } else {
            this.classList.remove("valid");
            privateKeyIcon.classList.remove("valid");
            privateKeyIcon.classList.add("invalid");
            privateKeyIcon.classList.replace("fa-check", "fa-times");

            const messageDivs = document.querySelectorAll(".message");
            for (let div of messageDivs) {
                // Clear existing content and re-append with sender prefix
                div.innerHTML = "";
                const senderSpan = document.createElement("span");
                senderSpan.classList.add("sender");
                senderSpan.textContent = "Amirhossein: ";
                const messageSpan = document.createElement("span");
                messageSpan.classList.add("message-content");
                messageSpan.textContent = div.dataset.cipher;
                div.classList.remove("decrypted");
                div.prepend(createIcon("fas fa-lock"));
                div.appendChild(senderSpan);
                div.appendChild(messageSpan);
            }
        }
    });
});