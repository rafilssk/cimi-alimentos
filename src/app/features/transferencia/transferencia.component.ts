import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PadariaService } from '../../core/services/padaria.service';
import { BarcodeInputComponent } from '../../shared/components/barcode-input.component';
import { Produto, ItemRomaneio } from '../../core/models/models';

@Component({
  selector: 'app-transferencia',
  standalone: true,
  imports: [CommonModule, FormsModule, BarcodeInputComponent],
  template: `
  <div class="page-header">
    <h1 class="page-title">Transferência</h1>
    <span class="page-subtitle">Monte o romaneio e confirme</span>
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
  </div>

  <div class="transf-grid">
    <!-- Adicionar item -->
    <div class="card">
      <div class="card-header"><span class="card-title">Adicionar item</span></div>
      <app-barcode-input placeholder="Bipe ou busque o produto..." (produtoSelecionado)="onProduto($event)"/>
      <div class="form-fields" *ngIf="produtoAtual()">
        <div class="etiqueta-info" *ngIf="precoEtq || pesoEtq">
          <div class="etq-row" *ngIf="precoEtq">
            <span class="etq-label">💰 Total etiqueta</span>
            <span class="etq-valor preco">{{ precoEtq | currency:'BRL':'symbol':'1.2-2' }}</span>
          </div>
          <div class="etq-row" *ngIf="pesoEtq">
            <span class="etq-label">⚖️ Peso etiqueta</span>
            <span class="etq-valor peso">{{ pesoEtq | number:'1.3-3' }} kg</span>
          </div>
        </div>
        <div class="field-row">
          <div class="field">
            <label>Quantidade</label>
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
        <button class="btn-secondary w-full" (click)="adicionar()">+ Adicionar ao romaneio</button>
      </div>
    </div>

    <!-- Romaneio -->
    <div class="card">
      <div class="card-header">
        <span class="card-title">Romaneio</span>
        <button class="btn-export" *ngIf="(romaneio$ | async)?.length" (click)="showModal = true">PDF</button>
      </div>
      <ng-container *ngIf="romaneio$ | async as itens">
        <div class="list-scroll">
          <div *ngFor="let item of itens" class="rom-item">
            <div class="rom-info">
              <span class="rom-nome">{{ item.produto.nome }}</span>
              <span class="tag-mult" *ngIf="item.mult && item.mult > 1">×{{item.mult}}</span>
            </div>
            <span class="rom-qty">{{ item.qty | number:'1.2-2' }} {{ item.unit }}</span>
            <span class="rom-price">{{ item.produto.preco * item.qty | currency:'BRL':'symbol':'1.2-2' }}</span>
            <button class="remove-btn" (click)="remover(item.id)">×</button>
          </div>
          <div class="empty-state" *ngIf="!itens.length">Nenhum item</div>
        </div>
        <div class="romaneio-total" *ngIf="itens.length">
          <div class="total-row"><span>Itens</span><span>{{ itens.length }}</span></div>
          <div class="total-row total-valor">
            <span>Total</span>
            <span>{{ calcTotal(itens) | currency:'BRL':'symbol':'1.2-2' }}</span>
          </div>
          <button class="btn-primary mt-1" (click)="confirmar()">Confirmar transferência</button>
        </div>
      </ng-container>
    </div>
  </div>

  <!-- Modal PDF -->
  <div class="modal-overlay" *ngIf="showModal" (click)="showModal = false">
    <div class="modal" (click)="$event.stopPropagation()">
      <div class="modal-header">
        <span class="modal-title">Exportar romaneio</span>
        <button class="modal-close" (click)="showModal = false">×</button>
      </div>
      <div class="modal-body">
        <div class="field"><label>Data</label><input type="date" [(ngModel)]="romData"></div>
        <div class="field"><label>Responsável</label><input type="text" [(ngModel)]="romResp" placeholder="Nome do responsável"></div>
        <div class="field"><label>Observação</label><input type="text" [(ngModel)]="romObs" placeholder="Ex: Turno manhã"></div>
      </div>
      <div class="modal-footer">
        <button class="btn-primary" (click)="gerarPDF()">Imprimir / PDF</button>
        <button class="btn-secondary" (click)="showModal = false">Cancelar</button>
      </div>
    </div>
  </div>
  `,
  styles: [`
    .transf-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    @media (max-width: 768px) { .transf-grid { grid-template-columns: 1fr; } }
  `]
})
export class TransferenciaComponent {
  produtoAtual = signal<Produto | null>(null);
  mult = signal(1); multValue = 1; qty = 0; unit = 'kg';
  precoEtq: number | null = null; pesoEtq: number | null = null;
  presets = [2, 5, 10, 12, 24, 50];
  showModal = false;
  romData = new Date().toISOString().split('T')[0];
  romResp = ''; romObs = '';
  romaneio$ = this.svc.romaneio$;
  constructor(private svc: PadariaService) {}
  setMult(v: number) { this.mult.set(v); this.multValue = v; }
  onProduto(ev: { produto: Produto; precoEtq: number | null; pesoEtq: number | null }) {
    this.produtoAtual.set(ev.produto); this.precoEtq = ev.precoEtq; this.pesoEtq = ev.pesoEtq;
    this.unit = ev.produto.tipo;
    if (ev.pesoEtq) this.qty = ev.pesoEtq;
    else if (this.mult() > 1) { this.qty = this.mult(); setTimeout(() => this.adicionar(), 80); }
  }
  adicionar() {
    const p = this.produtoAtual(); if (!p) return;
    const qtyFinal = this.qty || (this.pesoEtq ?? this.mult());
    if (qtyFinal <= 0) return;
    this.svc.adicionarAoRomaneio({ produto: p, qty: qtyFinal, unit: this.unit, mult: this.mult() });
    this.produtoAtual.set(null); this.qty = 0; this.precoEtq = null; this.pesoEtq = null;
  }
  remover(id: number) { this.svc.removerDoRomaneio(id); }
  calcTotal(itens: ItemRomaneio[]) { return itens.reduce((s, i) => s + i.produto.preco * i.qty, 0); }
  confirmar() { this.svc.confirmarTransferencia(); alert('Transferência confirmada!'); }
  gerarPDF() {
    const itens = this.svc.romaneio; let total = 0;
    const linhas = itens.map(r => { const v = r.produto.preco * r.qty; total += v;
      return `<tr><td>${r.produto.nome}</td><td style="text-align:center">${r.qty.toFixed(3)} ${r.unit}</td><td style="text-align:right">R$ ${r.produto.preco.toFixed(2)}</td><td style="text-align:right">R$ ${v.toFixed(2)}</td></tr>`; }).join('');
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Romaneio</title>
    <style>body{font-family:Arial,sans-serif;font-size:13px;margin:24px}h1{font-size:18px;margin-bottom:4px}.info{font-size:12px;color:#555;margin-bottom:20px}table{width:100%;border-collapse:collapse}th{background:#f0f0f0;padding:7px 10px;text-align:left;border:1px solid #ddd;font-size:12px}td{padding:6px 10px;border:1px solid #ddd;font-size:12px}tr:nth-child(even){background:#fafafa}.tr td{font-weight:700;background:#e8f5e9}.as{border-top:1px solid #999;width:180px;text-align:center;padding-top:4px;margin-top:48px;font-size:12px}@media print{body{margin:12px}}</style>
    </head><body><h1>Romaneio de Transferência</h1>
    <div class="info">Data: ${this.romData} · Responsável: ${this.romResp||'—'}${this.romObs?' · '+this.romObs:''}</div>
    <table><thead><tr><th>Produto</th><th>Qtd</th><th style="text-align:right">R$/kg</th><th style="text-align:right">Total</th></tr></thead>
    <tbody>${linhas}<tr class="tr"><td colspan="3">Total geral</td><td style="text-align:right">R$ ${total.toFixed(2)}</td></tr></tbody></table>
    <div style="display:flex;gap:60px"><div class="as">Responsável padaria</div><div class="as">Responsável mercado</div></div>
    <script>window.onload=()=>window.print()<\/script></body></html>`;
    const w = window.open('', '_blank'); if (w) { w.document.write(html); w.document.close(); }
    this.showModal = false;
  }
}
