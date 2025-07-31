import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy } from "passport-custom";
import { AuthService } from "../auth.service";
import { UserType } from "../../database/models/user.model";
import * as jwt from "jsonwebtoken";

@Injectable()
export class CognitoStrategy extends PassportStrategy(Strategy, "cognito") {
  constructor(private authService: AuthService) {
    super();
  }

  async validate(req: any): Promise<any> {
    const token = this.extractTokenFromHeader(req);

    if (!token) {
      throw new UnauthorizedException("No token provided");
    }

    try {
      // Decode the JWT to extract custom:user_type (not verifying, just decoding)
      const payload = jwt.decode(token) as any;
      if (!payload) {
        throw new UnauthorizedException("Invalid token payload");
      }

      const userType = payload["custom:user_type"] as UserType;
      if (!userType || ![UserType.ADMIN, UserType.VENDOR, UserType.CUSTOMER].includes(userType)) {
        throw new UnauthorizedException("Invalid or missing user type in token");
      }

      const user = await this.authService.validateUser(token, userType);
      if (!user) {
        throw new UnauthorizedException("User validation failed");
      }
      return user;
    } catch (error) {
      throw new UnauthorizedException("Invalid token");
    }
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(" ") ?? [];
    return type === "Bearer" ? token : undefined;
  }
}

// import { Injectable, UnauthorizedException } from '@nestjs/common';
// import { PassportStrategy } from '@nestjs/passport';
// import { Strategy } from 'passport-custom';
// import { AuthService } from '../auth.service';

// @Injectable()
// export class CognitoStrategy extends PassportStrategy(Strategy, 'cognito') {
//   constructor(private authService: AuthService) {
//     super();
//   }

//   async validate(req: any): Promise<any> {
//     const token = this.extractTokenFromHeader(req);

//     if (!token) {
//       throw new UnauthorizedException('No token provided');
//     }

//     try {
//       const user = await this.authService.validateUser(token);
//       return user;
//     } catch (error) {
//       throw new UnauthorizedException('Invalid token');
//     }
//   }

//   private extractTokenFromHeader(request: any): string | undefined {
//     const [type, token] = request.headers.authorization?.split(' ') ?? [];
//     return type === 'Bearer' ? token : undefined;
//   }
// }
