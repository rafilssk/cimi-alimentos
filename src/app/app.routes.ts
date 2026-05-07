import { Routes } from '@angular/router';
import { authGuard, gerenteGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'producao', pathMatch: 'full' },
  { path: 'login', loadComponent: () => import('./features/login/login.component').then(m => m.LoginComponent) },

  // Operador + Gerente
  { path: 'producao',      canActivate: [authGuard], loadComponent: () => import('./features/producao/producao.component').then(m => m.ProducaoComponent) },
  { path: 'transferencia', canActivate: [authGuard], loadComponent: () => import('./features/transferencia/transferencia.component').then(m => m.TransferenciaComponent) },

  // Somente Gerente
  { path: 'dashboard',     canActivate: [gerenteGuard], loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent) },
  { path: 'estoque',       canActivate: [gerenteGuard], loadComponent: () => import('./features/estoque/estoque.component').then(m => m.EstoqueComponent) },
  { path: 'relatorio',     canActivate: [gerenteGuard], loadComponent: () => import('./features/relatorio/relatorio.component').then(m => m.RelatorioComponent) },
  { path: 'historico',     canActivate: [gerenteGuard], loadComponent: () => import('./features/historico/historico.component').then(m => m.HistoricoComponent) },
  { path: 'importar',      canActivate: [gerenteGuard], loadComponent: () => import('./features/importar/importar.component').then(m => m.ImportarComponent) },

  { path: '**', redirectTo: 'producao' }
];
