document.addEventListener('DOMContentLoaded', function() {
    const forms = document.querySelectorAll('form');
    const inputs = document.querySelectorAll('input, textarea');
    const sendForm = document.getElementById('sendForm');
    const webhookUrlInput = document.getElementById('webhookUrl');
    const usernameInput = document.getElementById('username');
    const contentInput = document.getElementById('content');
    const avatarUrlInput = document.getElementById('avatarUrl');
    const imageUrlInput = document.getElementById('imageUrl');
    const clearImageBtn = document.getElementById('clearImage');
    const deleteForm = document.getElementById('deleteForm');
    const deleteWebhookUrlInput = document.getElementById('deleteWebhookUrl');
    const webhookInfo = document.getElementById('webhookInfo');
    const previewFrame = document.getElementById('previewFrame');
    

    const confirmModal = document.getElementById('confirmModal');
    const confirmDeleteBtn = document.getElementById('confirmDelete');
    const confirmCancelBtn = document.getElementById('confirmCancel');
    const closeModalBtn = document.querySelector('.close-btn');
    

    let currentWebhookUrl = '';
    

    console.log('Forms found:', forms.length);
    console.log('Inputs found:', inputs.length);
    

    inputs.forEach(input => {

        const newInput = input.cloneNode(true);
        const parent = input.parentNode;
        parent.replaceChild(newInput, input);
        

        newInput.readOnly = false;
        newInput.disabled = false;
        

        newInput.style.opacity = '1';
        newInput.style.pointerEvents = 'auto';
        

        newInput.addEventListener('input', function(e) {
            console.log('Input changed:', this.id, '=', this.value);

            if (['username', 'content', 'avatarUrl', 'imageUrl'].includes(this.id)) {
                updateLivePreview();
            }
        });
        

        if (newInput.id === 'imageUrl' && clearImageBtn) {
            clearImageBtn.style.display = newInput.value ? 'inline-block' : 'none';
        }
    });
    

    if (sendForm) {
        sendForm.addEventListener('submit', handleSendMessage);
    }
    
    if (deleteForm) {
        deleteForm.addEventListener('submit', handleDeleteWebhook);
    }
    

    if (deleteWebhookUrlInput) {
        deleteWebhookUrlInput.addEventListener('input', fetchWebhookInfo);
    }
    

    if (clearImageBtn && imageUrlInput) {
        clearImageBtn.style.display = 'inline-block';
        clearImageBtn.addEventListener('click', function(e) {
            e.preventDefault();
            imageUrlInput.value = '';
            this.style.display = 'none';
        });
        

        imageUrlInput.addEventListener('input', function() {
            clearImageBtn.style.display = this.value ? 'inline-block' : 'none';
        });
    }


    function showNotification(message, type = 'success', duration = 3000) {
        console.log(`[${type.toUpperCase()}] ${message}`);
        const notification = document.getElementById('notification');
        if (notification) {
            notification.textContent = message;
            notification.className = `notification ${type} show`;
            setTimeout(() => {
                notification.classList.remove('show');
            }, duration);
        }
    }


    function updateLivePreview() {
        try {
            if (!previewFrame || !previewFrame.contentWindow) return;
            

            const username = usernameInput ? usernameInput.value.trim() : '';
            const content = contentInput ? contentInput.value.trim() : '';
            const avatar = avatarUrlInput ? avatarUrlInput.value.trim() : '';
            const image = imageUrlInput ? imageUrlInput.value.trim() : '';
            

            const previewData = {
                username: username || 'Webhook',
                content: content || 'Your message will appear here',
                avatar_url: avatar,
                image_url: image
            };
            

            previewFrame.contentWindow.postMessage({
                type: 'updatePreview',
                ...previewData
            }, '*');
        } catch (error) {
            console.error('Error updating preview:', error);
        }
    }


    async function handleSendMessage(e) {
        e.preventDefault();
        
        const webhookUrl = webhookUrlInput.value.trim();
        const username = usernameInput.value.trim();
        const avatarUrl = avatarUrlInput.value.trim();
        const content = contentInput.value.trim();
        const imageUrl = imageUrlInput.value.trim();
        
        if (!webhookUrl || !content) {
            showNotification('Please fill in all required fields', 'error');
            return;
        }
        
        try {
            const payload = { content };
            
            if (username) payload.username = username;
            if (avatarUrl) payload.avatar_url = avatarUrl;
            

            if (imageUrl) {
                payload.embeds = [{
                    image: { url: imageUrl },
                    color: 0x6c5ce7
                }];
            }
            
            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });
            
            if (response.ok) {
                showNotification('Message sent successfully!',);
                contentInput.value = '';
                if (imageUrlInput) {
                    imageUrlInput.value = '';
                    clearImageBtn.style.display = 'none';
                }
                updateLivePreview();
            } else {
                const error = await response.text();
                throw new Error(error || 'Failed to send message');
            }
        } catch (error) {
            console.error('Error sending message:', error);
            showNotification(`Error: ${error.message || 'Failed to send message'}`, 'error');
        }
    }


    async function showConfirmation(webhookUrl) {
        currentWebhookUrl = webhookUrl;
        
        try {
            const confirmed = await window.showConfirmation({
                title: 'Delete Webhook',
                message: 'Are you sure you want to delete this webhook? This action cannot be undone.',
                confirmText: 'Delete',
                danger: true,
                icon: '⚠️'
            });
            
            if (confirmed) {
                await deleteWebhook();
            }
        } catch (error) {
            console.error('Error in confirmation dialog:', error);
            showNotification('An error occurred with the confirmation dialog', 'error');
        }
    }
    

    async function deleteWebhook() {
        if (!currentWebhookUrl) return;
        
        try {
            const response = await fetch(currentWebhookUrl, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                showNotification('Webhook deleted successfully!', 'success');
                deleteWebhookUrlInput.value = '';
                webhookInfo.innerHTML = '<p>Enter a webhook URL to view details</p>';
            } else {
                const error = await response.text();
                throw new Error(error || 'Failed to delete webhook');
            }
        } catch (error) {
            console.error('Error deleting webhook:', error);
            showNotification(`Error: ${error.message || 'Failed to delete webhook'}`, 'error');
        } finally {
            currentWebhookUrl = '';
        }
    }
    

    function handleDeleteWebhook(e) {
        e.preventDefault();
        
        const webhookUrl = deleteWebhookUrlInput.value.trim();
        
        if (!webhookUrl) {
            showNotification('Please enter a webhook URL', 'error');
            return;
        }
        
        showConfirmation(webhookUrl);
    }


    async function fetchWebhookInfo() {
        const webhookUrl = deleteWebhookUrlInput.value.trim();
        
        if (!webhookUrl) {
            webhookInfo.innerHTML = '<p>Enter a webhook URL to view details</p>';
            return;
        }
        
        try {
            const response = await fetch(webhookUrl);
            
            if (response.ok) {
                const data = await response.json();
                displayWebhookInfo(data);
            } else if (response.status === 404) {
                webhookInfo.innerHTML = `
                    <p style="color: var(--danger);">
                        <i class="fas fa-exclamation-circle"></i> Webhook not found or invalid URL
                    </p>`;
            } else {
                throw new Error('Failed to fetch webhook info');
            }
        } catch (error) {
            console.error('Error fetching webhook info:', error);
            webhookInfo.innerHTML = `
                <p style="color: var(--danger);">
                    <i class="fas fa-exclamation-circle"></i> Error loading webhook information
                </p>`;
        }
    }


    function displayWebhookInfo(webhook) {
        const date = new Date(webhook.id ? (webhook.id / 4194304) + 1420070400000 : Date.now());
        const formattedDate = date.toLocaleString();
        
        webhookInfo.innerHTML = `
            <div class="info-item">
                <strong>Name:</strong> ${webhook.name || 'N/A'}
            </div>
            <div class="info-item">
                <strong>Channel ID:</strong> ${webhook.channel_id || 'N/A'}
            </div>
            <div class="info-item">
                <strong>Guild ID:</strong> ${webhook.guild_id || 'N/A'}
            </div>
            <div class="info-item">
                <strong>Created:</strong> ${formattedDate}
            </div>
            ${webhook.avatar ? `
                <div class="avatar-preview" style="margin-top: 10px;">
                    <img src="https://cdn.discordapp.com/avatars/${webhook.id}/${webhook.avatar}.png" 
                         alt="Webhook Avatar" 
                         style="width: 50px; height: 50px; border-radius: 50%;">
                </div>
            ` : ''}
        `;
    }


    const buttons = document.querySelectorAll('.btn:not(.close-btn)');
    buttons.forEach(button => {
        button.addEventListener('mouseenter', () => {
            button.classList.add('pulse');
        });
        
        button.addEventListener('animationend', () => {
            button.classList.remove('pulse');
        });
    });
    

    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', handleDeleteConfirmation);
    }
    
    if (confirmCancelBtn) {
        confirmCancelBtn.addEventListener('click', hideConfirmation);
    }
    
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', hideConfirmation);
    }
    

    window.addEventListener('click', (e) => {
        if (e.target === confirmModal) {
            hideConfirmation();
        }
    });
    

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && confirmModal.classList.contains('show')) {
            hideConfirmation();
        }
    });
});
