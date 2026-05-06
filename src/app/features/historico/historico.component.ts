import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { map } from 'rxjs/operators';
import { PadariaService } from '../../core/services/padaria.service';
import { RegistroProducao, RegistroTransferencia } from '../../core/models/models';

@Component({
  selector: 'app-historico',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
  <div class="page-header">
    <h1 class="page-title">Histórico</h1>
  </div>
  <div class="toolbar">
    <select [(ngModel)]="filtro" class="search-input" style="max-width:200px">
      <option value="todos">Todas as movimentações</option>
      <option value="producao">Apenas produções</option>
      <option value="transferencia">Apenas transferências</option>
    </select>
  </div>
  <div class="card table-card">
    <table class="data-table">
      <thead><tr><th>Data / hora</th><th>Tipo</th><th>Produto / Itens</th><th>Quantidade</th><th>Valor</th></tr></thead>
      <tbody>
        <ng-container *ngIf="lista$ | async as lista">
          <tr *ngFor="let h of lista">
            <td class="td-mono">{{ h.data | date:'dd/MM HH:mm' }}</td>
            <td><span class="mov-badge" [class.prod]="h.tipo==='producao'" [class.transf]="h.tipo==='transferencia'">{{ h.tipo === 'producao' ? 'Produção' : 'Transferência' }}</span></td>
            <td class="td-nome">
              <span *ngIf="h.tipo==='producao'">{{ asProd(h).produto.nome }}</span>
              <span *ngIf="h.tipo==='transferencia'">{{ asTransf(h).itens.length }} itens</span>
            </td>
            <td>
              <span *ngIf="h.tipo==='producao'">{{ asProd(h).qty | number:'1.1-1' }} {{ asProd(h).unit }}</span>
            </td>
            <td>
              <span *ngIf="h.tipo==='producao'" class="td-custo">{{ asProd(h).qty | number:'1.3-3' }} {{ asProd(h).unit }}</span>
              <span *ngIf="h.tipo==='transferencia'">{{ asTransf(h).total | currency:'BRL':'symbol':'1.2-2' }}</span>
            </td>
          </tr>
          <tr *ngIf="!lista.length"><td colspan="5" class="empty-state">Nenhuma movimentação</td></tr>
        </ng-container>
      </tbody>
    </table>
  </div>
  `
})
export class HistoricoComponent {
  filtro = 'todos';
  lista$ = this.svc.historico$.pipe(
    map(h => h.filter(r => this.filtro === 'todos' || r.tipo === this.filtro))
  );
  constructor(private svc: PadariaService) {}
  asProd(h: any): RegistroProducao { return h; }
  asTransf(h: any): RegistroTransferencia { return h; }
}
