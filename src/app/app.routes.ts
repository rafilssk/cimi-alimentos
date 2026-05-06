import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard',     loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent) },
  { path: 'producao',      loadComponent: () => import('./features/producao/producao.component').then(m => m.ProducaoComponent) },
  { path: 'transferencia', loadComponent: () => import('./features/transferencia/transferencia.component').then(m => m.TransferenciaComponent) },
  { path: 'estoque',       loadComponent: () => import('./features/estoque/estoque.component').then(m => m.EstoqueComponent) },
  { path: 'relatorio',     loadComponent: () => import('./features/relatorio/relatorio.component').then(m => m.RelatorioComponent) },
  { path: 'historico',     loadComponent: () => import('./features/historico/historico.component').then(m => m.HistoricoComponent) },
  { path: 'importar',      loadComponent: () => import('./features/importar/importar.component').then(m => m.ImportarComponent) },
];
