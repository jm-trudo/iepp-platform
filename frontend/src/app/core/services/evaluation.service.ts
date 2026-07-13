import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Note } from '../models/evaluation.model';
import { PaginatedResponse } from '../models/school.model';

export interface EntreeNoteGroupee {
  eleve: number;
  valeur: number;
}

export interface SaisieGroupeePayload {
  classe: number;
  matiere: string;
  composition: string;
  annee_scolaire: string;
  notes: EntreeNoteGroupee[];
}

@Injectable({ providedIn: 'root' })
export class EvaluationService {
  private readonly baseUrl = `${environment.apiUrl}/evaluations`;

  constructor(private http: HttpClient) {}

  liste(filtres: { classe?: number; matiere?: string; composition?: string; annee_scolaire?: string }): Observable<PaginatedResponse<Note>> {
    const params: Record<string, string> = {};
    if (filtres.classe) params['classe'] = String(filtres.classe);
    if (filtres.matiere) params['matiere'] = filtres.matiere;
    if (filtres.composition) params['composition'] = filtres.composition;
    if (filtres.annee_scolaire) params['annee_scolaire'] = filtres.annee_scolaire;
    return this.http.get<PaginatedResponse<Note>>(`${this.baseUrl}/`, { params });
  }

  saisieGroupee(payload: SaisieGroupeePayload): Observable<Note[]> {
    return this.http.post<Note[]>(`${this.baseUrl}/saisie-groupee/`, payload);
  }
}