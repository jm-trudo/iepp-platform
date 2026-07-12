import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User } from '../models/user.model';
import { PaginatedResponse } from '../models/school.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly baseUrl = `${environment.apiUrl}/auth/users`;

  constructor(private http: HttpClient) {}

  creer(donnees: any): Observable<User> {
    return this.http.post<User>(`${this.baseUrl}/`, donnees);
  }

  liste(role?: string): Observable<PaginatedResponse<User>> {
    let params = new HttpParams();

    if (role) {
      params = params.set('role', role);
    }

    return this.http.get<PaginatedResponse<User>>(
      `${this.baseUrl}/`,
      { params }
    );
  }
}