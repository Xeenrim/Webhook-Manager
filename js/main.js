document.addEventListener('DOMContentLoaded', function() {
    const sendForm = document.getElementById('sendForm');
    const deleteForm = document.getElementById('deleteForm');
    const webhookUrlInput = document.getElementById('webhookUrl');
    const usernameInput = document.getElementById('username');
    const contentInput = document.getElementById('content');
    const avatarUrlInput = document.getElementById('avatarUrl');
    const imageUrlInput = document.getElementById('imageUrl');
    const deleteWebhookUrlInput = document.getElementById('deleteWebhookUrl');
    const previewFrame = document.getElementById('previewFrame');
    

    function showNotification(title, message, type = 'info') {
        const container = document.getElementById('notification-container');
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <strong>${title}</strong>
            <p>${message}</p>
        `;
        container.appendChild(notification);
        

        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 300);
        }, 5000);
    }

    function showConfirmation(message) {
        return new Promise((resolve) => {
            const dialog = document.getElementById('confirmDialog');
            const confirmBtn = document.getElementById('confirmBtn');
            const cancelBtn = document.getElementById('cancelBtn');

            dialog.style.display = 'block';

            const onConfirm = () => {
                cleanup();
                dialog.style.display = 'none';
                resolve(true);
            };

            const onCancel = () => {
                cleanup();
                dialog.style.display = 'none';
                resolve(false);
            };

            const onKeyDown = (e) => {
                if (e.key === 'Escape') onCancel();
            };

            const cleanup = () => {
                confirmBtn.removeEventListener('click', onConfirm);
                cancelBtn.removeEventListener('click', onCancel);
                document.removeEventListener('keydown', onKeyDown);
            };

            confirmBtn.addEventListener('click', onConfirm);
            cancelBtn.addEventListener('click', onCancel);
            document.addEventListener('keydown', onKeyDown);
        });
    }

    sendForm?.addEventListener('submit', async function(e) {
        e.preventDefault();

        try {
            const response = await fetch(webhookUrlInput.value, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: contentInput.value,
                    username: usernameInput.value || undefined,
                    avatar_url: avatarUrlInput.value || undefined,
                    embeds: imageUrlInput.value ? [{
                        image: { url: imageUrlInput.value }
                    }] : undefined
                })
            });

            if (response.ok) {
                showNotification('', 'Message sent successfully!', 'success');
                updatePreview();
            } else {
                throw new Error('Failed to send message');
            }
        } catch (error) {
            showNotification('Error', error.message || 'Failed to send message', 'error');
        }
    });

    deleteForm?.addEventListener('submit', async function(e) {
        e.preventDefault();

        const webhookUrl = deleteWebhookUrlInput.value.trim();

        if (!webhookUrl) {
            showNotification('Error', 'Please enter a webhook URL', 'error');
            return;
        }

        const confirmed = await showConfirmation('Are you sure you want to delete this webhook?');

        if (confirmed) {
            try {
                const response = await fetch(webhookUrl, {
                    method: 'DELETE'
                });

                if (response.ok) {
                    showNotification('', 'Webhook deleted successfully!', 'success');
                    deleteWebhookUrlInput.value = '';
                } else {
                    throw new Error('Failed to delete webhook');
                }
            } catch (error) {
                console.error('Error:', error);
                showNotification('Error', error.message || 'Failed to delete webhook', 'error');
            }
        }
    });

    initPreviewFrame();

    const previewInputs = [contentInput, usernameInput, avatarUrlInput, imageUrlInput];
    previewInputs.forEach(input => {
        if (input) {
            input.addEventListener('input', updatePreview);
        }
    });

    setTimeout(updatePreview, 500);
});

function initPreviewFrame() {
    const previewFrame = document.getElementById('previewFrame');
    if (!previewFrame) return;

    const previewDoc = `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
                background: #36393f;
                color: #dcddde;
                margin: 0;
                padding: 16px;
            }
            #message-container {
                min-height: 200px;
            }
            .message {
                display: flex;
                padding: 8px 20px;
            }
            .avatar {
                width: 40px;
                height: 40px;
                border-radius: 50%;
                margin-right: 16px;
                background: #202225;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #dcddde;
                font-weight: 600;
                font-size: 18px;
            }
            .content {
                flex: 1;
            }
            .header {
                display: flex;
                align-items: center;
                margin-bottom: 4px;
            }
            .username {
                color: #fff;
                font-weight: 600;
                margin-right: 8px;
            }
            .timestamp {
                color: #a3a6aa;
                font-size: 0.75em;
            }
            .text {
                color: #dcddde;
            }
            .embed {
                margin-top: 8px;
            }
            .embed-image {
                max-width: 100%;
                border-radius: 4px;
                max-height: 300px;
            }
            .empty-state {
                color: #72767d;
                text-align: center;
                padding: 40px 20px;
                font-style: italic;
            }
        </style>
    </head>
    <body>
        <div id="message-container">
            <div class="empty-state">Your message will appear here</div>
        </div>
        <script>
            function escapeHtml(unsafe) {
                if (!unsafe) return '';
                return String(unsafe)
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/"/g, '&quot;')
                    .replace(/'/g, '&#039;');
            }

            window.addEventListener('message', function(event) {
                try {
                    const data = event.data;
                    const container = document.getElementById('message-container');

                    if (!data.content && (!data.embeds || !data.embeds.length)) {
                        container.innerHTML = '<div class="empty-state">Your message will appear here</div>';
                        return;
                    }

                    const now = new Date();
                    const timeStr = now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                    const avatarChar = (data.username || '?')[0].toUpperCase();

                    let html = [
                        '<div class="message">',
                        '<div class="avatar">',
                        (data.avatar_url ? 
                            '<img src="' + escapeHtml(data.avatar_url) + '" alt="Avatar" style="width:100%;height:100%;border-radius:50%;">' : 
                            escapeHtml(avatarChar)),
                        '</div>',
                        '<div class="content">',
                        '<div class="header">',
                        '<span class="username">' + escapeHtml(data.username || 'Webhook') + '</span>',
                        '<span class="timestamp">Today at ' + timeStr + '</span>',
                        '</div>',
                        '<div class="text">' + escapeHtml(data.content || '') + '</div>'
                    ].join('');

                    if (data.embeds && data.embeds.length) {
                        data.embeds.forEach(embed => {
                            if (embed.image) {
                                html += [
                                    '<div class="embed">',
                                    '<img src="' + escapeHtml(embed.image.url) + '" class="embed-image" alt="Embedded content">',
                                    '</div>'
                                ].join('');
                            }
                        });
                    }

                    html += [
                        '</div>', // Close .content
                        '</div>'  // Close .message
                    ].join('');

                    container.innerHTML = html;
                    container.scrollTop = container.scrollHeight;
                } catch (error) {
                    console.error('Error in preview:', error);
                }
            });
        </script>
    </body>
    </html>`;

    try {
        previewFrame.srcdoc = previewDoc;

        const messageHandler = function(e) {
            if (e.source === previewFrame.contentWindow) {
            }
        };
        window.addEventListener('message', messageHandler);
    } catch (error) {
        console.error('Error:', error);
    }

    return previewFrame;
}

async function fetchWebhookDetails(webhookUrl) {
    try {
        const response = await fetch(webhookUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();
            return {
                name: data.name || 'Webhook',
                avatar: data.avatar ? `https://cdn.discordapp.com/avatars/${data.id}/${data.avatar}.png` : ''
            };
        }
    } catch (error) {
        console.error('Error');
    }
    return { name: 'Webhook', avatar: '' };
}

