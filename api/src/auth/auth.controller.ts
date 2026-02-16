import { Body, Controller, Get, Post, Req, Res } from "@nestjs/common";
import type { Request, Response } from "express";
import { AuthService } from "./auth.service";
import { serializeSetCookie, clearCookie, verifyToken } from "./crypto";

@Controller("auth")
export class AuthController {
  constructor(private auth: AuthService) {}

  private setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
    const { AT_COOKIE, RT_COOKIE } = this.auth.cookies();
    const baseAttrs = this.auth.createCookieAttrs("/");

    // Access token cookie
    res.append(
      "Set-Cookie",
      serializeSetCookie(AT_COOKIE, accessToken, {
        ...baseAttrs,
        path: "/",
        maxAge: Number(process.env.ACCESS_TTL_SEC ?? 900),
      })
    );

    // Refresh token cookie (restricted path for Step 4 refresh endpoint)
    res.append(
      "Set-Cookie",
      serializeSetCookie(RT_COOKIE, refreshToken, {
        ...baseAttrs,
        path: "/auth/refresh",
        maxAge: Number(process.env.REFRESH_TTL_SEC ?? 1209600),
      })
    );
  }

  @Post("signup")
  async signup(@Body() body: any, @Req() req: Request, @Res() res: Response) {
    try {
      const { user, accessToken, refreshToken } = await this.auth.signup(
        { email: body.email, name: body.name, password: body.password },
        req.headers["user-agent"] as string | undefined
      );
      this.setAuthCookies(res, accessToken, refreshToken);
      return res.status(201).json({ user });
    } catch {
      return res.status(400).json({ error: "Invalid input" });
    }
  }

  @Post("signin")
  async signin(@Body() body: any, @Req() req: Request, @Res() res: Response) {
    try {
      const { user, accessToken, refreshToken } = await this.auth.signin(
        { email: body.email, password: body.password },
        req.headers["user-agent"] as string | undefined
      );
      this.setAuthCookies(res, accessToken, refreshToken);
      return res.json({ user });
    } catch {
      return res.status(401).json({ error: "Invalid email or password" });
    }
  }

  @Get("me")
  async me(@Req() req: Request, @Res() res: Response) {
    try {
      const { AT_COOKIE } = this.auth.cookies();
      const at = (req.cookies?.[AT_COOKIE] as string) ?? "";
      if (!at) return res.status(401).json({ error: "Unauthorized" });

      const payload = verifyToken(at, process.env.TOKEN_SECRET!, {
        iss: process.env.TOKEN_ISS ?? "api",
        aud: process.env.TOKEN_AUD ?? "web",
      });

      return res.json({ userId: payload.sub });
    } catch {
      return res.status(401).json({ error: "Unauthorized" });
    }
  }

  @Post("logout")
  async logout(@Req() req: Request, @Res() res: Response) {
    const { AT_COOKIE, RT_COOKIE } = this.auth.cookies();

    // Step 3: clear cookies (DB revoke logic comes Step 3.7/3.8 wiring; Step 4 improves)
    res.append("Set-Cookie", clearCookie(AT_COOKIE, "/"));
    res.append("Set-Cookie", clearCookie(RT_COOKIE, "/auth/refresh"));
    return res.status(200).json({ ok: true });
  }
}