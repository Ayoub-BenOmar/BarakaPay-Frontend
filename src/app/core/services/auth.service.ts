import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, map } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AuthResponse {
  token: string;
  roles?: string[];
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface DecodedToken {
  sub: string;
  iat?: number;
  exp?: number;
  roles?: string[];
}

/**
 * Service d'authentification 
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly TOKEN_KEY = 'albaraka_token';

  private readonly apiUrl = `${environment.apiBaseUrl}/api/auth/login`;

  constructor(
    private http: HttpClient,
    private router: Router
  ) { }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post(this.apiUrl, credentials, { responseType: 'text' }).pipe(
      map((responseBody) => {
        let token = responseBody;
        try {
          // Try to parse as JSON in case backend returns { "token": "..." } or "..."
          const json = JSON.parse(responseBody);
          if (typeof json === 'object' && json !== null && json.token) {
            token = json.token;
          } else if (typeof json === 'string') {
            token = json;
          }
        } catch (e) {
          // Not JSON, assume raw string token
        }

        const response: AuthResponse = { token };
        this.storeToken(token);
        return response;
      })
    );
  }


  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    this.router.navigate(['/auth']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  getDecodedToken(): DecodedToken | null {
    const token = this.getToken();
    if (!token) {
      return null;
    }

    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    try {
      const payload = atob(parts[1]);
      return JSON.parse(payload) as DecodedToken;
    } catch {
      return null;
    }
  }

  getRolesFromToken(): string[] {
    const decoded = this.getDecodedToken();
    if (!decoded) {
      return [];
    }

    console.log('Decoded Token:', decoded); // Debugging

    const roles: string[] = [];

    // Check for 'roles' (array)
    if (Array.isArray(decoded.roles)) {
      roles.push(...decoded.roles);
    }

    // Check for 'authorities' (Spring Security default)
    const anyDecoded = decoded as any;
    if (Array.isArray(anyDecoded.authorities)) {
      anyDecoded.authorities.forEach((a: any) => {
        if (typeof a === 'string') roles.push(a);
        else if (typeof a === 'object' && a.authority) roles.push(a.authority);
        else roles.push(String(a));
      });
    }

    // Check for single 'role' (string)
    if (anyDecoded.role && typeof anyDecoded.role === 'string') {
      roles.push(anyDecoded.role);
    }

    // Normalize roles (remove ROLE_ prefix if present) and dedup
    return [...new Set(roles.map(r => r.startsWith('ROLE_') ? r.substring(5) : r))];
  }

  private storeToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }
}