import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AdminUserSummary {
  id: number;
  email: string;
  fullName: string;
  role: 'CLIENT' | 'AGENT' | 'ADMIN';
  active: boolean;
  createdAt: string;
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly baseUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) { }

  getAdminUsers(): Observable<AdminUserSummary[]> {
    const url = `${this.baseUrl}/api/admin/users`;
    // Backend returns List<UserDto>, not Page. Removing pagination params for now.
    return this.http.get<AdminUserSummary[]>(url);
  }

  enableUser(userId: number) {
    const url = `${this.baseUrl}/api/admin/activate/${userId}`;
    return this.http.put<void>(url, {});
  }

  disableUser(userId: number) {
    // Backend missing disable endpoint. Only activate exists.
    console.warn('disableUser endpoint missing in backend');
    return new Observable<void>((observer) => {
      observer.next();
      observer.complete();
    });
  }

  updateUserRole(
    userId: number,
    role: 'CLIENT' | 'AGENT' | 'ADMIN'
  ) {
    const url = `${this.baseUrl}/api/admin/manage-role/${userId}/role`;
    const roleParam = role.startsWith('ROLE_') ? role : `ROLE_${role}`;
    const params = new HttpParams().set('role', roleParam);
    return this.http.put<void>(url, {}, { params });
  }
}