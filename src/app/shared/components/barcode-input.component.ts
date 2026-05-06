import { Component, EventEmitter, Input, Output, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { PadariaService } from '../../core/services/padaria.service';
import { Produto } from '../../core/models/models';

@Component({
  selector: 'app-barcode-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
  <div class="barcode-wrapper">
    <div class="barcode-field">
      <svg class="scan-icon" viewBox="0 0 20 20" width="16" height="16">
        <rect x="2" y="4" width="2" height="12" rx="0.5" fill="currentColor"/>
        <rect x="5" y="4" width="1" height="12" rx="0.5" fill="currentColor"/>
        <rect x="7" y="4" width="2" height="12" rx="0.5" fill="currentColor"/>
        <rect x="10" y="4" width="1" height="12" rx="0.5" fill="currentColor"/>
        <rect x="12" y="4" width="3" height="12" rx="0.5" fill="currentColor"/>
        <rect x="16" y="4" width="2" height="12" rx="0.5" fill="currentColor"/>
      </svg>
      <input
        type="text"
        [(ngModel)]="termo"
        (ngModelChange)="onInput($event)"
        (keydown.enter)="onEnter()"
        [placeholder]="placeholder"
        class="barcode-input-field"
        autocomplete="off"
      />
      <button class="clear-btn" *ngIf="termo" (click)="clear()">×</button>
    </div>

    <!-- Produto encontrado -->
    <div class="produto-card found" *ngIf="produtoEncontrado && !showDropdown">
      <div class="produto-nome">{{ produtoEncontrado.nome }}</div>
      <div class="produto-meta">
        <span class="meta-item cod">{{ produtoEncontrado.codigo }}</span>
        <span class="meta-sep">·</span>
        <span class="meta-item">{{ produtoEncontrado.preco | currency:'BRL':'symbol':'1.2-2' }}/{{ produtoEncontrado.tipo }}</span>

        <!-- Preço da etiqueta -->
        <ng-container *ngIf="precoEtiqueta">
          <span class="meta-sep">·</span>
          <span class="meta-tag preco">
            💰 Etiqueta: {{ precoEtiqueta | currency:'BRL':'symbol':'1.2-2' }}
          </span>
        </ng-container>

        <!-- Peso da etiqueta -->
        <ng-container *ngIf="pesoEtiqueta">
          <span class="meta-sep">·</span>
          <span class="meta-tag peso">
            ⚖️ Peso: {{ pesoEtiqueta | number:'1.3-3' }} kg
          </span>
        </ng-container>
      </div>

      <!-- Cálculo automático se tiver peso -->
      <div class="calc-total" *ngIf="pesoEtiqueta">
        <span class="calc-label">Total calculado</span>
        <span class="calc-valor">{{ produtoEncontrado.preco * pesoEtiqueta | currency:'BRL':'symbol':'1.2-2' }}</span>
      </div>
    </div>

    <!-- Não encontrado -->
    <div class="produto-card not-found" *ngIf="notFound">
      <span>Produto não encontrado — tente buscar pelo nome abaixo</span>
    </div>

    <!-- Dropdown busca por nome -->
    <div class="search-dropdown" *ngIf="showDropdown && resultados.length">
      <div
        class="search-item"
        *ngFor="let p of resultados"
        (click)="selecionar(p)"
      >
        <span class="search-nome">{{ p.nome }}</span>
        <span class="search-preco">{{ p.preco | currency:'BRL':'symbol':'1.2-2' }}/{{ p.tipo }}</span>
      </div>
    </div>
  </div>
  `
})
export class BarcodeInputComponent implements OnInit, OnDestroy {
  @Input() placeholder = 'Bipe a etiqueta da balança ou busque...';
  @Output() produtoSelecionado = new EventEmitter<{
    produto: Produto;
    precoEtq: number | null;
    pesoEtq: number | null;
  }>();

  termo = '';
  produtoEncontrado: Produto | null = null;
  precoEtiqueta: number | null = null;
  pesoEtiqueta: number | null = null;
  resultados: Produto[] = [];
  showDropdown = false;
  notFound = false;

  private input$ = new Subject<string>();
  private destroy$ = new Subject<void>();

  constructor(private svc: PadariaService) {}

  ngOnInit() {
    this.input$.pipe(
      debounceTime(120),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(val => this.processar(val));
  }

  ngOnDestroy() { this.destroy$.next(); this.destroy$.complete(); }

  onInput(val: string) {
    this.produtoEncontrado = null;
    this.precoEtiqueta = null;
    this.pesoEtiqueta = null;
    this.notFound = false;
    this.showDropdown = false;
    this.input$.next(val);
  }

  onEnter() {
    const digits = this.termo.replace(/\D/g, '');
    if (digits.length >= 7) {
      const { produto, precoEtq, pesoEtq } = this.svc.decodificarEAN13(this.termo);
      if (produto) { this.selecionar(produto, precoEtq, pesoEtq); return; }
    }
    if (this.resultados.length === 1) this.selecionar(this.resultados[0]);
    else if (this.resultados.length > 0) this.showDropdown = true;
  }

  private processar(val: string) {
    if (!val || val.length < 2) { this.resultados = []; return; }
    const digits = val.replace(/\D/g, '');
    if (digits.length >= 7) {
      const { produto, precoEtq, pesoEtq } = this.svc.decodificarEAN13(val);
      if (produto) { this.selecionar(produto, precoEtq, pesoEtq); return; }
    }
    // Busca por nome
    this.resultados = this.svc.buscarProduto(val);
    this.showDropdown = this.resultados.length > 0;
    if (!this.resultados.length && val.length > 4) this.notFound = true;
  }

  selecionar(p: Produto, precoEtq: number | null = null, pesoEtq: number | null = null) {
    this.produtoEncontrado = p;
    this.precoEtiqueta = precoEtq;
    this.pesoEtiqueta = pesoEtq;
    this.showDropdown = false;
    this.notFound = false;
    this.produtoSelecionado.emit({ produto: p, precoEtq, pesoEtq });
  }

  clear() {
    this.termo = '';
    this.produtoEncontrado = null;
    this.precoEtiqueta = null;
    this.pesoEtiqueta = null;
    this.resultados = [];
    this.showDropdown = false;
    this.notFound = false;
  }
}
