import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { map } from 'rxjs/operators';
import { PadariaService } from '../../core/services/padaria.service';
import { BarcodeInputComponent } from '../../shared/components/barcode-input.component';
import { Produto, RegistroProducao } from '../../core/models/models';

@Component({
  selector: 'app-producao',
  standalone: true,
  imports: [CommonModule, FormsModule, BarcodeInputComponent],
  template: `
  <div class="page-header">
    <h1 class="page-title">Registrar produção</h1>
    <span class="page-subtitle">Bipe ou busque o produto produzido</span>
  </div>

  <div class="card mult-card">
    <div class="mult-header">
      <span class="mult-title">Multiplicador</span>
      <span class="mult-badge" *ngIf="mult() > 1">× {{ mult() }} ativo</span>
    </div>
    <div class="mult-row">
      <input type="number" [(ngModel)]="multValue" (ngModelChange)="mult.set(+$event || 1)" min="1" step="1" class="mult-input">
      <span class="mult-x">×</span>
      <div class="mult-presets">
        <button *ngFor="let v of presets" (click)="setMult(v)" [class.active]="mult() === v" class="preset-btn">×{{v}}</button>
        <button (click)="setMult(1)" class="preset-btn reset">limpar</button>
      </div>
    </div>
    <div class="mult-hint" *ngIf="mult() > 1">Cada leitura registrará × {{ mult() }} automaticamente</div>
  </div>

  <div class="prod-grid">
    <div class="card">
      <div class="card-header"><span class="card-title">Produto</span></div>
      <app-barcode-input placeholder="Bipe a etiqueta ou busque..." (produtoSelecionado)="onProduto($event)"/>
      <div class="form-fields" *ngIf="produtoAtual()">
        <div class="etiqueta-info" *ngIf="precoEtq || pesoEtq">
          <div class="etq-row" *ngIf="precoEtq">
            <span class="etq-label">💰 Total na etiqueta</span>
            <span class="etq-valor preco">{{ precoEtq | currency:'BRL':'symbol':'1.2-2' }}</span>
          </div>
          <div class="etq-row" *ngIf="pesoEtq">
            <span class="etq-label">⚖️ Peso na etiqueta</span>
            <span class="etq-valor peso">{{ pesoEtq | number:'1.3-3' }} kg</span>
          </div>
        </div>
        <div class="field-row">
          <div class="field">
            <label>Quantidade <small *ngIf="mult() > 1" class="mult-hint-inline">(×{{ mult() }})</small></label>
            <input type="number" [(ngModel)]="qty" min="0" step="0.001" [placeholder]="pesoEtq ? pesoEtq.toFixed(3) : '0'">
          </div>
          <div class="field">
            <label>Unidade</label>
            <select [(ngModel)]="unit">
              <option value="kg">kg</option>
              <option value="un">unidades</option>
              <option value="g">gramas</option>
            </select>
          </div>
        </div>
        <button class="btn-primary" (click)="registrar()">Registrar produção</button>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <span class="card-title">Produção de hoje</span>
        <span class="card-badge">{{ (listaHoje$ | async)?.length || 0 }}</span>
      </div>
      <div class="list-scroll">
        <ng-container *ngIf="listaHoje$ | async as lista">
          <div *ngFor="let h of lista" class="list-row">
            <div class="list-info">
              <span class="list-nome">{{ h.produto.nome }}</span>
              <span class="list-meta">{{ h.data | date:'HH:mm' }} <span *ngIf="h.mult > 1" class="tag-mult">×{{h.mult}}</span></span>
            </div>
            <span class="list-qty">{{ h.qty | number:'1.2-2' }} {{ h.unit }}</span>
          </div>
          <div class="empty-state" *ngIf="!lista.length">Nenhum registro hoje</div>
        </ng-container>
      </div>
    </div>
  </div>
  `,
  styles: [`
    .prod-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    @media (max-width: 768px) { .prod-grid { grid-template-columns: 1fr; } }
  `]
})
export class ProducaoComponent {
  produtoAtual = signal<Produto | null>(null);
  mult = signal(1); multValue = 1; qty = 0; unit = 'kg';
  precoEtq: number | null = null; pesoEtq: number | null = null;
  presets = [2, 5, 10, 12, 24, 50];
  listaHoje$ = this.svc.historico$.pipe(
    map(h => h.filter(r => r.tipo === 'producao' && new Date(r.data).toDateString() === new Date().toDateString()) as RegistroProducao[])
  );
  constructor(private svc: PadariaService) {}
  setMult(v: number) { this.mult.set(v); this.multValue = v; }
  onProduto(ev: { produto: Produto; precoEtq: number | null; pesoEtq: number | null }) {
    this.produtoAtual.set(ev.produto); this.precoEtq = ev.precoEtq; this.pesoEtq = ev.pesoEtq;
    this.unit = ev.produto.tipo;
    if (ev.pesoEtq) this.qty = ev.pesoEtq;
    else if (this.mult() > 1) { this.qty = this.mult(); setTimeout(() => this.registrar(), 80); }
  }
  registrar() {
    const p = this.produtoAtual(); if (!p) return;
    const qtyFinal = this.qty || (this.pesoEtq ?? this.mult());
    if (qtyFinal <= 0) return;
    this.svc.registrarProducao(p, qtyFinal, this.unit, 0, this.mult());
    this.produtoAtual.set(null); this.qty = 0; this.precoEtq = null; this.pesoEtq = null;
  }
}
