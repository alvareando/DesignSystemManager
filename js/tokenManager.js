// Helper function for showing messages
function showMessage(container, message, type) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `${type}-message`;
    messageDiv.textContent = message;

    // Remove existing message of the same type if any
    const existingMessage = container.querySelector(`.${type}-message`);
    if (existingMessage) {
        existingMessage.remove();
    }

    container.insertBefore(messageDiv, container.firstChild);
    setTimeout(() => messageDiv.remove(), 3000);
}

class TokenManager {
    constructor() {
        this.clients = {};
        this.activeClient = null;
        this.selectedFolderId = 'root'; // Default selected folder is root
        this.selectedFolderLevel = 'primitives'; // Default level is primitives
        console.log('TokenManager initialized');
        this.loadTokens();
    }
    
    showNotification(message, type = 'success') {
        const notification = document.getElementById('notification');
        if (!notification) return;
        
        const notificationMessage = notification.querySelector('.notification-message');
        const notificationIcon = notification.querySelector('.notification-icon');
        
        // Set notification content
        notificationMessage.textContent = message;
        notification.className = `notification ${type}`;
        
        // Set icon based on type
        if (type === 'success') {
            notificationIcon.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
        } else {
            notificationIcon.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>';
        }
        
        // Show notification
        notification.classList.add('show');
        
        // Auto-dismiss after 3 seconds
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }

    async loadTokens() {
        try {
            const result = await chrome.storage.local.get('designSystemTokens');
            if (result.designSystemTokens) {
                this.clients = result.designSystemTokens;
                console.log('Successfully loaded tokens from storage:', this.clients);
            } else {
                console.log('No existing tokens found in storage');
                this.clients = {};
            }
        } catch (error) {
            console.error('Error loading tokens:', error);
            this.clients = {};
        }
        this.renderClients();
        
        // After loading tokens, update the empty state if needed
        this.updateEmptyState();
    }
    
    renderClients() {
        console.log('Rendering clients');
        const clientSelect = document.getElementById('clientSelect');
        if (!clientSelect) {
            console.error('Client select element not found');
            return;
        }
        
        // Clear current options except the placeholder
        while (clientSelect.options.length > 1) {
            clientSelect.remove(1);
        }
        
        // Get client names and sort them alphabetically
        const clientNames = Object.keys(this.clients).sort();
        
        if (clientNames.length === 0) {
            console.log('No clients to render');
            return;
        }
        
        // Add client options to the dropdown
        clientNames.forEach(clientName => {
            const option = document.createElement('option');
            option.value = clientName;
            option.textContent = clientName;
            clientSelect.appendChild(option);
        });
        
        // Set active client if available
        if (this.activeClient && clientNames.includes(this.activeClient)) {
            clientSelect.value = this.activeClient;
            this.renderTokens();
        } else if (clientNames.length > 0) {
            // Set first client as active if no active client
            this.activeClient = clientNames[0];
            clientSelect.value = this.activeClient;
            this.renderTokens();
        }
        
        // Update the client management buttons visibility
        this.updateClientManagementButtons();
    }
    
    updateClientManagementButtons() {
        const clientManagement = document.getElementById('clientManagement');
        if (!clientManagement) return;
        
        // Update visibility based on whether a client is selected
        if (this.activeClient) {
            clientManagement.style.display = 'flex';
        } else {
            clientManagement.style.display = 'none';
        }
        
        // Check if there are any clients and show/hide empty state
        this.updateEmptyState();
    }
    
    updateEmptyState() {
        // Check if we already have an empty state element
        let emptyState = document.getElementById('emptyState');
        
        // Get the number of clients
        const clientCount = Object.keys(this.clients).length;
        
        if (clientCount === 0) {
            // Show empty state if no clients exist
            if (!emptyState) {
                // Create the empty state element if it doesn't exist
                emptyState = document.createElement('div');
                emptyState.id = 'emptyState';
                emptyState.className = 'empty-state';
                
                // Create empty state content
                emptyState.innerHTML = `
                    <div class="empty-state-icon">
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M20 7h-9"></path>
                            <path d="M14 17H5"></path>
                            <circle cx="17" cy="17" r="3"></circle>
                            <circle cx="7" cy="7" r="3"></circle>
                        </svg>
                    </div>
                    <h2 class="empty-state-title">No design system found</h2>
                    <p class="empty-state-description">
                        You need to create a client before you can add design tokens, folders, or variables.
                    </p>
                    <button id="emptyStateAddClient" class="empty-state-action">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="8" x2="12" y2="16"></line>
                            <line x1="8" y1="12" x2="16" y2="12"></line>
                        </svg>
                        Add Client
                    </button>
                `;
                
                // Add to main content area
                const mainContent = document.querySelector('.main-content');
                if (mainContent) {
                    mainContent.appendChild(emptyState);
                    
                    // Add event listener to the Add Client button
                    const addClientBtn = document.getElementById('emptyStateAddClient');
                    if (addClientBtn) {
                        addClientBtn.addEventListener('click', () => {
                            const clientName = prompt('Enter client name:');
                            if (clientName && clientName.trim() !== '') {
                                this.createClient(clientName.trim());
                                // Show notification
                                this.showNotification(`Client "${clientName}" created successfully!`);
                            }
                        });
                    }
                }
            } else {
                // Make sure it's visible
                emptyState.style.display = 'flex';
            }
        } else if (emptyState) {
            // Hide empty state if clients exist
            emptyState.style.display = 'none';
        }
    }
    
    editClientName(oldName, newName) {
        console.log(`Editing client name from "${oldName}" to "${newName}"`);
        
        if (!oldName || !this.clients[oldName]) {
            this.showNotification('Client not found', 'error');
            return false;
        }
        
        if (!newName || newName.trim() === '') {
            this.showNotification('Client name cannot be empty', 'error');
            return false;
        }
        
        if (this.clients[newName] && oldName !== newName) {
            this.showNotification('A client with this name already exists', 'error');
            return false;
        }
        
        // Create copy with new name
        this.clients[newName] = this.clients[oldName];
        
        // Delete old entry if names are different
        if (oldName !== newName) {
            delete this.clients[oldName];
        }
        
        // Update active client reference
        this.activeClient = newName;
        
        // Save and update UI
        this.saveTokens();
        this.renderClients();
        this.showNotification(`Client renamed to "${newName}"`, 'success');
        return true;
    }
    
    deleteClient(clientName) {
        console.log(`Deleting client: "${clientName}"`);
        
        if (!clientName || !this.clients[clientName]) {
            this.showNotification('Client not found', 'error');
            return false;
        }
        
        // Delete the client
        delete this.clients[clientName];
        
        // Update active client
        if (this.activeClient === clientName) {
            const clientNames = Object.keys(this.clients);
            this.activeClient = clientNames.length > 0 ? clientNames[0] : null;
        }
        
        // Save and update UI
        this.saveTokens();
        this.renderClients();
        
        // Make sure to check empty state after deleting
        this.updateEmptyState();
        
        this.showNotification(`Client "${clientName}" deleted`, 'success');
        return true;
    }
    
    createClient(name) {
        console.log('Creating new client:', name);
        if (this.clients[name]) {
            console.error('Client already exists:', name);
            this.showNotification(`Client "${name}" already exists`, 'error');
            return;
        }
        
        this.clients[name] = this.initializeClientStructure();
        this.activeClient = name;
        this.saveTokens();
        this.renderClients();
        
        // Update the empty state since we now have a client
        this.updateEmptyState();
    }

