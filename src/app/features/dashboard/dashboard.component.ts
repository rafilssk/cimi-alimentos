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
    <div>
      <h1 class="page-title">Painel geral</h1>
      <span class="page-subtitle">Visão geral das operações de hoje</span>
    </div>
    <div class="header-date">{{ today | date:'dd/MM/yyyy' }}</div>
  </div>

  <div class="kpi-grid" *ngIf="kpi$ | async as kpi">
    <div class="kpi-card kpi-card--blue">
      <span class="kpi-icon">📦</span>
      <div class="kpi-label">Produtos cadastrados</div>
      <div class="kpi-value">{{ prodCount$ | async }}</div>
      <div class="kpi-sub">no sistema</div>
    </div>
    <div class="kpi-card kpi-card--orange">
      <span class="kpi-icon">⚖️</span>
      <div class="kpi-label">Produzido hoje</div>
      <div class="kpi-value">{{ kpi.totalProduzido | number:'1.1-1' }}</div>
      <div class="kpi-sub">kg / unidades</div>
    </div>
    <div class="kpi-card kpi-card--purple">
      <span class="kpi-icon">🚚</span>
      <div class="kpi-label">Transferências</div>
      <div class="kpi-value">{{ kpi.totalTransferencias }}</div>
      <div class="kpi-sub">romaneios hoje</div>
    </div>
    <div class="kpi-card kpi-card--green">
      <span class="kpi-icon">💰</span>
      <div class="kpi-label">Valor transferido</div>
      <div class="kpi-value">{{ kpi.valorTransferido | currency:'BRL':'symbol':'1.0-0' }}</div>
      <div class="kpi-sub">hoje</div>
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
            {{ h.tipo === 'producao' ? 'PROD' : 'TRANSF' }}
          </span>
          <div class="mov-info">
            <span class="mov-nome" *ngIf="h.tipo==='producao'">{{ asP(h).produto.nome }}</span>
            <span class="mov-nome" *ngIf="h.tipo==='transferencia'">{{ asT(h).itens.length }} itens transferidos</span>
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
        <a routerLink="/estoque" class="card-link">ver estoque →</a>
      </div>
      <ng-container *ngIf="estoqueBaixo$ | async as lista">
        <div *ngFor="let e of lista" class="mov-item">
          <span class="mov-badge warn">BAIXO</span>
          <div class="mov-info"><span class="mov-nome">{{ e.produto.nome }}</span></div>
          <span class="mov-valor warn">{{ e.saldo | number:'1.2-2' }} {{ e.unidade }}</span>
        </div>
        <div class="empty-state" *ngIf="!lista.length">
          <span style="font-size:32px;display:block;margin-bottom:8px">✅</span>
          Nenhum alerta de estoque
        </div>
      </ng-container>
    </div>
  </div>

  <div class="quick-actions">
    <a routerLink="/producao"      class="quick-btn">⏱ Registrar produção</a>
    <a routerLink="/transferencia" class="quick-btn quick-btn--sec">🚚 Nova transferência</a>
    <a routerLink="/relatorio"     class="quick-btn quick-btn--noc">📡 Abrir NOC</a>
  </div>
  `,
  styles: [`
    .header-date { font-size:13px; color:var(--t3); font-weight:500; padding-top:4px; }
    @media(max-width:768px){ .header-date{display:none;} }
  `]
})
export class DashboardComponent {
  today = new Date();
  kpi$          = this.svc.kpi$;
  prodCount$    = this.svc.produtos$.pipe(map(p => Object.keys(p).length));
  ultimas$      = this.svc.historico$.pipe(map(h => h.slice(0, 8)));
  estoqueBaixo$ = this.svc.estoque$.pipe(map(est => Object.values(est).filter(e => e.saldo > 0 && e.saldo < 2)));
  constructor(private svc: PadariaService) {}
  asP(h: any): RegistroProducao { return h; }
  asT(h: any): RegistroTransferencia { return h; }
}