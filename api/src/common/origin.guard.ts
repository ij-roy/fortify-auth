import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import type { Request } from "express";

@Injectable()
export class OriginGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest<Request>();
    const method = req.method.toUpperCase();

    // Only guard state-changing methods
    if (!["POST", "PUT", "PATCH", "DELETE"].includes(method)) return true;

    const origin = (req.headers.origin as string | undefined) ?? "";
    const allowed = (process.env.ALLOWED_ORIGINS ?? "http://localhost:3000")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    // If no origin header (curl/postman), allow in dev only
    if (!origin) return process.env.NODE_ENV !== "production";

    return allowed.includes(origin);
  }
}