    initializeClientStructure() {
        return {
            primitives: {
                root: { id: 'root', name: 'root', children: [], tokens: [] }
            },
            aliases: {
                root: { id: 'root', name: 'root', children: [], tokens: [] }
            },
            tokens: {
                root: { id: 'root', name: 'root', children: [], tokens: [] }
            }
        };
    }

    findFolder(root, folderId) {
        console.log('Finding folder:', { folderId, rootName: root.name });
        if (root.id === folderId) {
            console.log('Found folder:', root);
            return root;
        }
        for (const child of root.children) {
            const found = this.findFolder(child, folderId);
            if (found) return found;
        }
        return null;
    }

    createFolder(level, parentId, folderName) {
        console.log('Creating folder:', { level, parentId, folderName });
        if (!this.activeClient) {
            this.showError('general', 'general', 'Please select a client first');
            return null;
        }

        const folder = {
            id: `folder-${Date.now()}`,
            name: folderName,
            children: [],
            tokens: [],
            collapsed: false
        };

        const parent = parentId === 'root' ?
            this.clients[this.activeClient][level].root :
            this.findFolder(this.clients[this.activeClient][level].root, parentId);

        if (!parent) {
            console.error('Parent folder not found:', parentId);
            return null;
        }

        console.log('Adding folder to parent:', { parentId, parentName: parent.name, newFolder: folder });
        parent.children.push(folder);
        this.saveTokens();
        this.renderTokens();
        return folder.id;
    }

    renameFolder(level, folderId, newName) {
        console.log('Renaming folder:', { level, folderId, newName });
        if (!this.activeClient) {
            console.error('No active client while trying to rename folder');
            this.showError('general', 'general', 'Please select a client first');
            return false;
        }

        if (!newName || newName.trim() === '') {
            console.error('Empty folder name provided');
            this.showError('general', 'general', 'Folder name cannot be empty');
            return false;
        }

        if (!TokenValidator.validateTokenName(newName)) {
            console.error('Invalid folder name:', newName);
            this.showError('general', 'general', 'Invalid folder name. It must:\n- Start with a letter\n- Only contain letters, numbers, and hyphens\nExample: "brand-colors-1"');
            return false;
        }

        const folder = this.findFolder(this.clients[this.activeClient][level].root, folderId);
        if (!folder) {
            console.error('Folder not found:', folderId);
            return false;
        }

        console.log('Found folder to rename:', { oldName: folder.name, newName });
        folder.name = newName;
        this.saveTokens();
        this.renderTokens();
        this.showSuccess('general', 'general', `Folder renamed to "${newName}"`);
        return true;
    }

    deleteFolder(level, folderId) {
        console.log('Deleting folder:', { level, folderId });
        if (!this.activeClient) return false;

        const deleteFromChildren = (parent, targetId) => {
            const index = parent.children.findIndex(child => child.id === targetId);
            if (index !== -1) {
                console.log('Found folder to delete in parent:', { parentName: parent.name, targetId });
                parent.children.splice(index, 1);
                return true;
            }
            for (const child of parent.children) {
                if (deleteFromChildren(child, targetId)) {
                    return true;
                }
            }
            return false;
        };

        if (deleteFromChildren(this.clients[this.activeClient][level].root, folderId)) {
            console.log('Successfully deleted folder:', folderId);
            this.saveTokens();
            this.renderTokens();
            return true;
        }
        console.error('Failed to find and delete folder:', folderId);
        return false;
    }

    toggleFolderCollapse(level, folderId) {
        console.log('Toggling folder collapse:', { level, folderId });
        if (!this.activeClient) return false;

        const folder = this.findFolder(this.clients[this.activeClient][level].root, folderId);
        if (!folder) {
            console.error('Folder not found:', folderId);
            return false;
        }

        folder.collapsed = !folder.collapsed;
        console.log('Folder collapse state updated:', { folderId, collapsed: folder.collapsed });
        this.saveTokens();
        return true;
    }

    addToken(level, category, token, folderId = 'root') {
        console.log(`Adding ${level} token to ${category}:`, token, 'in folder:', folderId);

        if (!this.activeClient) {
            this.showError('general', 'general', 'Please select a client first');
            return;
        }

        if (!TokenValidator.validateTokenName(token.name)) {
            this.showError('general', 'general', 'Invalid token name. It must:\n- Start with a letter\n- Only contain letters, numbers, and hyphens');
            return;
        }

        const newToken = {
            id: Date.now().toString(),
            name: token.name,
            value: token.value,
            category: category, // Store the token category (colors, typography, etc.)
            description: token.description || ''
        };

        // Find the target folder
        const folder = folderId === 'root' ?
            this.clients[this.activeClient][level].root :
            this.findFolder(this.clients[this.activeClient][level].root, folderId);

        if (!folder) {
            console.error('Target folder not found:', folderId);
            this.showError('general', 'general', 'Selected folder not found');
            return;
        }

        console.log('Adding token to folder:', folder.name);

        // Validate token
        let isValid = false;
        if (level === 'primitives') {
            isValid = this.validateToken(category, newToken);
            if (!isValid) {
                this.showError('general', 'general', `Invalid ${category} value format`);
                return;
            }
        } else if (level === 'aliases') {
            if (token.value.startsWith('{')) {
                isValid = this.validatePrimitiveReference(category, token.value);
                if (!isValid) {
                    const primitivesList = this.getPrimitivesList(category);
                    this.showError('general', 'general', `Alias must reference an existing primitive using {primitive-name}. Available primitives: ${primitivesList}`);
                    return;
                }
            } else {
                isValid = this.validateToken(category, token);
                if (!isValid) {
                    this.showError('general', 'general', `Invalid ${category} value format`);
                    return;
                }
            }
        } else if (level === 'tokens') {
            if (!token.value.startsWith('{') || !this.validateAliasReference(category, token.value)) {
                const aliasesList = this.getAliasesList(category);
                this.showError('general', 'general', `Token must reference an existing alias using {alias-name}. Available aliases: ${aliasesList}`);
                return;
            }
            isValid = true;
        }

        if (!isValid) {
            console.error('Token validation failed');
            return;
        }

        folder.tokens.push(newToken);
        this.showSuccess('general', 'general', `Token "${newToken.name}" added successfully to folder "${folder.name}"`);
        this.saveTokens();
        this.renderTokens();
    }

    async saveTokens() {
        try {
            await chrome.storage.local.set({ designSystemTokens: this.clients });
            console.log('Successfully saved tokens to storage:', this.clients);
            this.showSuccess('general', 'general', 'All changes saved successfully');
            this.renderTokens(); // Re-render after saving
        } catch (error) {
            console.error('Error saving tokens:', error);
            this.showError('general', 'general', 'Failed to save tokens. Please try again.');
        }
    }

    showSuccess(level, category, message) {
        console.log(`Success in ${level}-${category}:`, message);
        this.showNotification(message, 'success');
    }

    showError(level, category, message) {
        console.error(`Error in ${level}-${category}:`, message);
        this.showNotification(message, 'error');
    }


    validateToken(category, token) {
        console.log(`Validating ${category} token:`, token);
        let isValid = false;

        switch (category) {
            case 'colors':
                isValid = TokenValidator.validateColor(token.value);
                break;
            case 'typography':
                isValid = TokenValidator.validateTypography(token.value);
                break;
            case 'spacing':
                isValid = TokenValidator.validateSpacing(token.value);
                break;
            case 'sizing':
                isValid = TokenValidator.validateSizing(token.value);
                break;
            default:
                isValid = false;
        }

        console.log(`Token validation result for ${category}:`, isValid);
        return isValid;
    }

