class TokenValidator {
    static validateColor(value) {
        console.log('Validating color value:', value);
        // Accept both hex colors and references
        if (value.startsWith('{') && value.endsWith('}')) {
            console.log('Color validation passed: reference format');
            return true;  // Allow references to be validated separately
        }
        const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
        const isValid = colorRegex.test(value);
        console.log('Color validation result:', isValid, 'for value:', value);
        return isValid;
    }

    static validateTypography(value) {
        console.log('Validating typography value:', value);
        if (value.startsWith('{') && value.endsWith('}')) {
            return true;  // Allow references to be validated separately
        }

        // Accept any non-empty string for now, could be enhanced with more specific validation
        const isValid = value && value.length > 0;
        console.log('Typography validation result:', isValid, 'for value:', value);
        return isValid;
    }

    static validateSpacing(value) {
        console.log('Validating spacing value:', value);
        if (value.startsWith('{') && value.endsWith('}')) {
            return true;  // Allow references to be validated separately
        }
        const spacingRegex = /^-?\d*\.?\d+(%|px|rem|em)$/;
        const isValid = spacingRegex.test(value);
        console.log('Spacing validation result:', isValid, 'for value:', value);
        return isValid;
    }

    static validateSizing(value) {
        console.log('Validating sizing value:', value);
        if (value.startsWith('{') && value.endsWith('}')) {
            return true;  // Allow references to be validated separately
        }
        const sizingRegex = /^-?\d*\.?\d+(%|px|rem|em)$/;
        const isValid = sizingRegex.test(value);
        console.log('Sizing validation result:', isValid, 'for value:', value);
        return isValid;
    }

    static validateTokenName(name) {
        console.log('Validating token name:', name);
        if (!name || typeof name !== 'string') {
            console.log('Token name validation failed: invalid input type or empty');
            return false;
        }

        // Token names must:
        // 1. Start with a letter
        // 2. Contain only letters, numbers, and hyphens
        // 3. Not be empty
        const nameRegex = /^[a-zA-Z][a-zA-Z0-9-]*$/;
        const isValid = nameRegex.test(name);
        console.log('Token name validation result:', isValid, 'for name:', name);
        return isValid;
    }
}