"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const auth_service_1 = require("./auth.service");
const origin_guard_1 = require("../common/origin.guard");
const crypto_1 = require("./crypto");
let AuthController = class AuthController {
    constructor(auth) {
        this.auth = auth;
    }
    setAuthCookies(res, accessToken, refreshToken) {
        const { AT_COOKIE, RT_COOKIE } = this.auth.cookies();
        const baseAttrs = this.auth.createCookieAttrs("/");
        // Access token cookie
        res.append("Set-Cookie", (0, crypto_1.serializeSetCookie)(AT_COOKIE, accessToken, {
            ...baseAttrs,
            path: "/",
            maxAge: Number(process.env.ACCESS_TTL_SEC ?? 900),
        }));
        // Refresh token cookie (restricted path for Step 4 refresh endpoint)
        res.append("Set-Cookie", (0, crypto_1.serializeSetCookie)(RT_COOKIE, refreshToken, {
            ...baseAttrs,
            path: "/auth/refresh",
            maxAge: Number(process.env.REFRESH_TTL_SEC ?? 1209600),
        }));
    }
    async signup(body, req, res) {
        try {
            const { user, accessToken, refreshToken } = await this.auth.signup({ email: body.email, name: body.name, password: body.password }, req.headers["user-agent"]);
            this.setAuthCookies(res, accessToken, refreshToken);
            return res.status(201).json({ user });
        }
        catch {
            return res.status(400).json({ error: "Invalid input" });
        }
    }
    async signin(body, req, res) {
        try {
            const { user, accessToken, refreshToken } = await this.auth.signin({ email: body.email, password: body.password }, req.headers["user-agent"]);
            this.setAuthCookies(res, accessToken, refreshToken);
            return res.json({ user });
        }
        catch {
            return res.status(401).json({ error: "Invalid email or password" });
        }
    }
    async me(req, res) {
        try {
            const { AT_COOKIE } = this.auth.cookies();
            const at = req.cookies?.[AT_COOKIE] ?? "";
            if (!at)
                return res.status(401).json({ error: "Unauthorized" });
            const payload = (0, crypto_1.verifyToken)(at, process.env.TOKEN_SECRET, {
                iss: process.env.TOKEN_ISS ?? "api",
                aud: process.env.TOKEN_AUD ?? "web",
            });
            return res.json({ userId: payload.sub });
        }
        catch {
            return res.status(401).json({ error: "Unauthorized" });
        }
    }
    async logout(req, res) {
        const { AT_COOKIE, RT_COOKIE } = this.auth.cookies();
        try {
            const rt = req.cookies?.[RT_COOKIE] ?? "";
            if (rt) {
                await this.auth.logoutByRefreshToken(rt);
            }
        }
        catch {
            // swallow errors — logout should always succeed
        }
        res.append("Set-Cookie", (0, crypto_1.clearCookie)(AT_COOKIE, "/"));
        res.append("Set-Cookie", (0, crypto_1.clearCookie)(RT_COOKIE, "/auth/refresh"));
        return res.json({ ok: true });
    }
    async refresh(req, res) {
        try {
            const { RT_COOKIE } = this.auth.cookies();
            const rt = req.cookies?.[RT_COOKIE] ?? "";
            const { accessToken, refreshToken } = await this.auth.refreshSession(rt);
            this.setAuthCookies(res, accessToken, refreshToken);
            return res.status(200).json({ ok: true });
        }
        catch {
            const { AT_COOKIE, RT_COOKIE } = this.auth.cookies();
            res.append("Set-Cookie", (0, crypto_1.clearCookie)(AT_COOKIE, "/"));
            res.append("Set-Cookie", (0, crypto_1.clearCookie)(RT_COOKIE, "/auth/refresh"));
            return res.status(401).json({ error: "Unauthorized" });
        }
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Post)("signup"),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "signup", null);
__decorate([
    (0, common_1.Post)("signin"),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "signin", null);
__decorate([
    (0, common_1.Get)("me"),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "me", null);
__decorate([
    (0, common_1.Post)("logout"),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "logout", null);
__decorate([
    (0, common_1.Post)("refresh"),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "refresh", null);
exports.AuthController = AuthController = __decorate([
    (0, common_1.UseGuards)(origin_guard_1.OriginGuard),
    (0, common_1.Controller)("auth"),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], AuthController);