    renderTokens() {
        if (!this.activeClient) {
            console.log('No active client, skipping token render');
            return;
        }

        console.log('Rendering tokens for client:', this.activeClient);
        const client = this.clients[this.activeClient];
        if (!client) {
            console.error('Client not found:', this.activeClient);
            return;
        }

        // Render token lists
        ['primitives', 'aliases', 'tokens'].forEach(level => {
            const tokenContainer = document.getElementById(`${level}-tokens`);
            if (!tokenContainer) {
                console.error(`Token container not found: ${level}-tokens`);
                return;
            }
            
            tokenContainer.innerHTML = '';
            
            // Update folder parent references before rendering
            this.updateFolderPaths(client[level].root);
            
            // Render all tokens for this level
            this.renderFolder(tokenContainer, client[level].root, level);
        });
        
        // Also render folder trees
        this.renderFolderTrees();
    }
    
    renderFolderTrees() {
        if (!this.activeClient) {
            console.log('No active client, skipping folder tree render');
            return;
        }
        
        const client = this.clients[this.activeClient];
        if (!client) {
            console.error('Client not found:', this.activeClient);
            return;
        }
        
        ['primitives', 'aliases', 'tokens'].forEach(level => {
            const treeContainer = document.getElementById(`folder-tree-${level}`);
            if (!treeContainer) {
                console.error(`Folder tree container not found: folder-tree-${level}`);
                return;
            }
            
            treeContainer.innerHTML = '';
            
            // Add "All" option at the top
            const allItem = document.createElement('div');
            allItem.className = 'folder-tree-item all-items active';
            allItem.dataset.filter = 'all';
            allItem.innerHTML = '<span class="folder-icon">' + 
                '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
                '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>' +
                '</svg></span>All Tokens';
            
            allItem.addEventListener('click', () => {
                // Deactivate all other items
                treeContainer.querySelectorAll('.folder-tree-item').forEach(item => {
                    item.classList.remove('active');
                });
                
                // Activate this item
                allItem.classList.add('active');
                
                // Set root as the selected folder
                this.selectedFolderId = 'root';
                this.selectedFolderLevel = level;
                
                // Show all token items
                const tokenList = document.getElementById(`${level}-tokens`);
                if (tokenList) {
                    tokenList.querySelectorAll('.token-item, .folder').forEach(item => {
                        item.style.display = '';
                    });
                }
            });
            
            treeContainer.appendChild(allItem);
            
            // Add folder tree items
            const root = client[level].root;
            if (root && root.children && root.children.length > 0) {
                root.children.forEach(childFolder => {
                    this.renderFolderTreeItem(treeContainer, childFolder, level);
                });
            }
        });
    }
    
