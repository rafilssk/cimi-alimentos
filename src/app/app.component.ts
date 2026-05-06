import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subscription, interval } from 'rxjs';
import { map } from 'rxjs/operators';
import { PadariaService } from './core/services/padaria.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  template: `
  <div class="shell" [class.collapsed]="collapsed" [class.mobile-open]="mobileOpen">

    <!-- Overlay mobile -->
    <div class="sidebar-overlay" (click)="mobileOpen = false" [class.visible]="mobileOpen"></div>

    <!-- SIDEBAR -->
    <aside class="sidebar">
      <div class="sidebar-logo-area">
        <div class="sidebar-logo" *ngIf="!collapsed || isMobile">
          <div class="logo-wordmark">
            <span class="logo-c">c</span><span class="logo-imi">imi</span>
          </div>
          <div class="logo-sub">ALIMENTOS</div>
        </div>
        <div class="sidebar-logo-mini" *ngIf="collapsed && !isMobile">
          <div class="logo-mini-mark"><span class="logo-c">C</span></div>
        </div>
        <!-- Fechar no mobile -->
        <button class="mobile-close-btn" *ngIf="isMobile" (click)="mobileOpen = false">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M14 4L4 14M4 4l10 10" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
          </svg>
        </button>
      </div>

      <!-- Toggle desktop -->
      <button class="sidebar-toggle" *ngIf="!isMobile" (click)="collapsed = !collapsed" [title]="collapsed ? 'Expandir' : 'Recolher'">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
          [style.transform]="collapsed ? 'rotate(180deg)' : 'none'"
          style="transition:transform .25s ease">
          <path d="M9 11L5 7l4-4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>

      <div class="sidebar-status">
        <span class="status-dot" [class.on]="prodCount > 0"></span>
        <span class="status-text" *ngIf="!collapsed || isMobile">{{ prodCount }} produtos ativos</span>
      </div>

      <nav class="sidebar-nav">
        <a routerLink="/dashboard" routerLinkActive="active" class="nav-item" (click)="onNavClick()" [title]="collapsed && !isMobile ? 'Painel' : ''">
          <span class="nav-icon-wrap">
            <svg viewBox="0 0 20 20" fill="currentColor"><rect x="2" y="2" width="7" height="7" rx="1.5"/><rect x="11" y="2" width="7" height="7" rx="1.5"/><rect x="2" y="11" width="7" height="7" rx="1.5"/><rect x="11" y="11" width="7" height="7" rx="1.5"/></svg>
          </span>
          <span class="nav-text" *ngIf="!collapsed || isMobile">Painel</span>
        </a>
        <a routerLink="/producao" routerLinkActive="active" class="nav-item" (click)="onNavClick()" [title]="collapsed && !isMobile ? 'Produção' : ''">
          <span class="nav-icon-wrap">
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor"><circle cx="10" cy="10" r="8" stroke-width="1.5"/><path d="M10 6v4l3 2" stroke-width="1.5" stroke-linecap="round"/></svg>
          </span>
          <span class="nav-text" *ngIf="!collapsed || isMobile">Produção</span>
        </a>
        <a routerLink="/transferencia" routerLinkActive="active" class="nav-item" (click)="onNavClick()" [title]="collapsed && !isMobile ? 'Transferência' : ''">
          <span class="nav-icon-wrap">
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor"><path d="M4 10h12M12 6l4 4-4 4" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </span>
          <span class="nav-text" *ngIf="!collapsed || isMobile">Transferência</span>
          <span class="nav-badge" *ngIf="romaneioCount > 0 && (!collapsed || isMobile)">{{ romaneioCount }}</span>
        </a>
        <a routerLink="/estoque" routerLinkActive="active" class="nav-item" (click)="onNavClick()" [title]="collapsed && !isMobile ? 'Estoque' : ''">
          <span class="nav-icon-wrap">
            <svg viewBox="0 0 20 20" fill="currentColor"><rect x="2" y="4" width="16" height="3" rx="1"/><rect x="2" y="9" width="16" height="3" rx="1"/><rect x="2" y="14" width="16" height="3" rx="1"/></svg>
          </span>
          <span class="nav-text" *ngIf="!collapsed || isMobile">Estoque</span>
        </a>

        <div class="nav-sep">
          <span class="nav-sep-line"></span>
          <span class="nav-sep-label" *ngIf="!collapsed || isMobile">Análise</span>
          <span class="nav-sep-line"></span>
        </div>

        <a routerLink="/relatorio" routerLinkActive="active" class="nav-item nav-noc" (click)="onNavClick()" [title]="collapsed && !isMobile ? 'Relatório NOC' : ''">
          <span class="nav-icon-wrap">
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor"><path d="M3 14l4-5 4 3 4-6" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="17" cy="6" r="1.5" fill="currentColor" stroke="none"/></svg>
          </span>
          <span class="nav-text" *ngIf="!collapsed || isMobile">Relatório NOC</span>
          <span class="live-pill" *ngIf="!collapsed || isMobile">LIVE</span>
        </a>
        <a routerLink="/historico" routerLinkActive="active" class="nav-item" (click)="onNavClick()" [title]="collapsed && !isMobile ? 'Histórico' : ''">
          <span class="nav-icon-wrap">
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor"><path d="M4 6h12M4 10h8M4 14h10" stroke-width="1.5" stroke-linecap="round"/></svg>
          </span>
          <span class="nav-text" *ngIf="!collapsed || isMobile">Histórico</span>
        </a>

        <div class="nav-sep"><span class="nav-sep-line"></span></div>

        <a routerLink="/importar" routerLinkActive="active" class="nav-item" (click)="onNavClick()" [title]="collapsed && !isMobile ? 'Importar MGV' : ''">
          <span class="nav-icon-wrap">
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor"><path d="M10 3v10M6 9l4 4 4-4" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M3 15h14" stroke-width="1.5" stroke-linecap="round"/></svg>
          </span>
          <span class="nav-text" *ngIf="!collapsed || isMobile">Importar MGV</span>
        </a>
      </nav>

      <div class="sidebar-kpi" *ngIf="kpi && (!collapsed || isMobile)">
        <div class="kpi-row">
          <span class="kpi-lbl">Transferido hoje</span>
          <span class="kpi-val">{{ kpi.valorTransferido | currency:'BRL':'symbol':'1.0-0' }}</span>
        </div>
        <div class="kpi-row">
          <span class="kpi-lbl">Romaneios</span>
          <span class="kpi-val">{{ kpi.totalTransferencias }}</span>
        </div>
      </div>
      <div class="sidebar-version" *ngIf="!collapsed || isMobile">v1.0 · Cimi Alimentos</div>
    </aside>

    <!-- MAIN -->
    <main class="main-content">
      <div class="topbar">
        <!-- Hamburguer mobile -->
        <button class="hamburger-btn" *ngIf="isMobile" (click)="mobileOpen = true">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
          </svg>
        </button>
        <div class="topbar-brand" *ngIf="isMobile">
          <span class="tb-c">c</span><span class="tb-imi">imi</span>
        </div>
        <div class="topbar-clock">{{ clock }}</div>
      </div>
      <div class="page-content">
        <router-outlet />
      </div>
    </main>

  </div>
  `,
  styles: [`
    .shell {
      display: grid;
      grid-template-columns: 240px 1fr;
      min-height: 100vh;
      transition: grid-template-columns .25s cubic-bezier(.4,0,.2,1);
    }
    .shell.collapsed { grid-template-columns: 68px 1fr; }

    /* ── Overlay mobile ── */
    .sidebar-overlay {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,.55);
      z-index: 40;
      backdrop-filter: blur(2px);
      opacity: 0;
      transition: opacity .25s ease;
      &.visible { opacity: 1; }
    }

    /* ── SIDEBAR ── */
    .sidebar {
      background: linear-gradient(180deg, #1B3A1C 0%, #0F2210 100%);
      display: flex;
      flex-direction: column;
      position: sticky;
      top: 0;
      height: 100vh;
      overflow: hidden;
      box-shadow: 4px 0 24px rgba(0,0,0,.18);
      z-index: 50;
      transition: transform .28s cubic-bezier(.4,0,.2,1);
    }

    /* Logo */
    .sidebar-logo-area {
      padding: 22px 16px 18px;
      border-bottom: 1px solid rgba(255,255,255,.07);
      min-height: 82px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .sidebar-logo { }
    .logo-wordmark { display: flex; align-items: baseline; line-height: 1; }
    .logo-c  { font-family: 'Inter', sans-serif; font-size: 36px; font-weight: 900; color: #E53935; letter-spacing: -.02em; line-height: 1; }
    .logo-imi{ font-family: 'Inter', sans-serif; font-size: 36px; font-weight: 900; color: #E53935; letter-spacing: -.02em; line-height: 1; }
    .logo-sub{ font-family: 'Inter', sans-serif; font-size: 10px; font-weight: 700; letter-spacing: .28em; color: #81C784; margin-top: 3px; text-transform: uppercase; }
    .sidebar-logo-mini { display: flex; align-items: center; justify-content: center; width: 100%; }
    .logo-mini-mark { width: 42px; height: 42px; border-radius: 12px; background: rgba(229,57,53,.15); border: 1.5px solid rgba(229,57,53,.3); display: flex; align-items: center; justify-content: center; }

    .mobile-close-btn {
      background: rgba(255,255,255,.08); border: none; color: rgba(255,255,255,.6);
      width: 34px; height: 34px; border-radius: 8px; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: background .14s;
      &:hover { background: rgba(255,255,255,.15); color: #fff; }
    }

    .sidebar-toggle {
      position: absolute; right: -13px; top: 80px;
      width: 26px; height: 26px; border-radius: 50%;
      background: #2E7D32; border: 2px solid #F7F5F0;
      color: #fff; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      z-index: 60; box-shadow: 0 2px 10px rgba(0,0,0,.25);
      transition: background .15s, transform .1s; padding: 0;
      &:hover { background: #388E3C; transform: scale(1.1); }
    }

    .sidebar-status {
      display: flex; align-items: center; gap: 8px; padding: 10px 16px 6px;
      .status-dot { width: 7px; height: 7px; border-radius: 50%; background: rgba(255,255,255,.2); flex-shrink: 0; transition: all .3s; &.on { background: #81C784; box-shadow: 0 0 8px #81C784; } }
      .status-text { font-size: 11px; color: rgba(255,255,255,.4); white-space: nowrap; }
    }

    .sidebar-nav {
      flex: 1; padding: 8px 10px; overflow-y: auto; overflow-x: hidden;
      &::-webkit-scrollbar { width: 0; }
    }

    .nav-item {
      display: flex; align-items: center; gap: 10px; padding: 11px 10px;
      border-radius: 10px; color: rgba(255,255,255,.55);
      text-decoration: none; font-size: 13px; font-weight: 500;
      transition: all .14s ease; margin-bottom: 2px;
      white-space: nowrap; overflow: hidden; position: relative;
      &:hover { background: rgba(255,255,255,.07); color: rgba(255,255,255,.9); }
      &.active { background: rgba(129,199,132,.15); color: #A5D6A7;
        &::before { content: ''; position: absolute; left: 0; top: 20%; bottom: 20%; width: 3px; background: #81C784; border-radius: 0 3px 3px 0; }
      }
      &.nav-noc { color: rgba(255,213,127,.65);
        &:hover { background: rgba(255,152,0,.08); color: #FFD57F; }
        &.active { background: rgba(255,152,0,.12); color: #FFD57F; }
      }
    }
    .nav-icon-wrap { width: 20px; height: 20px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; svg { width: 18px; height: 18px; } }
    .nav-text { flex: 1; overflow: hidden; text-overflow: ellipsis; }
    .nav-badge { background: #2E7D32; color: #fff; border-radius: 10px; font-size: 11px; font-weight: 700; padding: 1px 7px; flex-shrink: 0; }
    .live-pill { font-size: 9px; font-weight: 800; background: #C62828; color: #fff; border-radius: 4px; padding: 2px 5px; letter-spacing: .05em; flex-shrink: 0; animation: blink 2s infinite; }
    @keyframes blink { 0%,100%{opacity:1} 50%{opacity:.35} }

    .nav-sep { display: flex; align-items: center; gap: 8px; padding: 10px 4px 6px; }
    .nav-sep-line  { flex: 1; height: 1px; background: rgba(255,255,255,.08); }
    .nav-sep-label { font-size: 10px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: rgba(255,255,255,.25); white-space: nowrap; }

    .sidebar-kpi { border-top: 1px solid rgba(255,255,255,.07); padding: 12px 16px 8px; }
    .kpi-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; &:last-child{margin-bottom:0} }
    .kpi-lbl { font-size: 11px; color: rgba(255,255,255,.35); }
    .kpi-val { font-size: 12px; font-weight: 700; font-family: 'JetBrains Mono', monospace; color: #81C784; }

    .sidebar-version { text-align: center; font-size: 10px; color: rgba(255,255,255,.18); padding: 6px 16px 14px; letter-spacing: .04em; }

    /* ── MAIN ── */
    .main-content { display: flex; flex-direction: column; background: #F7F5F0; min-height: 100vh; overflow-x: hidden; }

    .topbar {
      display: flex; align-items: center; justify-content: space-between;
      padding: 0 20px; height: 52px;
      background: #fff; border-bottom: 1px solid rgba(0,0,0,.07);
      position: sticky; top: 0; z-index: 10;
      box-shadow: 0 1px 4px rgba(0,0,0,.05);
      gap: 12px;
    }
    .hamburger-btn {
      background: none; border: none; color: #555; cursor: pointer;
      width: 40px; height: 40px; border-radius: 8px;
      display: flex; align-items: center; justify-content: center;
      transition: background .14s; flex-shrink: 0;
      &:hover { background: #f0ede6; }
    }
    .topbar-brand { display: flex; align-items: baseline; gap: 0; flex: 1; }
    .tb-c   { font-size: 22px; font-weight: 900; color: #E53935; letter-spacing: -.02em; line-height: 1; }
    .tb-imi { font-size: 22px; font-weight: 900; color: #E53935; letter-spacing: -.02em; line-height: 1; }
    .topbar-clock { font-family: 'JetBrains Mono', monospace; font-size: 12px; color: #999; letter-spacing: .06em; flex-shrink: 0; }

    .page-content { flex: 1; padding: 20px; }

    /* ── MOBILE (≤768px) ── */
    @media (max-width: 768px) {
      .shell {
        grid-template-columns: 1fr !important;
      }
      .sidebar-overlay { display: block; pointer-events: none; }
      .mobile-open .sidebar-overlay { pointer-events: all; }
      .sidebar {
        position: fixed;
        left: 0; top: 0; bottom: 0;
        width: 280px;
        transform: translateX(-100%);
        z-index: 50;
      }
      .mobile-open .sidebar {
        transform: translateX(0);
        box-shadow: 8px 0 40px rgba(0,0,0,.3);
      }
      .sidebar-toggle { display: none; }
      .page-content { padding: 14px; }
    }

    /* ── TABLET (769–1024px) ── */
    @media (min-width: 769px) and (max-width: 1024px) {
      .shell { grid-template-columns: 68px 1fr !important; }
      .sidebar-toggle { display: none; }
    }
  `]
})
export class AppComponent implements OnInit, OnDestroy {
  collapsed = false;
  mobileOpen = false;
  isMobile = false;
  prodCount = 0;
  romaneioCount = 0;
  kpi: any = null;
  clock = '';

  private subs = new Subscription();
  constructor(private svc: PadariaService) {}

  @HostListener('window:resize')
  onResize() { this.checkMobile(); }

  ngOnInit() {
    this.checkMobile();
    this.subs.add(this.svc.produtos$.pipe(map(p => Object.keys(p).length)).subscribe(n => this.prodCount = n));
    this.subs.add(this.svc.romaneio$.pipe(map(r => r.length)).subscribe(n => this.romaneioCount = n));
    this.subs.add(this.svc.kpi$.subscribe(k => this.kpi = k));
    this.subs.add(interval(1000).pipe(
      map(() => new Date().toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit', second:'2-digit' }))
    ).subscribe(t => this.clock = t));
  }

  ngOnDestroy() { this.subs.unsubscribe(); }

  checkMobile() { this.isMobile = window.innerWidth <= 768; }

  onNavClick() { if (this.isMobile) this.mobileOpen = false; }
}
