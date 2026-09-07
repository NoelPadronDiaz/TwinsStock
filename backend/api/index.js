"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = handler;
const core_1 = require("@nestjs/core");
const platform_express_1 = require("@nestjs/platform-express");
const express_1 = __importDefault(require("express"));
const app_module_1 = require("../src/app.module");
const configure_app_1 = require("../src/configure-app");
let cachedApp = null;
async function getApp() {
    if (!cachedApp) {
        const expressInstance = (0, express_1.default)();
        const app = await core_1.NestFactory.create(app_module_1.AppModule, new platform_express_1.ExpressAdapter(expressInstance));
        (0, configure_app_1.configureApp)(app);
        await app.init();
        cachedApp = expressInstance;
    }
    return cachedApp;
}
async function handler(req, res) {
    const app = await getApp();
    app(req, res);
}
//# sourceMappingURL=index.js.map