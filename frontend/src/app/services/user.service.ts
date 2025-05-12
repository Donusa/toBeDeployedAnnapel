import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { UserResponse } from '../../responses/userResponse.interface';
import { SignupRequest } from 'src/request/signupRequest.interface';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = `${environment.apiUrl}${environment.endpoints.users.base}`;

  constructor(private http: HttpClient) {}


  createUser(SignupRequest: SignupRequest): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}${environment.endpoints.users.create}`, SignupRequest);
  }
  
  getUsers(): Observable<UserResponse[]> {
    return this.http.get<UserResponse[]>(`${this.apiUrl}${environment.endpoints.users.getAll}`);
  }

  updateUser(id: number, user: UserResponse): Observable<UserResponse> {
    const url = `${this.apiUrl}${environment.endpoints.users.update.replace('{id}', id.toString())}`;
    return this.http.put<UserResponse>(url, user);
  }

  deleteUser(id: number): Observable<any> {
    const url = `${this.apiUrl}${environment.endpoints.users.update.replace('{id}', id.toString())}`;
    return this.http.delete<UserResponse>(url);
  }
}