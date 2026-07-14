import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthorizationRequest } from '../models/authorization.model';
import { PaginatedResponse } from '../models/school.model';

@Injectable({
  providedIn: 'root'
})
export class AuthorizationService {
  private readonly baseUrl = `${environment.apiUrl}/authorizations`;

  constructor(private http: HttpClient) {}

  liste(statut?: string): Observable<PaginatedResponse<AuthorizationRequest>> {
    let params = new HttpParams();

    if (statut) {
      params = params.set('statut', statut);
    }

    return this.http.get<PaginatedResponse<AuthorizationRequest>>(
      `${this.baseUrl}/`,
      { params }
    );
  }

  creer(donnees: Partial<AuthorizationRequest>): Observable<AuthorizationRequest> {
    return this.http.post<AuthorizationRequest>(
      `${this.baseUrl}/`,
      donnees
    );
  }

  accepter(id: number, commentaire: string): Observable<AuthorizationRequest> {
    return this.http.post<AuthorizationRequest>(
      `${this.baseUrl}/${id}/accepter/`,
      { commentaire }
    );
  }

  refuser(id: number, commentaire: string): Observable<AuthorizationRequest> {
    return this.http.post<AuthorizationRequest>(
      `${this.baseUrl}/${id}/refuser/`,
      { commentaire }
    );
  }

  telechargerPdf(id: number): Observable<Blob> {
    return this.http.get(
      `${this.baseUrl}/${id}/pdf/`,
      {
        responseType: 'blob'
      }
    );
  }
}