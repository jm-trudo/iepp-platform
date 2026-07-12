import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Classe } from '../models/classe.model';
import { Teacher } from '../models/teacher.model';
import { PaginatedResponse } from '../models/school.model';

@Injectable({
  providedIn: 'root'
})
export class TeacherService {

  private readonly baseUrl = `${environment.apiUrl}/teachers`;

  constructor(private http: HttpClient) {}

  // ==========================
  // Classes
  // ==========================

  listeClasses(ecoleId?: number): Observable<PaginatedResponse<Classe>> {
    let params: Record<string, string> = {};
    if (ecoleId) {
      params = { ecole: String(ecoleId) };
    }
    return this.http.get<PaginatedResponse<Classe>>(`${this.baseUrl}/classes/`, { params });
  }

  obtenirClasse(id: number): Observable<Classe> {
    return this.http.get<Classe>(
      `${this.baseUrl}/classes/${id}/`
    );
  }

  creerClasse(donnees: Partial<Classe>): Observable<Classe> {
    return this.http.post<Classe>(
      `${this.baseUrl}/classes/`,
      donnees
    );
  }

  modifierClasse(
    id: number,
    donnees: Partial<Classe>
  ): Observable<Classe> {
    return this.http.patch<Classe>(
      `${this.baseUrl}/classes/${id}/`,
      donnees
    );
  }

  supprimerClasse(id: number): Observable<void> {
    return this.http.delete<void>(
      `${this.baseUrl}/classes/${id}/`
    );
  }

  // ==========================
  // Enseignants
  // ==========================

  listeEnseignants(): Observable<PaginatedResponse<Teacher>> {
    return this.http.get<PaginatedResponse<Teacher>>(
      `${this.baseUrl}/`
    );
  }

  obtenirEnseignant(id: number): Observable<Teacher> {
    return this.http.get<Teacher>(
      `${this.baseUrl}/${id}/`
    );
  }

  modifierEnseignant(
    id: number,
    donnees: any
  ): Observable<Teacher> {
    return this.http.patch<Teacher>(
      `${this.baseUrl}/${id}/`,
      donnees
    );
  }

}