import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login.component').then((m) => m.LoginComponent),
  },

  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./shared/components/main-layout.component').then(
        (m) => m.MainLayoutComponent
      ),

    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then(
            (m) => m.DashboardComponent
          ),
      },

      {
        path: 'schools',
        loadComponent: () =>
          import('./features/schools/school-list.component').then(
            (m) => m.SchoolListComponent
          ),
      },

      {
        path: 'schools/nouveau',
        loadComponent: () =>
          import('./features/schools/school-form.component').then(
            (m) => m.SchoolFormComponent
          ),
      },

      {
        path: 'schools/:id',
        loadComponent: () =>
          import('./features/schools/school-form.component').then(
            (m) => m.SchoolFormComponent
          ),
      },

      {
        path: 'classes',
        loadComponent: () =>
          import('./features/teachers/classe-list.component').then((m) => m.ClasseListComponent),
      },
      {
        path: 'classes/nouveau',
        loadComponent: () =>
          import('./features/teachers/classe-form.component').then((m) => m.ClasseFormComponent),
      },
      {
        path: 'classes/:id',
        loadComponent: () =>
          import('./features/teachers/classe-form.component').then((m) => m.ClasseFormComponent),
      },
      {
        path: 'teachers',
        loadComponent: () =>
          import('./features/teachers/teacher-list.component').then((m) => m.TeacherListComponent),
      },
      {
        path: 'teachers/nouveau',
        loadComponent: () =>
          import('./features/teachers/teacher-form.component').then((m) => m.TeacherFormComponent),
      },
      {
        path: 'teachers/:id',
        loadComponent: () =>
          import('./features/teachers/teacher-form.component').then((m) => m.TeacherFormComponent),
      },
      {
        path: 'students',
        loadComponent: () =>
          import('./features/students/student-list.component').then((m) => m.StudentListComponent),
      },
      {
        path: 'students/nouveau',
        loadComponent: () =>
          import('./features/students/student-form.component').then((m) => m.StudentFormComponent),
      },
      {
        path: 'students/:id',
        loadComponent: () =>
          import('./features/students/student-form.component').then((m) => m.StudentFormComponent),
      },
      {
        path: 'evaluations',
        loadComponent: () =>
          import('./features/evaluations/note-list.component').then((m) => m.NoteListComponent),
      },
      {
        path: 'evaluations/saisie',
        loadComponent: () =>
          import('./features/evaluations/note-entry.component').then((m) => m.NoteEntryComponent),
      },
    ],
  },
];