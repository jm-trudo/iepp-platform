import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Student } from '../models/student.model';
import { PaginatedResponse } from '../models/school.model';

@Injectable({ providedIn: 'root' })
export class StudentService {
  private readonly baseUrl = `${environment.apiUrl}/students`;

  constructor(private http: HttpClient) {}

  liste(recherche?: string, classeId?: number): Observable<PaginatedResponse<Student>> {
    let params: Record<string, string> = {};
    if (recherche) {
      params = { ...params, search: recherche };
    }
    if (classeId) {
      params = { ...params, classe: String(classeId) };
    }
    return this.http.get<PaginatedResponse<Student>>(`${this.baseUrl}/`, { params });
  }

  obtenir(id: number): Observable<Student> {
    return this.http.get<Student>(`${this.baseUrl}/${id}/`);
  }

  creer(donnees: Partial<Student>): Observable<Student> {
    return this.http.post<Student>(`${this.baseUrl}/`, donnees);
  }

  modifier(id: number, donnees: Partial<Student>): Observable<Student> {
    return this.http.patch<Student>(`${this.baseUrl}/${id}/`, donnees);
  }

  supprimer(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}/`);
  }
}