import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { School, Sector, PaginatedResponse } from '../models/school.model';


@Injectable({
  providedIn: 'root'
})
export class SchoolService {

  private readonly baseUrl = `${environment.apiUrl}/schools`;


  constructor(
    private http: HttpClient
  ) {}


  /**
   * Liste des écoles avec recherche optionnelle
   */
  liste(recherche?: string): Observable<PaginatedResponse<School>> {

    let params = new HttpParams();


    if (recherche) {
      params = params.set('search', recherche);
    }


    return this.http.get<PaginatedResponse<School>>(
      `${this.baseUrl}/`,
      { params }
    );
  }



  /**
   * Récupérer une école par son identifiant
   */
  obtenir(id: number): Observable<School> {

    return this.http.get<School>(
      `${this.baseUrl}/${id}/`
    );

  }



  /**
   * Créer une nouvelle école
   */
  creer(donnees: Partial<School>): Observable<School> {

    return this.http.post<School>(
      `${this.baseUrl}/`,
      donnees
    );

  }



  /**
   * Modifier une école existante
   */
  modifier(
    id: number,
    donnees: Partial<School>
  ): Observable<School> {

    return this.http.patch<School>(
      `${this.baseUrl}/${id}/`,
      donnees
    );

  }



  /**
   * Supprimer une école
   */
  supprimer(id: number): Observable<void> {

    return this.http.delete<void>(
      `${this.baseUrl}/${id}/`
    );

  }



  /**
   * Liste des secteurs pédagogiques
   */
  listeSecteurs(): Observable<PaginatedResponse<Sector>> {

    return this.http.get<PaginatedResponse<Sector>>(
      `${this.baseUrl}/sectors/`
    );

  }

}