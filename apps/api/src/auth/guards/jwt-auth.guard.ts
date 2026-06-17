import { Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

/**
 * Protects routes by validating the access-token JWT (read from the
 * HTTP-only cookie by JwtStrategy). Attaches the user to the request.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {}
