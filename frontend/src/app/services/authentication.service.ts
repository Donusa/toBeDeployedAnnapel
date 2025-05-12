import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthenticationRequest } from '../../request/authenticationRequest.interface';
import { JwtResponse } from '../../responses/jwtResponse.interface';


@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {
  private apiUrl = `${environment.apiUrl}${environment.endpoints.auth.base}`;

  constructor(private http: HttpClient) {}

  login(request: AuthenticationRequest): Observable<JwtResponse> {
    return new Observable<JwtResponse>(observer => {
      this.http.post<JwtResponse>(`${this.apiUrl}${environment.endpoints.auth.signin}`, request)
        .subscribe({
          next: (response) => {
            localStorage.setItem('token', response.token);
            localStorage.setItem('type', response.type);
            localStorage.setItem('id', response.id.toString());
            localStorage.setItem('username', response.username);
            localStorage.setItem('email', response.email);
            localStorage.setItem('role', response.role);
            localStorage.setItem('commissionPercentage', response.commissionPercentage?.toString() || '0');
            
            observer.next(response);
            observer.complete();
          },
          error: (error) => {
            console.error('Error en la autenticación:', error);
            observer.error(error);
          }
        });
    });
  }
  isAuthenticated(): boolean {
    const token = localStorage.getItem('token');
    return !!token;
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isAdmin(): boolean {
    const role = localStorage.getItem('role');
    return role === 'ADMIN';
  }
 getCurrentRole(): string {
  return localStorage.getItem('role') || '';
 }

 getCurrentUser(): any {
    return {
      id: Number(localStorage.getItem('id')),
      username: localStorage.getItem('username'),
      email: localStorage.getItem('email'),
      role: localStorage.getItem('role'),
      commissionPercentage: Number(localStorage.getItem('commissionPercentage'))
    };
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('type');
    localStorage.removeItem('id');
    localStorage.removeItem('username');
    localStorage.removeItem('email');
    localStorage.removeItem('role');
    localStorage.removeItem('commissionPercentage');
  }

}