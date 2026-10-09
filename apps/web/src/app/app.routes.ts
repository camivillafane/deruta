import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/landing/landing.component').then((m) => m.LandingComponent),
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'registro',
    loadComponent: () => import('./features/auth/register/register.component').then((m) => m.RegisterComponent),
  },
  {
    path: 'buscar',
    loadComponent: () => import('./features/trips/search/search.component').then((m) => m.SearchComponent),
  },
  {
    path: 'buscar/resultados',
    loadComponent: () => import('./features/trips/results/results.component').then((m) => m.ResultsComponent),
  },
  {
    path: 'viajes/:id',
    loadComponent: () => import('./features/trips/detail/detail.component').then((m) => m.TripDetailComponent),
  },
  {
    path: 'publicar',
    loadComponent: () => import('./features/trips/create/create.component').then((m) => m.CreateTripComponent),
    canActivate: [authGuard],
  },
  {
    path: 'necesito-viajar',
    loadComponent: () => import('./features/searches/create-search/create-search.component').then((m) => m.CreateSearchComponent),
    canActivate: [authGuard],
  },
  {
    path: 'mis-viajes',
    loadComponent: () => import('./features/trips/my-trips/my-trips.component').then((m) => m.MyTripsComponent),
    canActivate: [authGuard],
  },
  {
    path: 'mensajes',
    loadComponent: () => import('./features/conversations/conversations.component').then((m) => m.ConversationsComponent),
    canActivate: [authGuard],
  },
  {
    path: 'mensajes/:id',
    loadComponent: () => import('./features/conversations/chat/chat.component').then((m) => m.ChatComponent),
    canActivate: [authGuard],
  },
  {
    path: 'perfil',
    loadComponent: () => import('./features/profile/profile.component').then((m) => m.ProfileComponent),
    canActivate: [authGuard],
  },
  {
    path: '**',
    loadComponent: () => import('./features/not-found/not-found.component').then((m) => m.NotFoundComponent),
  },
];
