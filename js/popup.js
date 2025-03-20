document.addEventListener('DOMContentLoaded', () => {
    console.log('Popup initialized');
    const tokenManager = new TokenManager();
    const exportManager = new ExportManager(tokenManager);
    
    // Initialize client management buttons visibility and check for empty state
    tokenManager.updateClientManagementButtons();
    
    // Initialize drag and drop for token lists (root level drop targets)
    ['primitives', 'aliases', 'tokens'].forEach(level => {
        const tokenList = document.getElementById(`${level}-tokens`);
        if (tokenList) {
            // Enable drop on the token list (for root-level drops)
            tokenList.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                // Add visual feedback for valid drop target
                if (!tokenList.classList.contains('drag-over')) {
                    tokenList.classList.add('drag-over');
                }
                
                e.dataTransfer.dropEffect = 'move';
                return false;
            });
            
            tokenList.addEventListener('dragleave', (e) => {
                // Remove visual feedback when drag leaves
                tokenList.classList.remove('drag-over');
            });
            
            tokenList.addEventListener('drop', (e) => {
                e.preventDefault();
                e.stopPropagation();
                tokenList.classList.remove('drag-over');
                
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
                    
                    console.log('Root level drop event:', data);
                    
                    // Only allow drops within the same level
                    if (data.level !== level) {
                        console.log('Cannot move between different levels');
                        tokenManager.showNotification('Items cannot be moved between different hierarchy levels', 'error');
                        return false;
                    }
                    
                    if (data.type === 'token') {
                        // Move the token to the root folder
                        tokenManager.moveToken(data.id, data.level, 'root');
                    } else if (data.type === 'folder') {
                        // Move the folder to the root
                        tokenManager.moveFolder(data.id, data.level, 'root');
                    }
                    
                    return false;
                } catch (error) {
                    console.error('Error processing drop:', error);
                    return false;
                }
            });
        }
    });

    // Show a toast notification - using tokenManager's method
    function showNotification(message, type = 'success') {
        tokenManager.showNotification(message, type);
    }

    // Level tab navigation
    document.querySelectorAll('.level-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const level = tab.dataset.level;
            console.log('Switching to level:', level);
            
            // Update active tab
            document.querySelectorAll('.level-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Update folder tree visibility
            document.querySelectorAll('.folder-tree').forEach(tree => {
                tree.style.display = 'none';
            });
            document.getElementById(`folder-tree-${level}`).style.display = 'block';
            
            // Update token section visibility
            document.querySelectorAll('.token-level-section').forEach(section => {
                section.classList.remove('active');
            });
            document.querySelector(`.token-level-section[data-level="${level}"]`).classList.add('active');
            
            // Update the selected folder level and reset to root
            tokenManager.selectedFolderLevel = level;
            tokenManager.selectedFolderId = 'root';
            
            // Activate the "All" item in the sidebar
            const folderTree = document.getElementById(`folder-tree-${level}`);
            if (folderTree) {
                const allItem = folderTree.querySelector('.folder-tree-item.all-items');
                if (allItem) {
                    folderTree.querySelectorAll('.folder-tree-item').forEach(item => {
                        item.classList.remove('active');
                    });
                    allItem.classList.add('active');
                }
            }
        });
    });

    // Client selection
    const clientSelect = document.getElementById('clientSelect');
    clientSelect.addEventListener('change', () => {
        const selectedClient = clientSelect.value;
        console.log('Client selection changed to:', selectedClient);
        tokenManager.activeClient = selectedClient;
        tokenManager.renderTokens();
        tokenManager.renderFolderTrees();
        tokenManager.updateClientManagementButtons();
    });

    // Add client button
    const addClientBtn = document.getElementById('addClientBtn');
    addClientBtn.addEventListener('click', () => {
        const clientName = prompt('Enter client name:');
        if (clientName && clientName.trim() !== '') {
            tokenManager.createClient(clientName.trim());
            showNotification(`Client "${clientName}" created successfully!`);
        }
    });
    
    // Edit client button
    const editClientBtn = document.getElementById('editClientBtn');
    editClientBtn.addEventListener('click', () => {
        if (!tokenManager.activeClient) {
            showNotification('Please select a client first.', 'error');
            return;
        }
        
        const newName = prompt('Enter new client name:', tokenManager.activeClient);
        if (newName && newName.trim() !== '') {
            tokenManager.editClientName(tokenManager.activeClient, newName.trim());
        }
    });
    
    // Delete client button
    const deleteClientBtn = document.getElementById('deleteClientBtn');
    deleteClientBtn.addEventListener('click', () => {
        if (!tokenManager.activeClient) {
            showNotification('Please select a client first.', 'error');
            return;
        }
        
        if (confirm(`Are you sure you want to delete client "${tokenManager.activeClient}"? This action cannot be undone.`)) {
            tokenManager.deleteClient(tokenManager.activeClient);
        }
    });

    // Add token buttons
    document.getElementById('add-primitive-token').addEventListener('click', () => {
        if (!tokenManager.activeClient) {
            showNotification('Please select a client first.', 'error');
            return;
        }
        
        // Show the modal for adding a primitive token
        const modal = document.getElementById('addTokenModal');
        const modalTitle = modal.querySelector('h2');
        const submitBtn = document.getElementById('addTokenSubmit');
        
        modalTitle.textContent = 'Add Primitive';
        
        // Update the modal content for primitives
        document.getElementById('tokenType').removeAttribute('disabled');
        document.getElementById('referenceValueGroup').style.display = 'none';
        
        // Reset form fields
        document.getElementById('tokenName').value = '';
        document.getElementById('tokenColorValue').value = '#0D99FF';
        document.getElementById('tokenColorPicker').value = '#0D99FF';
        document.getElementById('tokenTextValue').value = '16px';
        
        // Populate folder dropdown for the current level
        const folderSelect = document.getElementById('tokenFolder');
        folderSelect.innerHTML = '<option value="root">Root</option>';
        
        if (tokenManager.activeClient) {
            const client = tokenManager.clients[tokenManager.activeClient];
            if (client && client['primitives']) {
                const rootFolder = client['primitives'].root;
                
                // Add all folders as options with indentation
                const addFolderOptions = (folder, indent = '') => {
                    folder.children.forEach(childFolder => {
                        const option = document.createElement('option');
                        option.value = childFolder.id;
                        option.textContent = `${indent}${childFolder.name}`;
                        folderSelect.appendChild(option);
                        
                        // Add children with increased indent
                        addFolderOptions(childFolder, indent + '  ');
                    });
                };
                
                addFolderOptions(rootFolder);
                
                // Set the currently selected folder as default if it's in primitives level
                if (tokenManager.selectedFolderId && tokenManager.selectedFolderLevel === 'primitives') {
                    // Try to find the option with the selected folder ID
                    const options = Array.from(folderSelect.options);
                    const selectedOption = options.find(opt => opt.value === tokenManager.selectedFolderId);
                    if (selectedOption) {
                        selectedOption.selected = true;
                    }
                }
            }
        }
        
        // Show appropriate value input based on selected type
        const updateValueVisibility = () => {
            const type = document.getElementById('tokenType').value;
            if (type === 'colors') {
                document.getElementById('colorValueGroup').style.display = 'block';
                document.getElementById('textValueGroup').style.display = 'none';
            } else {
                document.getElementById('colorValueGroup').style.display = 'none';
                document.getElementById('textValueGroup').style.display = 'block';
            }
        };
        
        document.getElementById('tokenType').addEventListener('change', updateValueVisibility);
        updateValueVisibility();
        
        // Handle form submission
        const handleSubmit = () => {
            const name = document.getElementById('tokenName').value.trim();
            const type = document.getElementById('tokenType').value;
            const folder = document.getElementById('tokenFolder').value;
            
            if (!name) {
                showNotification('Token name cannot be empty.', 'error');
                return;
            }
            
            let value;
            if (type === 'colors') {
                value = document.getElementById('tokenColorValue').value.trim();
            } else {
                value = document.getElementById('tokenTextValue').value.trim();
            }
            
            if (!value) {
                showNotification('Token value cannot be empty.', 'error');
                return;
            }
            
            // Create the token
            tokenManager.addToken('primitives', type, { name, value, category: type }, folder);
            modal.style.display = 'none';
        };
        
        submitBtn.onclick = handleSubmit;
        modal.style.display = 'block';
    });

    document.getElementById('add-alias-token').addEventListener('click', () => {
        if (!tokenManager.activeClient) {
            showNotification('Please select a client first.', 'error');
            return;
        }
        
        // Get all primitive tokens for reference
        const primitiveTokens = {};
        ['colors', 'typography', 'spacing', 'sizing'].forEach(category => {
            primitiveTokens[category] = tokenManager.getAllTokens('primitives', category);
        });
        
        // Check if there are any primitives to reference
        let hasPrimitives = false;
        for (const category in primitiveTokens) {
            if (primitiveTokens[category].length > 0) {
                hasPrimitives = true;
                break;
            }
        }
        
        if (!hasPrimitives) {
            showNotification('Create some primitive tokens first.', 'error');
            return;
        }
        
        // Show the modal for adding an alias token
        const modal = document.getElementById('addTokenModal');
        const modalTitle = modal.querySelector('h2');
        const submitBtn = document.getElementById('addTokenSubmit');
        
        modalTitle.textContent = 'Add Alias';
        
        // Update the modal content for aliases
        document.getElementById('tokenName').value = '';
        
        // Populate folder dropdown for aliases
        const folderSelect = document.getElementById('tokenFolder');
        folderSelect.innerHTML = '<option value="root">Root</option>';
        
        if (tokenManager.activeClient) {
            const client = tokenManager.clients[tokenManager.activeClient];
            if (client && client['aliases']) {
                const rootFolder = client['aliases'].root;
                
                // Add all folders as options with indentation
                const addFolderOptions = (folder, indent = '') => {
                    folder.children.forEach(childFolder => {
                        const option = document.createElement('option');
                        option.value = childFolder.id;
                        option.textContent = `${indent}${childFolder.name}`;
                        folderSelect.appendChild(option);
                        
                        // Add children with increased indent
                        addFolderOptions(childFolder, indent + '  ');
                    });
                };
                
                addFolderOptions(rootFolder);
                
                // Set the currently selected folder as default if it's in aliases level
                if (tokenManager.selectedFolderId && tokenManager.selectedFolderLevel === 'aliases') {
                    // Try to find the option with the selected folder ID
                    const options = Array.from(folderSelect.options);
                    const selectedOption = options.find(opt => opt.value === tokenManager.selectedFolderId);
                    if (selectedOption) {
                        selectedOption.selected = true;
                    }
                }
            }
        }
        
        // Show reference selection
        document.getElementById('colorValueGroup').style.display = 'none';
        document.getElementById('textValueGroup').style.display = 'none';
        document.getElementById('referenceValueGroup').style.display = 'block';
        
        // Populate reference dropdown based on selected type
        const updateReferenceOptions = () => {
            const type = document.getElementById('tokenType').value;
            const referenceSelect = document.getElementById('tokenReference');
            referenceSelect.innerHTML = '';
            
            if (primitiveTokens[type].length === 0) {
                const option = document.createElement('option');
                option.value = '';
                option.textContent = 'No primitives available';
                referenceSelect.appendChild(option);
                return;
            }
            
            primitiveTokens[type].forEach(token => {
                const option = document.createElement('option');
                option.value = token.name;
                option.textContent = `${token.name} (${token.value})`;
                referenceSelect.appendChild(option);
            });
        };
        
        document.getElementById('tokenType').addEventListener('change', updateReferenceOptions);
        updateReferenceOptions();
        
        // Handle form submission
        const handleSubmit = () => {
            const name = document.getElementById('tokenName').value.trim();
            const type = document.getElementById('tokenType').value;
            const referenceToken = document.getElementById('tokenReference').value;
            const folder = document.getElementById('tokenFolder').value;
            
            if (!name) {
                showNotification('Token name cannot be empty.', 'error');
                return;
            }
            
            if (!referenceToken) {
                showNotification('Please select a reference token.', 'error');
                return;
            }
            
            // Create the alias token with reference
            tokenManager.addToken('aliases', type, { 
                name, 
                value: `{${referenceToken}}`,
                category: type
            }, folder);
            
            modal.style.display = 'none';
        };
        
        submitBtn.onclick = handleSubmit;
        modal.style.display = 'block';
    });

    document.getElementById('add-component-token').addEventListener('click', () => {
        if (!tokenManager.activeClient) {
            showNotification('Please select a client first.', 'error');
            return;
        }
        
        // Get all alias tokens for reference
        const aliasTokens = {};
        ['colors', 'typography', 'spacing', 'sizing'].forEach(category => {
            aliasTokens[category] = tokenManager.getAllTokens('aliases', category);
        });
        
        // Check if there are any aliases to reference
        let hasAliases = false;
        for (const category in aliasTokens) {
            if (aliasTokens[category].length > 0) {
                hasAliases = true;
                break;
            }
        }
        
        if (!hasAliases) {
            showNotification('Create some alias tokens first.', 'error');
            return;
        }
        
        // Show the modal for adding a component token
        const modal = document.getElementById('addTokenModal');
        const modalTitle = modal.querySelector('h2');
        const submitBtn = document.getElementById('addTokenSubmit');
        
        modalTitle.textContent = 'Add Component Token';
        
        // Update the modal content for component tokens
        document.getElementById('tokenName').value = '';
        
        // Populate folder dropdown for tokens
        const folderSelect = document.getElementById('tokenFolder');
        folderSelect.innerHTML = '<option value="root">Root</option>';
        
        if (tokenManager.activeClient) {
            const client = tokenManager.clients[tokenManager.activeClient];
            if (client && client['tokens']) {
                const rootFolder = client['tokens'].root;
                
                // Add all folders as options with indentation
                const addFolderOptions = (folder, indent = '') => {
                    folder.children.forEach(childFolder => {
                        const option = document.createElement('option');
                        option.value = childFolder.id;
                        option.textContent = `${indent}${childFolder.name}`;
                        folderSelect.appendChild(option);
                        
                        // Add children with increased indent
                        addFolderOptions(childFolder, indent + '  ');
                    });
                };
                
                addFolderOptions(rootFolder);
                
                // Set the currently selected folder as default if it's in tokens level
                if (tokenManager.selectedFolderId && tokenManager.selectedFolderLevel === 'tokens') {
                    // Try to find the option with the selected folder ID
                    const options = Array.from(folderSelect.options);
                    const selectedOption = options.find(opt => opt.value === tokenManager.selectedFolderId);
                    if (selectedOption) {
                        selectedOption.selected = true;
                    }
                }
            }
        }
        
        // Show reference selection
        document.getElementById('colorValueGroup').style.display = 'none';
        document.getElementById('textValueGroup').style.display = 'none';
        document.getElementById('referenceValueGroup').style.display = 'block';
        
        // Populate reference dropdown based on selected type
        const updateReferenceOptions = () => {
            const type = document.getElementById('tokenType').value;
            const referenceSelect = document.getElementById('tokenReference');
            referenceSelect.innerHTML = '';
            
            if (aliasTokens[type].length === 0) {
                const option = document.createElement('option');
                option.value = '';
                option.textContent = 'No aliases available';
                referenceSelect.appendChild(option);
                return;
            }
            
            aliasTokens[type].forEach(token => {
                const option = document.createElement('option');
                option.value = token.name;
                option.textContent = `${token.name} (${token.value})`;
                referenceSelect.appendChild(option);
            });
        };
        
        document.getElementById('tokenType').addEventListener('change', updateReferenceOptions);
        updateReferenceOptions();
        
        // Handle form submission
        const handleSubmit = () => {
            const name = document.getElementById('tokenName').value.trim();
            const type = document.getElementById('tokenType').value;
            const referenceToken = document.getElementById('tokenReference').value;
            const folder = document.getElementById('tokenFolder').value;
            
            if (!name) {
                showNotification('Token name cannot be empty.', 'error');
                return;
            }
            
            if (!referenceToken) {
                showNotification('Please select a reference token.', 'error');
                return;
            }
            
            // Create the component token with reference
            tokenManager.addToken('tokens', type, { 
                name, 
                value: `{${referenceToken}}`,
                category: type
            }, folder);
            
            modal.style.display = 'none';
        };
        
        submitBtn.onclick = handleSubmit;
        modal.style.display = 'block';
    });

    // Modal cancellation
    document.getElementById('addTokenCancel').addEventListener('click', () => {
        document.getElementById('addTokenModal').style.display = 'none';
    });

    document.getElementById('addFolderCancel').addEventListener('click', () => {
        document.getElementById('addFolderModal').style.display = 'none';
    });

    // Token color picker synchronization
    document.getElementById('tokenColorPicker').addEventListener('input', (e) => {
        document.getElementById('tokenColorValue').value = e.target.value.toUpperCase();
    });

    document.getElementById('tokenColorValue').addEventListener('input', (e) => {
        const value = e.target.value;
        if (TokenValidator.validateColor(value)) {
            document.getElementById('tokenColorPicker').value = value;
        }
    });

    // Show Add Folder Modal
    const showAddFolderModal = () => {
        const modal = document.getElementById('addFolderModal');
        const activeLevel = document.querySelector('.level-tab.active').dataset.level;
        
        // Reset form
        document.getElementById('folderName').value = '';
        
        // Populate parent folder dropdown
        const parentFolderSelect = document.getElementById('parentFolder');
        parentFolderSelect.innerHTML = '<option value="root">Root</option>';
        
        // Get all folders in the active level
        if (tokenManager.activeClient) {
            const client = tokenManager.clients[tokenManager.activeClient];
            if (client && client[activeLevel]) {
                const rootFolder = client[activeLevel].root;
                
                // Add all folders as options
                const addFolderOptions = (folder, indent = '') => {
                    folder.children.forEach(childFolder => {
                        const option = document.createElement('option');
                        option.value = childFolder.id;
                        option.textContent = `${indent}${childFolder.name}`;
                        parentFolderSelect.appendChild(option);
                        
                        // Add children with increased indent
                        addFolderOptions(childFolder, indent + '  ');
                    });
                };
                
                addFolderOptions(rootFolder);
                
                // Set the currently selected folder as default
                if (tokenManager.selectedFolderId && tokenManager.selectedFolderLevel === activeLevel) {
                    // Try to find the option with the selected folder ID
                    const options = Array.from(parentFolderSelect.options);
                    const selectedOption = options.find(opt => opt.value === tokenManager.selectedFolderId);
                    if (selectedOption) {
                        selectedOption.selected = true;
                    }
                }
            }
        }
        
        modal.style.display = 'block';
    };
    
    // Add folder button in modal
    document.getElementById('addFolderSubmit').addEventListener('click', () => {
        const folderName = document.getElementById('folderName').value.trim();
        const parentFolder = document.getElementById('parentFolder').value;
        
        if (!folderName) {
            showNotification('Folder name cannot be empty.', 'error');
            return;
        }
        
        // Get current active level
        const activeLevel = document.querySelector('.level-tab.active').dataset.level;
        
        tokenManager.createFolder(activeLevel, parentFolder, folderName);
        document.getElementById('addFolderModal').style.display = 'none';
        showNotification(`Folder "${folderName}" created successfully.`);
    });
    
    // Add folder button in token container
    document.querySelectorAll('.token-level-section').forEach(section => {
        // Add a button to create folders
        const addFolderBtn = document.createElement('button');
        addFolderBtn.className = 'add-folder-btn';
        addFolderBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path><line x1="12" y1="11" x2="12" y2="17"></line><line x1="9" y1="14" x2="15" y2="14"></line></svg> Add Folder';
        
        addFolderBtn.addEventListener('click', showAddFolderModal);
        
        // Insert before the add token container
        const addTokenContainer = section.querySelector('.add-token-container');
        if (addTokenContainer) {
            addTokenContainer.insertBefore(addFolderBtn, addTokenContainer.firstChild);
        }
    });

    // Export functionality
    const exportBtn = document.getElementById('exportBtn');
    const exportModal = document.getElementById('exportModal');
    const closeExport = document.getElementById('closeExport');
    const copyExport = document.getElementById('copyExport');
    const exportFormat = document.getElementById('exportFormat');
    const exportOutput = document.getElementById('exportOutput');

    exportBtn.addEventListener('click', () => {
        if (!tokenManager.activeClient) {
            showNotification('Please select a client first.', 'error');
            return;
        }
        
        console.log('Opening export modal');
        exportModal.style.display = 'block';
        const format = exportFormat.value;
        console.log('Exporting tokens in format:', format);
        exportOutput.value = exportManager.exportTokens(format);
    });

    exportFormat.addEventListener('change', () => {
        exportOutput.value = exportManager.exportTokens(exportFormat.value);
    });

    closeExport.addEventListener('click', () => {
        exportModal.style.display = 'none';
    });

    copyExport.addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(exportOutput.value);
            showNotification('Tokens copied to clipboard!');
        } catch (err) {
            exportOutput.select();
            document.execCommand('copy');
            showNotification('Tokens copied to clipboard!');
        }
    });

    // Close modals when clicking outside
    window.addEventListener('click', (event) => {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        });
    });

    // Save button
    document.getElementById('saveBtn').addEventListener('click', async () => {
        if (!tokenManager.activeClient) {
            showNotification('Please select a client first.', 'error');
            return;
        }
        
        await tokenManager.saveTokens();
        showNotification('All changes saved successfully!');
    });
});