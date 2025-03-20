class ExportManager {
    constructor(tokenManager) {
        this.tokenManager = tokenManager;
        console.log('ExportManager initialized');
    }

    exportTokens(format) {
        console.log('Starting token export in format:', format);
        try {
            if (!this.tokenManager.activeClient) {
                throw new Error('Please select a client first');
            }

            let result;
            switch (format) {
                case 'css':
                    result = this.exportAsCSS();
                    break;
                case 'scss':
                    result = this.exportAsSCSS();
                    break;
                case 'json':
                    result = this.exportAsJSON();
                    break;
                default:
                    throw new Error(`Unsupported export format: ${format}`);
            }
            console.log(`Successfully exported tokens as ${format}`);
            return result;
        } catch (error) {
            console.error('Error exporting tokens:', error);
            return `Error exporting tokens: ${error.message}`;
        }
    }

    // Collect all tokens from folder structure
    getAllTokensInCategory(level, category) {
        console.log(`Getting all tokens for export: ${level}.${category}`);
        
        if (!this.tokenManager.activeClient) {
            console.warn('No active client selected');
            return [];
        }
        
        const clientData = this.tokenManager.clients[this.tokenManager.activeClient];
        if (!clientData || !clientData[level]) {
            console.warn(`Invalid level: ${level}`);
            return [];
        }
        
        // Get all tokens of the specified category
        const allTokens = this.collectTokensFromFolder(clientData[level].root);
        return allTokens.filter(token => token.category === category);
    }
    
    collectTokensFromFolder(folder) {
        let tokens = [...(folder.tokens || [])];
        
        if (Array.isArray(folder.children)) {
            folder.children.forEach(child => {
                tokens = tokens.concat(this.collectTokensFromFolder(child));
            });
        }
        
        return tokens;
    }

    exportAsCSS() {
        console.log('Generating CSS export');
        let css = `:root {\n  /* Generated for client: ${this.tokenManager.activeClient} */\n`;

        // Export primitives
        css += '\n  /* Primitive Values */\n';
        ['colors', 'typography', 'spacing', 'sizing'].forEach(category => {
            const tokens = this.getAllTokensInCategory('primitives', category);
            if (tokens.length > 0) {
                css += `\n  /* ${category.charAt(0).toUpperCase() + category.slice(1)} */\n`;
                tokens.forEach(token => {
                    css += `  --${token.name}: ${token.value};\n`;
                });
            }
        });

        // Export aliases
        css += '\n  /* Aliases */\n';
        ['colors', 'typography', 'spacing', 'sizing'].forEach(category => {
            const tokens = this.getAllTokensInCategory('aliases', category);
            if (tokens.length > 0) {
                css += `\n  /* ${category.charAt(0).toUpperCase() + category.slice(1)} */\n`;
                tokens.forEach(token => {
                    // Replace references to primitives with their values
                    const value = this.resolveValue(token.value, 'primitives', category);
                    css += `  --${token.name}: ${value};\n`;
                });
            }
        });

        // Export tokens
        css += '\n  /* Component Tokens */\n';
        ['colors', 'typography', 'spacing', 'sizing'].forEach(category => {
            const tokens = this.getAllTokensInCategory('tokens', category);
            if (tokens.length > 0) {
                css += `\n  /* ${category.charAt(0).toUpperCase() + category.slice(1)} */\n`;
                tokens.forEach(token => {
                    // Replace references to aliases with their resolved values
                    const value = this.resolveValue(token.value, 'aliases', category);
                    css += `  --${token.name}: ${value};\n`;
                });
            }
        });

        css += '}';
        return css;
    }

    exportAsSCSS() {
        console.log('Generating SCSS export');
        let scss = `// Generated for client: ${this.tokenManager.activeClient}\n\n`;

        // Export primitives
        scss += '// Primitive Values\n';
        ['colors', 'typography', 'spacing', 'sizing'].forEach(category => {
            const tokens = this.getAllTokensInCategory('primitives', category);
            if (tokens.length > 0) {
                scss += `\n// ${category.charAt(0).toUpperCase() + category.slice(1)}\n`;
                tokens.forEach(token => {
                    scss += `$${token.name}: ${token.value};\n`;
                });
            }
        });

        // Export aliases
        scss += '\n// Aliases\n';
        ['colors', 'typography', 'spacing', 'sizing'].forEach(category => {
            const tokens = this.getAllTokensInCategory('aliases', category);
            if (tokens.length > 0) {
                scss += `\n// ${category.charAt(0).toUpperCase() + category.slice(1)} Aliases\n`;
                tokens.forEach(token => {
                    const value = this.resolveValue(token.value, 'primitives', category);
                    scss += `$${token.name}: ${value};\n`;
                });
            }
        });

        // Export tokens
        scss += '\n// Component Tokens\n';
        ['colors', 'typography', 'spacing', 'sizing'].forEach(category => {
            const tokens = this.getAllTokensInCategory('tokens', category);
            if (tokens.length > 0) {
                scss += `\n// ${category.charAt(0).toUpperCase() + category.slice(1)} Tokens\n`;
                tokens.forEach(token => {
                    const value = this.resolveValue(token.value, 'aliases', category);
                    scss += `$${token.name}: ${value};\n`;
                });
            }
        });

        return scss;
    }

    exportAsJSON() {
        console.log('Generating JSON export');
        
        // Create a modified structure that's more suitable for export
        const exportData = {
            client: this.tokenManager.activeClient,
            primitives: {},
            aliases: {},
            tokens: {}
        };
        
        // Export all categories
        ['colors', 'typography', 'spacing', 'sizing'].forEach(category => {
            // Add primitives
            exportData.primitives[category] = this.getAllTokensInCategory('primitives', category);
            
            // Add aliases
            exportData.aliases[category] = this.getAllTokensInCategory('aliases', category);
            
            // Add tokens
            exportData.tokens[category] = this.getAllTokensInCategory('tokens', category);
        });
        
        return JSON.stringify(exportData, null, 2);
    }

    resolveValue(value, level, category) {
        if (!value.startsWith('{') || !value.endsWith('}')) {
            return value;
        }

        const refName = value.slice(1, -1);
        const tokens = this.getAllTokensInCategory(level, category);
        const token = tokens.find(t => t.name === refName);

        if (!token) {
            console.warn(`Reference not found: ${value}`);
            return value;
        }

        if (level === 'primitives') {
            return token.value;
        } else {
            return this.resolveValue(token.value, 'primitives', category);
        }
    }
}