async function updatePreview() {
    const previewFrame = document.getElementById('previewFrame');
    const webhookUrlInput = document.getElementById('webhookUrl');
    const contentInput = document.getElementById('content');
    const usernameInput = document.getElementById('username');
    const avatarUrlInput = document.getElementById('avatarUrl');
    const imageUrlInput = document.getElementById('imageUrl');

    if (!previewFrame || !previewFrame.contentWindow) {
        console.log('Preview frame not ready');
        return;
    }

    try {
        let username = 'Webhook';
        let avatarUrl = '';

        if (!window.webhookDetailsFetched && webhookUrlInput?.value) {
            const webhookDetails = await fetchWebhookDetails(webhookUrlInput.value);
            username = webhookDetails.name;
            avatarUrl = webhookDetails.avatar;

            if (usernameInput && !usernameInput.value) {
                usernameInput.value = username;
                usernameInput.dataset.initialValue = username;
            }
            if (avatarUrlInput && !avatarUrlInput.value) {
                avatarUrlInput.value = avatarUrl;
                avatarUrlInput.dataset.initialValue = avatarUrl;
            }
            
            window.webhookDetailsFetched = true;
        }

        const preview = {
            content: contentInput?.value || '',
            username: usernameInput?.value || username,
            avatar_url: avatarUrlInput?.value || avatarUrl,
            embeds: []
        };
        
        if (imageUrlInput?.value) {
            preview.embeds.push({
                image: { url: imageUrlInput.value }
            });
        }
        
        previewFrame.contentWindow.postMessage(preview, '*');
        console.log('Preview updated:', preview);
    } catch (error) {
        console.error('Error updating preview:', error);
    }
}
