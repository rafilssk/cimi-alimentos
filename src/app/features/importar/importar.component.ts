import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PadariaService } from '../../core/services/padaria.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-importar',
  standalone: true,
  imports: [CommonModule],
  template: `
  <div class="page-header">
    <h1 class="page-title">Importar produtos MGV</h1>
    <span class="page-subtitle">Atualiza preços e nomes — saldo e histórico são preservados</span>
  </div>

  <div class="imp-grid">
    <div class="card">
      <div class="card-header"><span class="card-title">Arquivo MGV</span></div>
      <div class="info-banner">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style="flex-shrink:0;margin-top:2px"><circle cx="8" cy="8" r="7" stroke="#1565C0" stroke-width="1.5"/><path d="M8 7v4M8 5.5v.5" stroke="#1565C0" stroke-width="1.5" stroke-linecap="round"/></svg>
        <div>
          <div class="info-title">Reimportação segura</div>
          <div class="info-text">Preços e nomes atualizados. Estoque, produções e transferências <strong>preservados</strong>.</div>
        </div>
      </div>
      <div class="upload-area" (click)="fileInput.click()" [class.loading]="loading()">
        <svg width="28" height="28" viewBox="0 0 32 32" fill="none" style="margin-bottom:10px;opacity:.4"><path d="M16 4v16M8 12l8-8 8 8M4 24h24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        <div class="upload-title">{{ loading() ? 'Importando...' : 'Clique para selecionar' }}</div>
        <div class="upload-sub">ITENSMGVPADARIA.TXT</div>
      </div>
      <input #fileInput type="file" accept=".txt,.TXT" style="display:none" (change)="onFile($event)">
      <div class="progress-wrap" *ngIf="loading()">
        <div class="progress-bar"><div class="progress-fill" [style.width.%]="progress()"></div></div>
        <span class="progress-label">{{ progressLabel() }}</span>
      </div>
      <div class="import-result" *ngIf="result()">
        <div class="result-header">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="8" fill="#2E7D32" opacity=".15"/><path d="M5.5 9l2.5 2.5 4.5-5" stroke="#2E7D32" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          <span>Importação concluída!</span>
        </div>
        <div class="result-stats">
          <div class="stat-item"><span class="stat-value">{{ result()!.total }}</span><span class="stat-label">Total</span></div>
          <div class="stat-item stat-new"><span class="stat-value">+{{ result()!.novos }}</span><span class="stat-label">Novos</span></div>
          <div class="stat-item"><span class="stat-value">{{ result()!.atualizados }}</span><span class="stat-label">Atualizados</span></div>
          <div class="stat-item stat-warn" *ngIf="result()!.precoAlterado > 0"><span class="stat-value">{{ result()!.precoAlterado }}</span><span class="stat-label">Preços alterados</span></div>
        </div>
        <div class="result-note" *ngIf="result()!.precoAlterado > 0">
          ⚠️ {{ result()!.precoAlterado }} produto(s) com preço diferente do cadastro anterior.
        </div>
      </div>
      <div class="result-msg error" *ngIf="erro()">Erro ao ler o arquivo. Verifique se é um TXT válido do MGV.</div>
    </div>

    <div>
      <div class="card" style="margin-bottom:16px">
        <div class="card-header"><span class="card-title">Demonstração</span></div>
        <p style="font-size:13px;color:var(--c-text-2);margin-bottom:1rem;line-height:1.6">Carregue dados de exemplo para explorar o sistema.</p>
        <button class="btn-secondary w-full" (click)="loadDemo()">Carregar demonstração</button>
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title" style="color:var(--c-danger)">Zona de perigo</span></div>
        <p style="font-size:13px;color:var(--c-text-3);margin-bottom:1rem;line-height:1.6">Remove todos os dados locais.</p>
        <button class="btn-danger" (click)="limpar()">Limpar dados locais</button>
      </div>
    </div>
  </div>
  `,
  styles: [`
    .imp-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    @media (max-width: 768px) { .imp-grid { grid-template-columns: 1fr; } }
  `]
})
export class ImportarComponent {
  loading       = signal(false);
  progress      = signal(0);
  progressLabel = signal('');
  result        = signal<any>(null);
  erro          = signal(false);

  constructor(private svc: PadariaService, private router: Router) {}

  onFile(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0]; if (!file) return;
    this.loading.set(true); this.progress.set(10);
    this.progressLabel.set('Lendo arquivo...'); this.result.set(null); this.erro.set(false);
    const reader = new FileReader();
    reader.onload = async (e) => {
      this.progress.set(40); this.progressLabel.set('Enviando para o banco...');
      try {
        const res = await this.svc.importarMGV(e.target!.result as string);
        this.progress.set(100); this.progressLabel.set('Concluído!'); this.result.set(res);
      } catch { this.erro.set(true); }
      this.loading.set(false); input.value = '';
    };
    reader.readAsText(file, 'latin1');
  }

  loadDemo() { this.svc.carregarDemoData(); this.router.navigate(['/relatorio']); }
  limpar() { if (confirm('Limpar dados locais?')) this.svc.limparTudo(); }
}
