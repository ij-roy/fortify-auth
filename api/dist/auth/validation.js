"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeEmail = normalizeEmail;
exports.isValidEmail = isValidEmail;
exports.isValidPassword = isValidPassword;
exports.isValidName = isValidName;
function normalizeEmail(email) {
    return email.trim().toLowerCase();
}
function isValidEmail(email) {
    if (!email)
        return false;
    if (email.length > 254)
        return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
function isValidPassword(pw) {
    if (!pw)
        return false;
    if (pw.length < 8)
        return false;
    if (pw.length > 72)
        return false;
    const hasLetter = /[A-Za-z]/.test(pw);
    const hasNumber = /\d/.test(pw);
    return hasLetter && hasNumber;
}
function isValidName(name) {
    if (!name)
        return false;
    const n = name.trim();
    return n.length >= 2 && n.length <= 60;
}
