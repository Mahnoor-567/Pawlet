const PASSWORD_RULES = [
    { test: (p) => p.length >= 8, message: 'Password must be at least 8 characters' },
    { test: (p) => /[A-Z]/.test(p), message: 'Password must contain at least one uppercase letter' },
    { test: (p) => /[a-z]/.test(p), message: 'Password must contain at least one lowercase letter' },
    { test: (p) => /[0-9]/.test(p), message: 'Password must contain at least one number' },
    { test: (p) => /[^A-Za-z0-9]/.test(p), message: 'Password must contain at least one special character' },
];

const validatePassword = (password) => {
    const errors = PASSWORD_RULES.filter((rule) => !rule.test(password)).map((rule) => rule.message);
    return { isValid: errors.length === 0, errors };
};

module.exports = { validatePassword, PASSWORD_RULES };
