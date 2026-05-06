import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { map } from 'rxjs/operators';
import { PadariaService } from '../../core/services/padaria.service';
import { FiltroEstoquePipe } from '../../shared/pipes/filtro-estoque.pipe';

@Component({
  selector: 'app-estoque',
  standalone: true,
  imports: [CommonModule, FormsModule, FiltroEstoquePipe],
  template: `
  <div class="page-header">
    <h1 class="page-title">Estoque da padaria</h1>
  </div>
  <div class="toolbar">
    <input type="text" [(ngModel)]="busca" placeholder="Buscar produto..." class="search-input">
    <div class="filter-tabs">
      <button [class.active]="filtro === 'todos'"  (click)="filtro='todos'">Todos</button>
      <button [class.active]="filtro === 'baixo'"  (click)="filtro='baixo'">Baixo</button>
      <button [class.active]="filtro === 'zerado'" (click)="filtro='zerado'">Zerado</button>
    </div>
  </div>
  <div class="card table-card">
    <table class="data-table">
      <thead><tr>
        <th style="width:40%">Produto</th>
        <th style="width:15%">Código</th>
        <th style="width:15%">Preço</th>
        <th style="width:15%">Saldo</th>
        <th style="width:15%">Status</th>
      </tr></thead>
      <tbody>
        <ng-container *ngIf="lista$ | async as lista">
          <tr *ngFor="let e of lista | filtroEstoque:filtro:busca">
            <td class="td-nome">{{ e.produto.nome }}</td>
            <td class="td-mono">{{ e.produto.codigo }}</td>
            <td>{{ e.produto.preco | currency:'BRL':'symbol':'1.2-2' }}/{{ e.produto.tipo }}</td>
            <td class="td-saldo">{{ e.saldo | number:'1.2-2' }} {{ e.unidade }}</td>
            <td><span class="status-badge" [class]="getStatus(e.saldo)">{{ getStatusLabel(e.saldo) }}</span></td>
          </tr>
        </ng-container>
      </tbody>
    </table>
  </div>
  `
})
export class EstoqueComponent {
  busca = '';
  filtro = 'todos';
  lista$ = this.svc.estoque$.pipe(map(e => Object.values(e).sort((a, b) => a.produto.nome.localeCompare(b.produto.nome))));
  constructor(private svc: PadariaService) {}
  getStatus(s: number) { return s <= 0 ? 'status-danger' : s < 2 ? 'status-warn' : 'status-ok'; }
  getStatusLabel(s: number) { return s <= 0 ? 'Zerado' : s < 2 ? 'Baixo' : 'OK'; }
}
