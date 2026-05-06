import {
  Component, OnInit, OnDestroy, AfterViewInit,
  ViewChild, ElementRef, ChangeDetectorRef, ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { interval, Subscription } from 'rxjs';
import { PadariaService } from '../../core/services/padaria.service';
import { RegistroProducao, RegistroTransferencia } from '../../core/models/models';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

@Component({
  selector: 'app-relatorio',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
  <div class="noc-shell">
    <div class="noc-header">
      <div class="noc-title-group">
        <div class="noc-live-dot"></div>
        <span class="noc-title">Centro de Operações</span>
      </div>
      <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
        <div class="period-tabs">
          <button [class.active]="periodo==='dia'"    (click)="setPeriodo('dia')">Hoje</button>
          <button [class.active]="periodo==='semana'" (click)="setPeriodo('semana')">7d</button>
          <button [class.active]="periodo==='mes'"    (click)="setPeriodo('mes')">30d</button>
        </div>
        <div class="noc-clock">{{ clock }}</div>
      </div>
    </div>

    <!-- KPIs -->
    <div class="noc-kpis">
      <div class="noc-kpi noc-kpi--accent" [class.pulse]="pulse">
        <div class="noc-kpi-icon">💰</div>
        <div class="noc-kpi-label">Valor transferido</div>
        <div class="noc-kpi-value">{{ kpi?.valorTransferido | currency:'BRL':'symbol':'1.0-0' }}</div>
        <div class="noc-kpi-sub">{{ periodoLabel }}</div>
      </div>
      <div class="noc-kpi noc-kpi--prod" [class.pulse]="pulse">
        <div class="noc-kpi-icon">⚖️</div>
        <div class="noc-kpi-label">Total produzido</div>
        <div class="noc-kpi-value">{{ kpi?.totalProduzido | number:'1.1-1' }}</div>
        <div class="noc-kpi-sub">kg / unidades</div>
      </div>
      <div class="noc-kpi noc-kpi--transf" [class.pulse]="pulse">
        <div class="noc-kpi-icon">🚚</div>
        <div class="noc-kpi-label">Transferências</div>
        <div class="noc-kpi-value">{{ kpi?.totalTransferencias }}</div>
        <div class="noc-kpi-sub">romaneios</div>
      </div>
    </div>

    <!-- Gráfico linha - full width -->
    <div class="noc-panel" style="margin-bottom:14px">
      <div class="panel-header">
        <span class="panel-title">Valor transferido por dia</span>
      </div>
      <div style="position:relative;width:100%;height:180px">
        <canvas #lineChart></canvas>
      </div>
    </div>

    <!-- Grid 2 col no desktop, 1 col mobile -->
    <div class="noc-grid">
      <div class="noc-panel">
        <div class="panel-header">
          <span class="panel-title">Distribuição por categoria</span>
          <span class="panel-tag">{{ totalItens }} itens</span>
        </div>
        <div id="dist-bars" class="dist-bars"></div>
      </div>

      <div class="noc-panel">
        <div class="panel-header">
          <span class="panel-title">Top produtos produzidos</span>
          <span class="panel-tag">Top 8</span>
        </div>
        <div class="ranking-list" id="ranking-container"></div>
      </div>
    </div>

    <!-- Feed -->
    <div class="noc-panel">
      <div class="panel-header">
        <span class="panel-title">Movimentações recentes</span>
        <span class="live-indicator"><span class="live-dot"></span>AO VIVO</span>
      </div>
      <div class="feed-grid">
        <div *ngFor="let ev of feedItems; trackBy: trackById" class="feed-item" [class.new]="ev.novo">
          <div class="feed-type" [class.prod]="ev.tipo==='producao'" [class.transf]="ev.tipo==='transferencia'">
            {{ ev.tipo === 'producao' ? 'PROD' : 'TRANSF' }}
          </div>
          <div class="feed-info">
            <span class="feed-nome">{{ ev.nome }}</span>
            <span class="feed-data">{{ ev.data | date:'dd/MM HH:mm' }}</span>
          </div>
          <span class="feed-valor">{{ ev.valor }}</span>
        </div>
        <div class="empty-state" *ngIf="!feedItems.length" style="grid-column:1/-1">Aguardando movimentações...</div>
      </div>
    </div>
  </div>
  `,
  styles: [`
    .noc-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px; }
    .noc-kpis { display: grid; grid-template-columns: repeat(3,1fr); gap: 10px; margin-bottom: 16px; }
    @media (max-width: 768px) {
      .noc-grid { grid-template-columns: 1fr; }
      .noc-kpis { grid-template-columns: 1fr; gap: 8px; }
      .noc-kpi-value { font-size: 22px !important; }
    }
    @media (min-width: 769px) and (max-width: 1024px) {
      .noc-kpis { grid-template-columns: repeat(3,1fr); }
    }
  `]
})
export class RelatorioComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('lineChart') lineRef!: ElementRef<HTMLCanvasElement>;
  periodo: 'dia'|'semana'|'mes' = 'semana';
  kpi: any = null;
  clock = ''; pulse = false;
  feedItems: any[] = [];
  totalItens = 0;
  get periodoLabel() { return this.periodo==='dia'?'hoje':this.periodo==='semana'?'7 dias':'30 dias'; }
  private charts: { line?: Chart } = {};
  private subs = new Subscription();
  private lastLen = 0;
  constructor(private svc: PadariaService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.subs.add(interval(1000).subscribe(() => { this.clock = new Date().toLocaleTimeString('pt-BR'); this.cdr.markForCheck(); }));
    this.subs.add(this.svc.kpi$.subscribe(k => { this.kpi = k; this.pulse = true; setTimeout(() => { this.pulse = false; this.cdr.markForCheck(); }, 600); this.updateCharts(); this.cdr.markForCheck(); }));
    this.subs.add(this.svc.historico$.subscribe(h => { if (h.length !== this.lastLen) { this.lastLen = h.length; this.buildFeed(h); this.updateCharts(); this.cdr.markForCheck(); } }));
    this.subs.add(interval(60000).subscribe(() => this.updateCharts()));
  }
  ngAfterViewInit() { setTimeout(() => this.buildLine(), 150); }
  ngOnDestroy() { this.subs.unsubscribe(); this.charts.line?.destroy(); }

  setPeriodo(p: 'dia'|'semana'|'mes') { this.periodo = p; this.svc.setPeriodo(p); setTimeout(() => this.updateCharts(), 100); }

  private filtrar(tipo: string) {
    const now = new Date();
    return this.svc.historico.filter(h => {
      if (h.tipo !== tipo) return false;
      const d = new Date(h.data);
      if (this.periodo === 'dia') return d.toDateString() === now.toDateString();
      if (this.periodo === 'semana') { const s = new Date(now); s.setDate(s.getDate()-6); return d >= s; }
      const s = new Date(now); s.setDate(s.getDate()-29); return d >= s;
    });
  }

  private getEvolucao() {
    const now = new Date();
    const days = this.periodo==='dia'?1:this.periodo==='semana'?7:30;
    return Array.from({length:days},(_,i) => {
      const d = new Date(now); d.setDate(d.getDate()-(days-1-i));
      const label = d.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'});
      const transfs = this.svc.historico.filter(h => h.tipo==='transferencia' && new Date(h.data).toDateString()===d.toDateString()) as RegistroTransferencia[];
      return { label, valor: transfs.reduce((s,h)=>s+h.total,0) };
    });
  }

  private buildFeed(hist: any[]) {
    this.feedItems = hist.slice(0,10).map((h,i) => ({
      id: h.id, tipo: h.tipo,
      nome: h.tipo==='producao' ? (h as RegistroProducao).produto.nome : `${(h as RegistroTransferencia).itens.length} itens transferidos`,
      data: new Date(h.data),
      valor: h.tipo==='producao' ? `${(h as RegistroProducao).qty.toFixed(2)} ${(h as RegistroProducao).unit}` : `R$ ${(h as RegistroTransferencia).total.toFixed(2)}`,
      novo: i===0
    }));
  }
  trackById(_: number, item: any) { return item.id; }

  private buildLine() {
    if (!this.lineRef?.nativeElement) return;
    const ev = this.getEvolucao();
    const ctx = this.lineRef.nativeElement.getContext('2d')!;
    const grad = ctx.createLinearGradient(0,0,0,180);
    grad.addColorStop(0,'rgba(46,125,50,.2)'); grad.addColorStop(1,'rgba(46,125,50,0)');
    this.charts.line = new Chart(this.lineRef.nativeElement, {
      type: 'line',
      data: { labels: ev.map(e=>e.label), datasets: [{ data: ev.map(e=>e.valor), borderColor:'#2E7D32', backgroundColor:grad, pointRadius:3, pointBackgroundColor:'#2E7D32', pointBorderColor:'#F7F5F0', pointBorderWidth:2, tension:0.4, fill:true, borderWidth:2 }] },
      options: { responsive:true, maintainAspectRatio:false, animation:{duration:400},
        plugins:{ legend:{display:false}, tooltip:{backgroundColor:'#fff',borderColor:'rgba(0,0,0,.1)',borderWidth:1,titleColor:'#333',bodyColor:'#555', callbacks:{label:(c:any)=>` R$ ${c.raw.toFixed(2)}`}} },
        scales:{ y:{ticks:{callback:(v:any)=>'R$'+Number(v).toFixed(0),color:'#999',font:{size:11}},grid:{color:'rgba(0,0,0,.04)'},border:{display:false}}, x:{ticks:{color:'#999',font:{size:11},autoSkip:true,maxRotation:0},grid:{display:false},border:{display:false}} }
      }
    });
  }

  private updateCharts() {
    if (!this.lineRef) return;
    const ev = this.getEvolucao();
    if (!this.charts.line) { this.buildLine(); return; }
    this.charts.line.data.labels = ev.map(e=>e.label);
    this.charts.line.data.datasets[0].data = ev.map(e=>e.valor);
    this.charts.line.update('active');
    this.buildDist(); this.buildRanking();
  }

  private buildDist() {
    const transfs = this.filtrar('transferencia') as RegistroTransferencia[];
    const map_: Record<string,number> = {};
    transfs.forEach(t => t.itens.forEach(i => { const cat=i.produto.nome.split(' ')[0]; map_[cat]=(map_[cat]||0)+i.qty; }));
    const sorted = Object.entries(map_).sort((a,b)=>b[1]-a[1]).slice(0,6);
    const colors = ['#2E7D32','#388E3C','#43A047','#C62828','#E53935','#EF9A9A'];
    this.totalItens = Math.round(sorted.reduce((s,x)=>s+x[1],0));
    const total = this.totalItens || 1;
    const el = document.getElementById('dist-bars'); if (!el) return;
    el.innerHTML = sorted.map((x,i) => {
      const pct = ((x[1]/total)*100).toFixed(1);
      return `<div class="dist-bar-item">
        <div class="dist-bar-header"><span class="dist-bar-label">${x[0]}</span><span class="dist-bar-val">${x[1].toFixed(1)} <span style="color:#999;font-size:10px">${pct}%</span></span></div>
        <div class="dist-bar-track"><div class="dist-bar-fill" style="width:${pct}%;background:${colors[i]};transition:width .6s ease"></div></div>
      </div>`;
    }).join('') || '<div style="padding:1rem;color:#999;font-size:13px">Sem dados</div>';
    this.cdr.markForCheck();
  }

  private buildRanking() {
    const prods = this.filtrar('producao') as RegistroProducao[];
    const map_: Record<string,{nome:string;qty:number}> = {};
    prods.forEach(h => { if (!map_[h.produto.codigo]) map_[h.produto.codigo]={nome:h.produto.nome,qty:0}; map_[h.produto.codigo].qty+=h.qty; });
    const sorted = Object.values(map_).sort((a,b)=>b.qty-a.qty).slice(0,8);
    const max = sorted[0]?.qty||1;
    const colors = ['#2E7D32','#2E7D32','#388E3C','#43A047','#9E9E9E','#9E9E9E','#9E9E9E','#9E9E9E'];
    const el = document.getElementById('ranking-container'); if (!el) return;
    el.innerHTML = sorted.map((item,i) => `
      <div class="rank-item">
        <span class="rank-pos">${i+1}</span>
        <div class="rank-info">
          <div class="rank-nome">${item.nome}</div>
          <div class="rank-track"><div class="rank-fill" style="width:${((item.qty/max)*100).toFixed(1)}%;background:${colors[i]}"></div></div>
        </div>
        <span class="rank-val">${item.qty.toFixed(1)}</span>
      </div>`).join('') || '<div class="empty-state" style="padding:1rem">Sem dados</div>';
  }
}
