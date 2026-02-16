"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthModule = void 0;
const common_1 = require("@nestjs/common");
const db_module_1 = require("../db/db.module");
const auth_controller_1 = require("./auth.controller");
const auth_service_1 = require("./auth.service");
const users_repo_1 = require("./repos/users.repo");
const sessions_repo_1 = require("./repos/sessions.repo");
const refresh_repo_1 = require("./repos/refresh.repo");
let AuthModule = class AuthModule {
};
exports.AuthModule = AuthModule;
exports.AuthModule = AuthModule = __decorate([
    (0, common_1.Module)({
        imports: [db_module_1.DbModule],
        controllers: [auth_controller_1.AuthController],
        providers: [auth_service_1.AuthService, users_repo_1.UsersRepo, sessions_repo_1.SessionsRepo, refresh_repo_1.RefreshRepo],
    })
], AuthModule);