    renderFolderTreeItem(container, folder, level) {
        const folderItem = document.createElement('div');
        folderItem.className = 'folder-tree-item';
        folderItem.dataset.folderId = folder.id;
        folderItem.dataset.level = level;
        
        // Toggle button if folder has children
        let toggleButton = '';
        if (folder.children && folder.children.length > 0) {
            toggleButton = `<span class="folder-toggle">${folder.collapsed ? 
                '<svg width="8" height="8" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 1L5 5L9 1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" transform="rotate(-90 5 3)"></path></svg>' : 
                '<svg width="8" height="8" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 1L5 5L9 1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path></svg>'}</span>`;
        }
        
        folderItem.innerHTML = toggleButton + 
            '<span class="folder-icon">' +
            '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
            '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>' +
            '</svg></span>' + folder.name;
        
        // Click event to filter tokens by folder
        folderItem.addEventListener('click', (e) => {
            e.stopPropagation();
            
            // Toggle folder collapse if clicking on toggle button
            if (e.target.closest('.folder-toggle')) {
                this.toggleFolderCollapse(level, folder.id);
                this.renderFolderTrees();
                return;
            }
            
            // Store the currently selected folder ID and level for "Add" operations
            this.selectedFolderId = folder.id;
            this.selectedFolderLevel = level;
            
            // Deactivate all other items
            const treeContainer = folderItem.closest('.folder-tree');
            if (treeContainer) {
                treeContainer.querySelectorAll('.folder-tree-item').forEach(item => {
                    item.classList.remove('active');
                });
            }
            
            // Activate this item
            folderItem.classList.add('active');
            
            // Filter token items by folder
            const tokenList = document.getElementById(`${level}-tokens`);
            if (tokenList) {
                // First hide all tokens and folders
                tokenList.querySelectorAll('.token-item, .folder').forEach(item => {
                    item.style.display = 'none';
                });
                
                // Then show only the selected folder and its contents
                const selectedFolder = tokenList.querySelector(`.folder[data-folder-id="${folder.id}"]`);
                if (selectedFolder) {
                    selectedFolder.style.display = '';
                    
                    // Show all parent folders
                    let parent = selectedFolder.parentElement;
                    while (parent && !parent.classList.contains('token-list')) {
                        if (parent.classList.contains('folder')) {
                            parent.style.display = '';
                        }
                        parent = parent.parentElement;
                    }
                }
            }
        });
        
        // Add drop handling for folders in the left sidebar
        folderItem.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            // Add visual feedback for valid drop target
            if (!folderItem.classList.contains('drag-over')) {
                folderItem.classList.add('drag-over');
            }
            
            e.dataTransfer.dropEffect = 'move';
            return false;
        });
        
        folderItem.addEventListener('dragleave', (e) => {
            // Remove visual feedback when drag leaves
            folderItem.classList.remove('drag-over');
        });
        
        folderItem.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            folderItem.classList.remove('drag-over');
            
            try {
                let data;
                try {
                    // Parse the drag data
                    const jsonData = e.dataTransfer.getData('text/plain');
                    data = JSON.parse(jsonData);
                    console.log('Successfully parsed drop data:', data);
                } catch (parseError) {
                    console.error('Failed to parse drop data:', parseError);
                    return false;
                }
                
                console.log('Drop event on sidebar folder:', { targetFolder: folder.name, data });
                
                // Only allow drops within the same level
                if (data.level !== level) {
                    console.log('Cannot move between different levels');
                    this.showNotification('Items cannot be moved between different hierarchy levels', 'error');
                    return false;
                }
                
                if (data.type === 'token') {
                    // Move the token to this folder
                    this.moveToken(data.id, data.level, folder.id);
                } else if (data.type === 'folder') {
                    // Check if trying to move a folder to itself or its descendant
                    if (data.id === folder.id) {
                        console.log('Cannot move a folder to itself');
                        this.showNotification('Cannot move a folder to itself', 'error');
                        return false;
                    }
                    
                    // Check if trying to move a folder to its descendant
                    const isDescendant = (parent, childId) => {
                        if (parent.id === childId) return true;
                        for (const child of parent.children || []) {
                            if (isDescendant(child, childId)) return true;
                        }
                        return false;
                    };
                    
                    const folderToMove = this.findFolder(this.clients[this.activeClient][level].root, data.id);
                    if (folderToMove && isDescendant(folderToMove, folder.id)) {
                        console.log('Cannot move a folder to its descendant');
                        this.showNotification('Cannot move a folder to its descendant', 'error');
                        return false;
                    }
                    
                    this.moveFolder(data.id, data.level, folder.id);
                }
                
                return false;
            } catch (error) {
                console.error('Error processing drop:', error);
                return false;
            }
        });
        
        container.appendChild(folderItem);
        
        // Render children if the folder is not collapsed
        if (folder.children && folder.children.length > 0 && !folder.collapsed) {
            const childrenContainer = document.createElement('div');
            childrenContainer.className = 'folder-tree-children';
            
            folder.children.forEach(childFolder => {
                this.renderFolderTreeItem(childrenContainer, childFolder, level);
            });
            
            container.appendChild(childrenContainer);
        }
    }

    renderFolder(container, folder, level) {
        const folderDiv = document.createElement('div');
        folderDiv.className = 'folder';
        folderDiv.dataset.folderId = folder.id || 'root';
        folderDiv.dataset.level = level;
        
        if (folder.collapsed) {
            folderDiv.classList.add('folder-collapsed');
        }

        // Create folder header (only for non-root folders)
        if (folder.name !== 'root') {
            const header = document.createElement('div');
            header.className = 'folder-header';
            header.draggable = true; // Make folder header draggable

            // SVG for folder toggle (chevron)
            const toggle = document.createElement('button');
            toggle.className = 'folder-toggle';
            toggle.innerHTML = folder.collapsed 
                ? '<svg width="8" height="8" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 1L5 5L9 1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" transform="rotate(-90 5 3)"></path></svg>'
                : '<svg width="8" height="8" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 1L5 5L9 1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path></svg>';
            
            toggle.onclick = (e) => {
                e.stopPropagation();
                if (this.toggleFolderCollapse(level, folder.id)) {
                    folderDiv.classList.toggle('folder-collapsed');
                    toggle.innerHTML = folderDiv.classList.contains('folder-collapsed') 
                        ? '<svg width="8" height="8" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 1L5 5L9 1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" transform="rotate(-90 5 3)"></path></svg>'
                        : '<svg width="8" height="8" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 1L5 5L9 1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path></svg>';
                }
            };

            // Folder icon
            const folderIcon = document.createElement('span');
            folderIcon.innerHTML = '<svg class="icon-folder" width="14" height="14" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>';
            folderIcon.style.opacity = '0.7';
            folderIcon.style.marginRight = '4px';
            folderIcon.style.display = 'flex';
            folderIcon.style.alignItems = 'center';

            const name = document.createElement('span');
            name.className = 'folder-name';
            name.textContent = folder.name;
            name.tabIndex = 0; // Make it focusable
            name.onclick = (e) => {
                e.stopPropagation();
                e.preventDefault();
                console.log('Folder name clicked:', folder.name);
                const newName = prompt('Enter new folder name:\n\nRules:\n- Must start with a letter\n- Can only contain letters, numbers, and hyphens\nExample: "brand-colors-1"', folder.name);
                if (newName && newName !== folder.name) {
                    this.renameFolder(level, folder.id, newName);
                }
            };
            // Also handle Enter key for accessibility
            name.onkeypress = (e) => {
                if (e.key === 'Enter') {
                    e.stopPropagation();
                    e.preventDefault();
                    const newName = prompt('Enter new folder name:\n\nRules:\n- Must start with a letter\n- Can only contain letters, numbers, and hyphens\nExample: "brand-colors-1"', folder.name);
                    if (newName && newName !== folder.name) {
                        this.renameFolder(level, folder.id, newName);
                    }
                }
            };

            const actions = document.createElement('div');
            actions.className = 'folder-actions';

            // Add token button with improved reference handling
            const addTokenBtn = document.createElement('button');
            addTokenBtn.className = 'folder-action-btn';
            addTokenBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>';
            addTokenBtn.title = 'Add Token';
            addTokenBtn.onclick = (e) => {
                e.stopPropagation();
                // Show add token modal with this folder pre-selected
                const modal = document.getElementById('addTokenModal');
                if (modal) {
                    const folderSelect = document.getElementById('tokenFolder');
                    if (folderSelect) {
                        folderSelect.value = folder.id;
                    }
                    
                    // Show the right modal based on level
                    if (level === 'primitives') {
                        document.getElementById('add-primitive-token').click();
                    } else if (level === 'aliases') {
                        document.getElementById('add-alias-token').click();
                    } else if (level === 'tokens') {
                        document.getElementById('add-component-token').click();
                    }
                }
            };

            // Add folder button
            const addFolderBtn = document.createElement('button');
            addFolderBtn.className = 'folder-action-btn';
            addFolderBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path><line x1="12" y1="11" x2="12" y2="17"></line><line x1="9" y1="14" x2="15" y2="14"></line></svg>';
            addFolderBtn.title = 'Add Folder';
            addFolderBtn.onclick = (e) => {
                e.stopPropagation();
                const folderName = prompt('Enter folder name:');
                if (folderName) {
                    this.createFolder(level, folder.id, folderName);
                }
            };

            // Delete button
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'folder-action-btn delete';
            deleteBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
            deleteBtn.title = 'Delete Folder';
            deleteBtn.onclick = (e) => {
                e.stopPropagation();
                if (confirm('Are you sure you want to delete this folder and all its contents?')) {
                    this.deleteFolder(level, folder.id);
                }
            };

            actions.appendChild(addTokenBtn);
            actions.appendChild(addFolderBtn);
            actions.appendChild(deleteBtn);

            header.appendChild(toggle);
            header.appendChild(folderIcon);
            header.appendChild(name);
            header.appendChild(actions);
            
            // Add drag and drop event listeners for the folder header
            header.addEventListener('dragstart', (e) => {
                // Cancel drag if clicking on a button
                if (e.target.tagName === 'BUTTON' || e.target.closest('button')) {
                    e.preventDefault();
                    return false;
                }
                
                console.log('Drag started for folder:', folder.name);
                header.classList.add('dragging');
                
                // Set the data to be transferred - use text/plain for maximum compatibility
                const dragData = JSON.stringify({
                    type: 'folder',
                    id: folder.id,
                    level: level
                });
                
                e.dataTransfer.setData('text/plain', dragData);
                e.dataTransfer.effectAllowed = 'move';
                
                try {
                    // Create a ghost element for dragging
                    const ghostElement = document.createElement('div');
                    ghostElement.classList.add('folder-header');
                    ghostElement.textContent = folder.name;
                    ghostElement.style.position = 'absolute';
                    ghostElement.style.top = '-1000px';
                    document.body.appendChild(ghostElement);
                    
                    e.dataTransfer.setDragImage(ghostElement, 0, 0);
                    
                    setTimeout(() => {
                        document.body.removeChild(ghostElement);
                    }, 0);
                } catch (err) {
                    console.error('Error setting drag image:', err);
                }
                
                return true;
            });
            
            header.addEventListener('dragend', () => {
                console.log('Drag ended for folder:', folder.name);
                header.classList.remove('dragging');
            });
            
            folderDiv.appendChild(header);
        }

        const content = document.createElement('div');
        content.className = 'folder-content';
        
        // Add drop area event listeners to folder content
        content.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            // Add visual feedback for valid drop target
            if (!content.classList.contains('drag-over')) {
                content.classList.add('drag-over');
            }
            
            e.dataTransfer.dropEffect = 'move';
            return false;
        });
        
        content.addEventListener('dragleave', (e) => {
            // Remove visual feedback when drag leaves the drop target
            content.classList.remove('drag-over');
        });
        
        content.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            content.classList.remove('drag-over');
            
            try {
                let data;
                try {
                    // Try to parse the data - use text/plain for maximum compatibility
                    const jsonData = e.dataTransfer.getData('text/plain');
                    data = JSON.parse(jsonData);
                    console.log('Successfully parsed drop data:', data);
                } catch (parseError) {
                    console.error('Failed to parse drop data:', parseError);
                    return false;
                }
                
                console.log('Drop event data:', data);
                
                // Only allow drops within the same level
                if (data.level !== level) {
                    console.log('Cannot move between different levels');
                    this.showNotification('Items cannot be moved between different hierarchy levels', 'error');
                    return false;
                }
                
                if (data.type === 'token') {
                    // Move the token to this folder
                    this.moveToken(data.id, data.level, folder.id);
                } else if (data.type === 'folder') {
                    // Move the folder to this folder
                    // Check if trying to move a folder to itself
                    if (data.id === folder.id) {
                        console.log('Cannot move a folder to itself');
                        this.showNotification('Cannot move a folder to itself', 'error');
                        return false;
                    }
                    
                    this.moveFolder(data.id, data.level, folder.id);
                }
                
                return false;
            } catch (error) {
                console.error('Error processing drop:', error);
                return false;
            }
        });

        folder.tokens.forEach(token => {
            const element = this.createTokenElement(level, token.category, token);
            content.appendChild(element);
        });

        folder.children.forEach(child => {
            this.renderFolder(content, child, level);
        });

        folderDiv.appendChild(content);
        container.appendChild(folderDiv);
    }

    // Deprecated: This method is replaced by the new modal dialogs
    showReferenceDialog(level, category, sourceTokens, folderId = 'root') {
        console.log('Opening reference dialog:', { level, category, folderId });
        // This method is kept for backward compatibility
        // Show the new modal instead
        
        const modal = document.getElementById('addTokenModal');
        const modalTitle = modal.querySelector('h2');
        const submitBtn = document.getElementById('addTokenSubmit');
        
        if (level === 'aliases') {
            modalTitle.textContent = 'Add Alias';
        } else {
            modalTitle.textContent = 'Add Component Token';
        }
        
        // Reset form fields
        document.getElementById('tokenName').value = `${category}-${level}-${Date.now()}`;
        document.getElementById('tokenType').value = category;
        
        // Show reference selection
        document.getElementById('colorValueGroup').style.display = 'none';
        document.getElementById('textValueGroup').style.display = 'none';
        document.getElementById('referenceValueGroup').style.display = 'block';
        
        // Populate reference dropdown
        const referenceSelect = document.getElementById('tokenReference');
        referenceSelect.innerHTML = '';
        
        const sourceLevel = level === 'aliases' ? 'primitives' : 'aliases';
        const allSourceTokens = this.getAllTokens(sourceLevel, category);
        
        allSourceTokens.forEach(token => {
            const option = document.createElement('option');
            option.value = token.name;
            option.textContent = `${token.name} (${token.value})`;
            referenceSelect.appendChild(option);
        });
        
        // Handle form submission
        const handleSubmit = () => {
            const name = document.getElementById('tokenName').value.trim();
            const refToken = document.getElementById('tokenReference').value;
            
            if (!name) {
                this.showNotification('Token name cannot be empty.', 'error');
                return;
            }
            
            if (!refToken) {
                this.showNotification('Please select a reference token.', 'error');
                return;
            }
            
            // Create the token
            this.addToken(level, category, { 
                name, 
                value: `{${refToken}}`
            }, folderId);
            
            modal.style.display = 'none';
        };
        
        submitBtn.onclick = handleSubmit;
        modal.style.display = 'block';
    }

    getAllTokensFromFolder(folder) {
        console.log('Getting all tokens from folder:', folder.name, 'ID:', folder.id);
        let tokens = [...folder.tokens];
        console.log('Direct tokens in folder:', tokens.map(t => t.name));

        for (const child of folder.children) {
            console.log('Processing child folder:', child.name);
            const childTokens = this.getAllTokensFromFolder(child);
            console.log('Found tokens in child folder:', childTokens.map(t => t.name));
            tokens = tokens.concat(childTokens);
        }

        console.log(`Total tokens found in folder ${folder.name}:`, tokens.map(t => t.name));
        return tokens;
    }

    getAllTokens(level, category = null) {
        console.log('Getting all tokens for:', { level, category });
        if (!this.activeClient || !this.clients[this.activeClient][level]) {
            console.warn('No client or level found:', { client: this.activeClient, level });
            return [];
        }
        
        const allTokens = this.getAllTokensFromFolder(this.clients[this.activeClient][level].root);
        
        // If category is specified, filter by category
        const filteredTokens = category ? allTokens.filter(t => t.category === category) : allTokens;
        
        console.log(`Total tokens found: ${filteredTokens.length}`);
        return filteredTokens;
    }

    createTokenElement(level, category, token) {
        const div = document.createElement('div');
        div.className = 'token-item';
        div.dataset.id = token.id;
        div.dataset.category = category;
        div.dataset.level = level;
        div.draggable = true; // Make the token draggable
        
        // Add type icon (color, typography, etc.)
        const typeIcon = document.createElement('span');
        typeIcon.className = `token-type-icon ${category.slice(0, -1)}`; // category.slice(0, -1) converts "colors" to "color", etc.
        
        if (category === 'colors') {
            // For colors, show color preview as well
            const colorPreview = document.createElement('span');
            colorPreview.className = 'token-preview';
            const resolvedColor = this.resolveColorReference(token.value, level, category);
            colorPreview.style.backgroundColor = resolvedColor || '#CCCCCC';
            
            div.appendChild(colorPreview);
        } else if (category === 'typography') {
            typeIcon.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><text font-size="12" x="6" y="16" fill="currentColor">T</text></svg>';
        } else if (category === 'spacing') {
            typeIcon.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="6" y1="6" x2="18" y2="6"></line><line x1="6" y1="18" x2="18" y2="18"></line></svg>';
        } else if (category === 'sizing') {
            typeIcon.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="6" width="12" height="12" rx="2"></rect></svg>';
        }
        
        div.appendChild(typeIcon);
        
        // Content container (name and value)
        const contentDiv = document.createElement('div');
        contentDiv.className = 'token-content';
        
        // Token name
        const nameSpan = document.createElement('span');
        nameSpan.className = 'token-name';
        nameSpan.textContent = token.name;
        contentDiv.appendChild(nameSpan);
        
        // Token value
        const valueSpan = document.createElement('span');
        
        if (token.value.startsWith('{')) {
            // Reference value
            valueSpan.className = 'token-value reference';
            if (level === 'tokens') {
                valueSpan.classList.add('alias');
            }
            
            const refName = token.value.substring(1, token.value.length - 1);
            valueSpan.textContent = refName;
        } else {
            // Direct value
            valueSpan.className = 'token-value';
            valueSpan.textContent = token.value;
        }
        
        contentDiv.appendChild(valueSpan);
        div.appendChild(contentDiv);
        
        // Action buttons (only shown on hover)
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'token-actions';
        
        // Copy button
        const copyBtn = document.createElement('button');
        copyBtn.className = 'token-action-btn copy';
        copyBtn.title = 'Copy Value';
        copyBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>';
        copyBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            let valueToCopy;
            
            // Get resolved value for references
            if (token.value.startsWith('{')) {
                if (category === 'colors') {
                    valueToCopy = this.resolveColorReference(token.value, level, category);
                } else {
                    valueToCopy = this.resolveValue(token.value, level === 'aliases' ? 'primitives' : 'aliases', category);
                }
            } else {
                valueToCopy = token.value;
            }
            
            navigator.clipboard.writeText(valueToCopy).then(() => {
                // Show notification
                this.showNotification('Value copied to clipboard!');
            }).catch(err => {
                console.error('Could not copy text: ', err);
                this.showNotification('Failed to copy value', 'error');
            });
        });
        actionsDiv.appendChild(copyBtn);
        
        // Edit button
        const editBtn = document.createElement('button');
        editBtn.className = 'token-action-btn edit';
        editBtn.title = 'Edit Token';
        editBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>';
        editBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            
            // Show edit modal
            this.showEditTokenModal(level, category, token);
        });
        actionsDiv.appendChild(editBtn);
        
        // Delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'token-action-btn delete';
        deleteBtn.title = 'Delete Token';
        deleteBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>';
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            
            if (confirm(`Are you sure you want to delete the token "${token.name}"?`)) {
                this.removeToken(level, category, token.id);
            }
        });
        actionsDiv.appendChild(deleteBtn);
        
        div.appendChild(actionsDiv);
        
        // Add drag and drop event listeners
        div.addEventListener('dragstart', (e) => {
            // Cancel drag if clicking on a button
            if (e.target.tagName === 'BUTTON' || e.target.closest('button')) {
                e.preventDefault();
                return false;
            }
            
            console.log('Drag started for token:', token.name);
            div.classList.add('dragging');
            
            // Set the data to be transferred - use text/plain for maximum compatibility
            const dragData = JSON.stringify({
                type: 'token',
                id: token.id,
                level: level,
                category: category
            });
            
            e.dataTransfer.setData('text/plain', dragData);
            e.dataTransfer.effectAllowed = 'move';
            
            // Use the element itself as the drag image
            try {
                // Create a ghost element for dragging if browser supports it
                const ghostElement = document.createElement('div');
                ghostElement.classList.add('token-item');
                ghostElement.textContent = token.name;
                ghostElement.style.position = 'absolute';
                ghostElement.style.top = '-1000px';
                document.body.appendChild(ghostElement);
                
                e.dataTransfer.setDragImage(ghostElement, 0, 0);
                
                setTimeout(() => {
                    document.body.removeChild(ghostElement);
                }, 0);
            } catch (err) {
                console.error('Error setting drag image:', err);
            }
            
            return true;
        });
        
        div.addEventListener('dragend', () => {
            console.log('Drag ended for token:', token.name);
            div.classList.remove('dragging');
        });
        
        return div;
    }
    
    showEditTokenModal(level, category, token) {
        const modal = document.getElementById('addTokenModal');
        const modalTitle = modal.querySelector('h2');
        const submitBtn = document.getElementById('addTokenSubmit');
        
        // Update modal title
        modalTitle.textContent = `Edit ${level.charAt(0).toUpperCase() + level.slice(1, -1)} Token`;
        
        // Populate form fields
        document.getElementById('tokenName').value = token.name;
        document.getElementById('tokenType').value = category;
        document.getElementById('tokenType').disabled = true; // Can't change type when editing
        
        // Set appropriate value fields
        if (level === 'primitives' || (level === 'aliases' && !token.value.startsWith('{'))) {
            // Direct value
            document.getElementById('referenceValueGroup').style.display = 'none';
            
            if (category === 'colors') {
                document.getElementById('colorValueGroup').style.display = 'block';
                document.getElementById('textValueGroup').style.display = 'none';
                document.getElementById('tokenColorValue').value = token.value;
                document.getElementById('tokenColorPicker').value = token.value;
            } else {
                document.getElementById('colorValueGroup').style.display = 'none';
                document.getElementById('textValueGroup').style.display = 'block';
                document.getElementById('tokenTextValue').value = token.value;
            }
        } else {
            // Reference value
            document.getElementById('colorValueGroup').style.display = 'none';
            document.getElementById('textValueGroup').style.display = 'none';
            document.getElementById('referenceValueGroup').style.display = 'block';
            
            // Populate reference dropdown
            const referenceSelect = document.getElementById('tokenReference');
            referenceSelect.innerHTML = '';
            
            const sourceLevel = level === 'aliases' ? 'primitives' : 'aliases';
            const sourceTokens = this.getAllTokens(sourceLevel, category);
            
            sourceTokens.forEach(sourceToken => {
                const option = document.createElement('option');
                option.value = sourceToken.name;
                option.textContent = `${sourceToken.name} (${sourceToken.value})`;
                
                // Set selected if this is the current reference
                const refName = token.value.substring(1, token.value.length - 1);
                if (sourceToken.name === refName) {
                    option.selected = true;
                }
                
                referenceSelect.appendChild(option);
            });
        }
        
        // Handle form submission
        const handleSubmit = () => {
            const name = document.getElementById('tokenName').value.trim();
            
            if (!name) {
                this.showNotification('Token name cannot be empty.', 'error');
                return;
            }
            
            let value;
            if (level === 'primitives' || (level === 'aliases' && !token.value.startsWith('{'))) {
                // Direct value
                if (category === 'colors') {
                    value = document.getElementById('tokenColorValue').value.trim();
                } else {
                    value = document.getElementById('tokenTextValue').value.trim();
                }
                
                if (!value) {
                    this.showNotification('Token value cannot be empty.', 'error');
                    return;
                }
            } else {
                // Reference value
                const refToken = document.getElementById('tokenReference').value;
                if (!refToken) {
                    this.showNotification('Please select a reference token.', 'error');
                    return;
                }
                
                value = `{${refToken}}`;
            }
            
            // Update the token
            this.updateToken(level, category, token.id, { name, value });
            modal.style.display = 'none';
        };
        
        submitBtn.onclick = handleSubmit;
        submitBtn.textContent = 'Update Token';
        
        // Show the modal
        modal.style.display = 'block';
    }
    
    showNotification(message, type = 'success') {
        const notification = document.getElementById('notification');
        const notificationMessage = notification.querySelector('.notification-message');
        const notificationIcon = notification.querySelector('.notification-icon');
        
        // Set notification content
        notificationMessage.textContent = message;
        notification.className = `notification ${type}`;
        
        // Set icon based on type
        if (type === 'success') {
            notificationIcon.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
        } else {
            notificationIcon.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>';
        }
        
        // Show notification
        notification.classList.add('show');
        
        // Auto-dismiss after 3 seconds
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }

    // Helper methods for token references
    getPrimitivesList(category) {
        if (!this.activeClient || !this.clients[this.activeClient].primitives) return '';
        const allTokens = this.getAllTokens('primitives');
        return allTokens
            .filter(t => t.category === category)
            .map(p => p.name)
            .join(', ');
    }

    getAliasesList(category) {
        if (!this.activeClient || !this.clients[this.activeClient].aliases) return '';
        const allTokens = this.getAllTokens('aliases');
        return allTokens
            .filter(t => t.category === category)
            .map(p => p.name)
            .join(', ');
    }

    validatePrimitiveReference(category, value) {
        if (!this.activeClient) return false;
        if (!value.startsWith('{') || !value.endsWith('}')) return false;
        const refName = value.slice(1, -1);
        const primitives = this.getAllTokens('primitives').filter(t => t.category === category);
        return primitives && primitives.some(p => p.name === refName);
    }

    validateAliasReference(category, value) {
        if (!this.activeClient) return false;
        if (!value.startsWith('{') || !value.endsWith('}')) return false;
        const refName = value.slice(1, -1);
        const aliases = this.getAllTokens('aliases').filter(t => t.category === category);
        return aliases && aliases.some(a => a.name === refName);
    }

    resolveValue(reference, referenceType, category) {
        if (!this.activeClient || !this.clients[this.activeClient][referenceType]) {
            console.log('Cannot resolve value: invalid client or level', { reference, referenceType });
            return '';
        }

        if (!reference.startsWith('{')) {
            console.log('Direct value (no reference):', reference);
            return reference;
        }

        console.log(`Resolving ${referenceType} reference:`, reference);
        const refName = reference.slice(1, -1);
        const allTokens = this.getAllTokens(referenceType);
        const ref = allTokens.find(item => item.name === refName && item.category === category);

        if (!ref) {
            console.error(`Reference not found: ${reference} in ${referenceType} with category ${category}`);
            return reference;
        }

        // For nested references (e.g., token → alias → primitive)
        if (ref.value.startsWith('{')) {
            console.log('Found nested reference:', ref.value);
            // If we're already at primitives, return to avoid infinite recursion
            if (referenceType === 'primitives') {
                console.warn('Circular reference detected in primitives');
                return ref.value;
            }
            // Resolve the next level reference
            const resolvedValue = this.resolveValue(ref.value, 'primitives', category);
            console.log('Resolved nested reference:', resolvedValue);
            return resolvedValue;
        }

        console.log('Resolved to value:', ref.value);
        return ref.value;
    }

    resolveColorReference(value, level, category) {
        console.log(`Resolving color reference for ${level}:`, value);

        if (!value.startsWith('{')) {
            return value; // Direct color value
        }

        if (level === 'tokens') {
            // Resolve token -> alias -> primitive
            const aliasValue = this.resolveValue(value, 'aliases', category);
            const color = aliasValue.startsWith('{') ?
                this.resolveValue(aliasValue, 'primitives', category) :
                aliasValue;
            console.log('Resolved token color:', { original: value, final: color });
            return color;
        } else if (level === 'aliases') {
            // Resolve alias -> primitive
            const color = this.resolveValue(value, 'primitives', category);
            console.log('Resolved alias color:', { original: value, final: color });
            return color;
        }

        return value;
    }

    updateTokenReferences(level, category, oldName, newName) {
        console.log(`Updating token references from "${oldName}" to "${newName}"`);
        try {
            if (level === 'primitives') {
                // Update aliases referencing this primitive
                const allAliases = this.getAllTokens('aliases', category);
                allAliases.forEach(aliasToken => {
                    if (aliasToken.value === `{${oldName}}`) {
                        console.log(`Updating alias reference:`, aliasToken);
                        this.updateToken('aliases', category, aliasToken.id, { value: `{${newName}}` });
                    }
                });

                // Update tokens referencing this primitive
                const allTokens = this.getAllTokens('tokens', category);
                allTokens.forEach(token => {
                    if (token.value === `{${oldName}}`) {
                        console.log(`Updating token reference:`, token);
                        this.updateToken('tokens', category, token.id, { value: `{${newName}}` });
                    }
                });
            } else if (level === 'aliases') {
                // Update tokens referencing this alias
                const allTokens = this.getAllTokens('tokens', category);
                allTokens.forEach(refToken => {
                    if (refToken.value === `{${oldName}}`) {
                        console.log(`Updating token reference:`, refToken);
                        this.updateToken('tokens', category, refToken.id, { value: `{${newName}}` });
                    }
                });
            }
            this.showSuccess('general', 'general', `Updated all references from "${oldName}" to "${newName}"`);
        } catch (error) {
            console.error('Error updating token references:', error);
            this.showError('general', 'general', 'Failed to update some token references');
        }
    }
    
    findTokenInFolder(folder, tokenId) {
        console.log('Searching for token:', {
            tokenId,
            folderName: folder.name || 'root',
            numTokens: folder.tokens?.length || 0,
            folderPath: this.getFolderPath(folder)
        });

        // Validate folder structure
        if (!folder || !Array.isArray(folder.tokens)) {
            console.error('Invalid folder structure:', folder);
            return null;
        }

        // Check tokens in current folder
        for (let i = 0; i < folder.tokens.length; i++) {
            const token = folder.tokens[i];
            if (token.id === tokenId) {
                console.log('Found token in folder:', {
                    folderPath: this.getFolderPath(folder),
                    tokenName: token.name,
                    tokenId: token.id,
                    index: i
                });
                return { token, folder, index: i };
            }
        }

        // Check subfolders recursively
        if (Array.isArray(folder.children)) {
            for (const child of folder.children) {
                const result = this.findTokenInFolder(child, tokenId);
                if (result) {
                    return result;
                }
            }
        }

        console.log('Token not found in folder:', this.getFolderPath(folder));
        return null;
    }

    getFolderPath(folder) {
        const path = [];
        let current = folder;
        while (current) {
            path.unshift(current.name || 'root');
            current = current.parent;
        }
        return path.join(' > ');
    }

    updateTokenInFolder(folder, tokenId, updates) {
        console.log('Attempting to update token:', {
            tokenId,
            updates,
            folderPath: this.getFolderPath(folder)
        });

        const result = this.findTokenInFolder(folder, tokenId);
        if (!result) {
            console.error('Token not found for update:', {
                tokenId,
                folderPath: this.getFolderPath(folder)
            });
            return false;
        }

        const { token, folder: targetFolder, index } = result;
        console.log('Found token for update:', {
            tokenId,
            folderPath: this.getFolderPath(targetFolder),
            tokenName: token.name,
            tokenValue: token.value,
            updates
        });

        // Create updated token
        const updatedToken = { ...token, ...updates };
        targetFolder.tokens[index] = updatedToken;

        console.log('Token updated successfully:', {
            tokenId,
            folderPath: this.getFolderPath(targetFolder),
            oldName: token.name,
            newName: updatedToken.name,
            oldValue: token.value,
            newValue: updatedToken.value
        });
        return true;
    }

    updateToken(level, category, tokenId, updates) {
        console.log('Starting token update:', { level, category, tokenId, updates });

        // Validate client
        if (!this.activeClient) {
            console.error('No active client selected');
            this.showError('general', 'general', 'Please select a client first');
            return false;
        }

        // Validate level exists
        if (!this.clients[this.activeClient][level]) {
            console.error('Invalid level:', { level });
            this.showError('general', 'general', 'Invalid token level');
            return false;
        }

        // Log the structure we're searching in
        console.log('Searching in structure:', {
            client: this.activeClient,
            level,
            category,
            structure: JSON.stringify(this.clients[this.activeClient][level].root, null, 2)
        });

        // Find the token and validate updates
        const rootFolder = this.clients[this.activeClient][level].root;
        const result = this.findTokenInFolder(rootFolder, tokenId);

        if (!result) {
            console.error('Token not found in structure:', {
                tokenId,
                folderPath: this.getFolderPath(rootFolder)
            });
            this.showError('general', 'general', 'Token not found in any folder');
            return false;
        }

        const { token } = result;
        console.log('Found token:', { token, updates });

        // Validate name updates
        if (updates.name) {
            if (!TokenValidator.validateTokenName(updates.name)) {
                console.error('Invalid token name:', updates.name);
                this.showError('general', 'general', 'Invalid token name. It must:\n- Start with a letter\n- Only contain letters, numbers, and hyphens');
                return false;
            }

            // Check for name uniqueness
            const allTokens = this.getAllTokens(level, category);
            if (allTokens.some(t => t.name === updates.name && t.id !== tokenId)) {
                console.error('Duplicate token name:', updates.name);
                this.showError('general', 'general', `A token with the name "${updates.name}" already exists`);
                return false;
            }

            // Handle references if name changes
            if (token.name !== updates.name) {
                console.log('Updating token references:', {
                    oldName: token.name,
                    newName: updates.name
                });
                this.updateTokenReferences(level, category, token.name, updates.name);
            }
        }

        // Validate value updates
        if (updates.value && !this.validateToken(category, { ...token, ...updates })) {
            console.error('Invalid token value:', updates.value);
            this.showError('general', 'general', `Invalid ${category} value format`);
            return false;
        }

        // Perform the update
        if (this.updateTokenInFolder(rootFolder, tokenId, updates)) {
            console.log('Token update successful');
            this.saveTokens();
            this.renderTokens();
            this.showSuccess('general', 'general', `Token "${token.name}" updated successfully`);
            return true;
        }

        console.error('Failed to update token');
        this.showError('general', 'general', 'Failed to update token');
        return false;
    }

    removeToken(level, category, tokenId) {
        console.log('Removing token:', { level, category, tokenId });
        if (!this.clients[this.activeClient][level]) {
            console.error('Invalid level for token removal');
            return false;
        }

        const removeTokenFromFolder = (folder) => {
            // Check tokens in current folder
            const tokenIndex = folder.tokens.findIndex(t => t.id === tokenId);
            if (tokenIndex !== -1) {
                console.log('Found token to remove in folder:', folder.name);
                folder.tokens.splice(tokenIndex, 1);
                return true;
            }

            // Check subfolders recursively
            for (const child of folder.children) {
                if (removeTokenFromFolder(child)) {
                    return true;
                }
            }
            return false;
        };

        if (removeTokenFromFolder(this.clients[this.activeClient][level].root)) {
            console.log('Token removed successfully');
            this.saveTokens();
            this.renderTokens();
            return true;
        }

        console.error('Token not found for removal:', tokenId);
        return false;
    }
    
    updateFolderPaths(folder, parent = null) {
        folder.parent = parent;
        if (Array.isArray(folder.children)) {
            folder.children.forEach(child => {
                this.updateFolderPaths(child, folder);
            });
        }
    }
    
    moveToken(tokenId, sourceLevel, targetFolderId) {
        console.log('Moving token:', { tokenId, sourceLevel, targetFolderId });
        
        if (!this.activeClient) {
            console.error('No active client selected');
            this.showError('general', 'general', 'Please select a client first');
            return false;
        }
        
        // Find the token in the source level
        const root = this.clients[this.activeClient][sourceLevel].root;
        const result = this.findTokenInFolder(root, tokenId);
        
        if (!result) {
            console.error('Token not found for moving:', { tokenId, sourceLevel });
            this.showError('general', 'general', 'Token not found');
            return false;
        }
        
        const { token, folder: sourceFolder, index } = result;
        console.log('Found token for moving:', { 
            token, 
            sourceFolderPath: this.getFolderPath(sourceFolder) 
        });
        
        // Find the target folder
        const targetFolder = targetFolderId === 'root' ?
            this.clients[this.activeClient][sourceLevel].root :
            this.findFolder(this.clients[this.activeClient][sourceLevel].root, targetFolderId);
            
        if (!targetFolder) {
            console.error('Target folder not found:', targetFolderId);
            this.showError('general', 'general', 'Target folder not found');
            return false;
        }
        
        console.log('Target folder found:', {
            targetFolderPath: this.getFolderPath(targetFolder)
        });
        
        // Check if token is already in the target folder
        if (sourceFolder.id === targetFolder.id) {
            console.log('Token is already in the target folder');
            return true;
        }
        
        // Remove token from source folder
        sourceFolder.tokens.splice(index, 1);
        
        // Add token to target folder
        targetFolder.tokens.push(token);
        
        console.log('Token moved successfully:', {
            token,
            fromFolder: this.getFolderPath(sourceFolder),
            toFolder: this.getFolderPath(targetFolder)
        });
        
        this.saveTokens();
        this.renderTokens();
        this.showSuccess('general', 'general', `Token "${token.name}" moved successfully`);
        return true;
    }
    
    moveFolder(folderId, sourceLevel, targetFolderId) {
        console.log('Moving folder:', { folderId, sourceLevel, targetFolderId });
        
        if (!this.activeClient) {
            console.error('No active client selected');
            this.showError('general', 'general', 'Please select a client first');
            return false;
        }
        
        // Cannot move a folder to itself or its children
        if (folderId === targetFolderId) {
            console.error('Cannot move a folder to itself');
            this.showError('general', 'general', 'Cannot move a folder to itself');
            return false;
        }
        
        // Find the source folder to move
        const sourceRoot = this.clients[this.activeClient][sourceLevel].root;
        const folderToMove = this.findFolder(sourceRoot, folderId);
        
        if (!folderToMove) {
            console.error('Folder not found for moving:', { folderId, sourceLevel });
            this.showError('general', 'general', 'Folder not found');
            return false;
        }
        
        // Check if the target is a descendant of the source (prevent circular reference)
        const isDescendant = (parent, childId) => {
            if (parent.id === childId) return true;
            for (const child of parent.children) {
                if (isDescendant(child, childId)) return true;
            }
            return false;
        };
        
        if (isDescendant(folderToMove, targetFolderId)) {
            console.error('Cannot move a folder to its descendant');
            this.showError('general', 'general', 'Cannot move a folder to its descendant');
            return false;
        }
        
        // Find the target folder
        const targetFolder = targetFolderId === 'root' ?
            this.clients[this.activeClient][sourceLevel].root :
            this.findFolder(sourceRoot, targetFolderId);
            
        if (!targetFolder) {
            console.error('Target folder not found:', targetFolderId);
            this.showError('general', 'general', 'Target folder not found');
            return false;
        }
        
        console.log('Moving folder:', { 
            folderName: folderToMove.name,
            fromPath: this.getFolderPath(folderToMove.parent),
            toPath: this.getFolderPath(targetFolder)
        });
        
        // Remove folder from its parent's children
        const removeFromParent = (parent, childId) => {
            const index = parent.children.findIndex(child => child.id === childId);
            if (index !== -1) {
                parent.children.splice(index, 1);
                return true;
            }
            
            for (const child of parent.children) {
                if (removeFromParent(child, childId)) {
                    return true;
                }
            }
            
            return false;
        };
        
        if (!removeFromParent(sourceRoot, folderId)) {
            console.error('Failed to remove folder from its parent');
            this.showError('general', 'general', 'Failed to move folder');
            return false;
        }
        
        // Add folder to target folder
        targetFolder.children.push(folderToMove);
        
        console.log('Folder moved successfully:', {
            folderName: folderToMove.name,
            toPath: this.getFolderPath(targetFolder)
        });
        
        this.saveTokens();
        this.renderTokens();
        this.showSuccess('general', 'general', `Folder "${folderToMove.name}" moved successfully`);
        return true;
    }
}