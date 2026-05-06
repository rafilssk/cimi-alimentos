import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { map } from 'rxjs/operators';
import { PadariaService } from '../../core/services/padaria.service';
import { RegistroProducao, RegistroTransferencia } from '../../core/models/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
  <div class="page-header">
    <h1 class="page-title">Painel geral</h1>
    <span class="page-subtitle">Visão geral de hoje</span>
  </div>

  <div class="kpi-grid" *ngIf="kpi$ | async as kpi">
    <div class="kpi-card">
      <div class="kpi-label">Produtos</div>
      <div class="kpi-value">{{ prodCount$ | async }}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Produzido hoje</div>
      <div class="kpi-value">{{ kpi.totalProduzido | number:'1.1-1' }}</div>
      <div class="kpi-sub">kg / un</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Transferências</div>
      <div class="kpi-value">{{ kpi.totalTransferencias }}</div>
    </div>
    <div class="kpi-card kpi-card--accent">
      <div class="kpi-label">Valor hoje</div>
      <div class="kpi-value">{{ kpi.valorTransferido | currency:'BRL':'symbol':'1.0-0' }}</div>
    </div>
  </div>

  <div class="dash-grid">
    <div class="card">
      <div class="card-header">
        <span class="card-title">Últimas movimentações</span>
        <a routerLink="/historico" class="card-link">ver tudo →</a>
      </div>
      <ng-container *ngIf="ultimas$ | async as lista">
        <div *ngFor="let h of lista" class="mov-item">
          <span class="mov-badge" [class.prod]="h.tipo==='producao'" [class.transf]="h.tipo==='transferencia'">
            {{ h.tipo === 'producao' ? 'Prod.' : 'Transf.' }}
          </span>
          <div class="mov-info">
            <span class="mov-nome" *ngIf="h.tipo==='producao'">{{ asP(h).produto.nome }}</span>
            <span class="mov-nome" *ngIf="h.tipo==='transferencia'">{{ asT(h).itens.length }} itens</span>
            <span class="mov-data">{{ h.data | date:'dd/MM HH:mm' }}</span>
          </div>
          <span class="mov-valor" *ngIf="h.tipo==='producao'">{{ asP(h).qty | number:'1.1-1' }} {{ asP(h).unit }}</span>
          <span class="mov-valor" *ngIf="h.tipo==='transferencia'">{{ asT(h).total | currency:'BRL':'symbol':'1.0-0' }}</span>
        </div>
        <div class="empty-state" *ngIf="!lista.length">Nenhuma movimentação ainda</div>
      </ng-container>
    </div>

    <div class="card">
      <div class="card-header">
        <span class="card-title">Estoque baixo</span>
        <a routerLink="/estoque" class="card-link">ver →</a>
      </div>
      <ng-container *ngIf="estoqueBaixo$ | async as lista">
        <div *ngFor="let e of lista" class="mov-item">
          <span class="mov-badge warn">Baixo</span>
          <div class="mov-info"><span class="mov-nome">{{ e.produto.nome }}</span></div>
          <span class="mov-valor warn">{{ e.saldo | number:'1.2-2' }} {{ e.unidade }}</span>
        </div>
        <div class="empty-state" *ngIf="!lista.length">Nenhum alerta</div>
      </ng-container>
    </div>
  </div>

  <div class="quick-actions">
    <a routerLink="/producao"      class="quick-btn">+ Produção</a>
    <a routerLink="/transferencia" class="quick-btn quick-btn--sec">+ Transferência</a>
    <a routerLink="/relatorio"     class="quick-btn quick-btn--noc">NOC →</a>
  </div>
  `,
  styles: [`
    .dash-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
    @media (max-width: 768px) { .dash-grid { grid-template-columns: 1fr; } }
  `]
})
export class DashboardComponent {
  kpi$          = this.svc.kpi$;
  prodCount$    = this.svc.produtos$.pipe(map(p => Object.keys(p).length));
  ultimas$      = this.svc.historico$.pipe(map(h => h.slice(0, 6)));
  estoqueBaixo$ = this.svc.estoque$.pipe(map(est => Object.values(est).filter(e => e.saldo > 0 && e.saldo < 2)));
  constructor(private svc: PadariaService) {}
  asP(h: any): RegistroProducao { return h; }
  asT(h: any): RegistroTransferencia { return h; }
}
