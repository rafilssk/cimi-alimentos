import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subscription, interval } from 'rxjs';
import { map } from 'rxjs/operators';
import { PadariaService } from './core/services/padaria.service';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  template: `
  <router-outlet *ngIf="isLoginPage"></router-outlet>

  <div class="shell" [class.collapsed]="collapsed" [class.mobile-open]="mobileOpen" *ngIf="!isLoginPage">

    <div class="sidebar-overlay" (click)="mobileOpen=false" [class.visible]="mobileOpen"></div>

    <aside class="sidebar">
      <!-- Glow decoration -->
      <div class="sidebar-glow"></div>

      <!-- Logo -->
      <div class="sidebar-logo-area">
        <div class="logo-full" *ngIf="!collapsed || isMobile">
          <div class="logo-mark">
            <span class="logo-c">c</span><span class="logo-imi">imi</span>
          </div>
          <div class="logo-tag">ALIMENTOS · SISTEMA</div>
        </div>
        <div class="logo-mini-wrap" *ngIf="collapsed && !isMobile">
          <span class="logo-mini-c">C</span>
        </div>
        <button class="mobile-close" *ngIf="isMobile" (click)="mobileOpen=false">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 3l10 10M13 3L3 13" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
        </button>
      </div>

      <!-- Toggle desktop -->
      <button class="sidebar-toggle" *ngIf="!isMobile" (click)="collapsed=!collapsed">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" [style.transform]="collapsed?'rotate(180deg)':'none'" style="transition:transform .3s">
          <path d="M9 11L5 7l4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>

      <!-- User badge -->
      <div class="sidebar-user-badge" *ngIf="!collapsed || isMobile">
        <div class="user-avatar">{{ userInitial }}</div>
        <div class="user-info">
          <div class="user-name">{{ userEmail }}</div>
          <div class="user-role">{{ isGerente ? '👑 Gerente' : '⚙️ Operador' }}</div>
        </div>
      </div>

      <!-- Status chip -->
      <div class="status-chip" *ngIf="!collapsed || isMobile">
        <span class="status-pulse"></span>
        <span>{{ prodCount }} produtos ativos</span>
      </div>

      <!-- Nav -->
      <nav class="sidebar-nav">
        <div class="nav-section" *ngIf="!collapsed || isMobile">MENU</div>

        <a routerLink="/producao" routerLinkActive="active" class="nav-item" (click)="onNavClick()" [title]="collapsed&&!isMobile?'Produção':''">
          <div class="nav-icon-box">
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor"><circle cx="10" cy="10" r="7" stroke-width="1.5"/><path d="M10 7v3l2 2" stroke-width="1.5" stroke-linecap="round"/></svg>
          </div>
          <span class="nav-label" *ngIf="!collapsed||isMobile">Produção</span>
          <div class="nav-active-bar"></div>
        </a>

        <a routerLink="/transferencia" routerLinkActive="active" class="nav-item" (click)="onNavClick()" [title]="collapsed&&!isMobile?'Transferência':''">
          <div class="nav-icon-box">
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor"><path d="M3 10h14M13 6l4 4-4 4" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </div>
          <span class="nav-label" *ngIf="!collapsed||isMobile">Transferência</span>
          <span class="nav-count" *ngIf="romaneioCount>0&&(!collapsed||isMobile)">{{ romaneioCount }}</span>
          <div class="nav-active-bar"></div>
        </a>

        <ng-container *ngIf="isGerente">
          <a routerLink="/dashboard" routerLinkActive="active" class="nav-item" (click)="onNavClick()" [title]="collapsed&&!isMobile?'Painel':''">
            <div class="nav-icon-box">
              <svg viewBox="0 0 20 20" fill="currentColor"><rect x="2" y="2" width="7" height="7" rx="2"/><rect x="11" y="2" width="7" height="7" rx="2"/><rect x="2" y="11" width="7" height="7" rx="2"/><rect x="11" y="11" width="7" height="7" rx="2"/></svg>
            </div>
            <span class="nav-label" *ngIf="!collapsed||isMobile">Painel</span>
            <div class="nav-active-bar"></div>
          </a>
          <a routerLink="/estoque" routerLinkActive="active" class="nav-item" (click)="onNavClick()" [title]="collapsed&&!isMobile?'Estoque':''">
            <div class="nav-icon-box">
              <svg viewBox="0 0 20 20" fill="currentColor"><rect x="2" y="4" width="16" height="3" rx="1.5"/><rect x="2" y="9" width="16" height="3" rx="1.5"/><rect x="2" y="14" width="16" height="3" rx="1.5"/></svg>
            </div>
            <span class="nav-label" *ngIf="!collapsed||isMobile">Estoque</span>
            <div class="nav-active-bar"></div>
          </a>
        </ng-container>

        <div class="nav-divider" *ngIf="isGerente && (!collapsed||isMobile)">
          <span>ANÁLISE</span>
        </div>

        <ng-container *ngIf="isGerente">
          <a routerLink="/relatorio" routerLinkActive="active" class="nav-item nav-noc" (click)="onNavClick()" [title]="collapsed&&!isMobile?'NOC':''">
            <div class="nav-icon-box noc-box">
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor"><path d="M2 14l4-5 4 3 5-7" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="17" cy="5" r="2" fill="currentColor" stroke="none"/></svg>
            </div>
            <span class="nav-label" *ngIf="!collapsed||isMobile">Relatório NOC</span>
            <span class="live-badge" *ngIf="!collapsed||isMobile">LIVE</span>
            <div class="nav-active-bar"></div>
          </a>
          <a routerLink="/historico" routerLinkActive="active" class="nav-item" (click)="onNavClick()" [title]="collapsed&&!isMobile?'Histórico':''">
            <div class="nav-icon-box">
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor"><path d="M4 6h12M4 10h8M4 14h10" stroke-width="1.5" stroke-linecap="round"/></svg>
            </div>
            <span class="nav-label" *ngIf="!collapsed||isMobile">Histórico</span>
            <div class="nav-active-bar"></div>
          </a>
          <a routerLink="/importar" routerLinkActive="active" class="nav-item" (click)="onNavClick()" [title]="collapsed&&!isMobile?'Importar':''">
            <div class="nav-icon-box">
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor"><path d="M10 3v10M6 9l4 4 4-4" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M3 15h14" stroke-width="1.5" stroke-linecap="round"/></svg>
            </div>
            <span class="nav-label" *ngIf="!collapsed||isMobile">Importar MGV</span>
            <div class="nav-active-bar"></div>
          </a>
        </ng-container>
      </nav>

      <!-- KPI strip -->
      <div class="sidebar-kpi-strip" *ngIf="kpi && (!collapsed||isMobile)">
        <div class="kpi-mini">
          <div class="kpi-mini-val">{{ kpi.valorTransferido | currency:'BRL':'symbol':'1.0-0' }}</div>
          <div class="kpi-mini-lbl">Transferido hoje</div>
        </div>
        <div class="kpi-mini">
          <div class="kpi-mini-val">{{ kpi.totalTransferencias }}</div>
          <div class="kpi-mini-lbl">Romaneios</div>
        </div>
      </div>

      <!-- Bottom actions -->
      <div class="sidebar-bottom" *ngIf="!collapsed||isMobile">
        <button class="theme-btn" (click)="toggleTheme()" [title]="isDark?'Modo claro':'Modo escuro'">
          <svg *ngIf="isDark"  width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="3.5" fill="currentColor"/><path d="M8 1v1.5M8 13.5V15M1 8h1.5M13.5 8H15M3.2 3.2l1 1M11.8 11.8l1 1M11.8 4.2l-1 1M4.2 11.8l-1 1" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>
          <svg *ngIf="!isDark" width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M13 9.5A5.5 5.5 0 016.5 3a5.5 5.5 0 100 11A5.5 5.5 0 0013 9.5z" fill="currentColor"/></svg>
          <span>{{ isDark ? 'Modo claro' : 'Modo escuro' }}</span>
        </button>
        <button class="logout-btn" (click)="logout()">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M6 14H3a1 1 0 01-1-1V3a1 1 0 011-1h3M11 11l3-3-3-3M14 8H6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          <span>Sair</span>
        </button>
      </div>
    </aside>

    <!-- MAIN -->
    <main class="main-content">
      <header class="topbar">
        <button class="hamburger" *ngIf="isMobile" (click)="mobileOpen=true">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
        </button>
        <div class="topbar-brand" *ngIf="isMobile">
          <span class="tb-c">c</span><span class="tb-imi">imi</span>
        </div>
        <div class="topbar-right">
          <div class="topbar-clock">
            <span class="clock-icon">⏱</span>{{ clock }}
          </div>
        </div>
      </header>
      <div class="page-content">
        <router-outlet />
      </div>
    </main>
  </div>
  `,
  styles: [`
    :host { display: block; }

    .shell { display: grid; grid-template-columns: 260px 1fr; min-height: 100vh; transition: grid-template-columns .28s cubic-bezier(.4,0,.2,1); }
    .shell.collapsed { grid-template-columns: 72px 1fr; }

    .sidebar-overlay { display:none; position:fixed; inset:0; background:rgba(0,0,0,.6); z-index:40; backdrop-filter:blur(4px); opacity:0; transition:opacity .25s; &.visible{opacity:1;} }

    /* ─── SIDEBAR ─── */
    .sidebar {
      background: linear-gradient(180deg, #0A0E14 0%, #0D1219 50%, #0A0F15 100%);
      border-right: 1px solid rgba(46,200,102,.08);
      display: flex; flex-direction: column;
      position: sticky; top: 0; height: 100vh;
      overflow: hidden; z-index: 50;
      box-shadow: 4px 0 30px rgba(0,0,0,.4), inset -1px 0 0 rgba(46,200,102,.06);
    }

    .sidebar-glow {
      position: absolute; top: -60px; left: -60px;
      width: 200px; height: 200px;
      background: radial-gradient(circle, rgba(46,200,102,.15) 0%, transparent 70%);
      pointer-events: none; z-index: 0;
      animation: glowPulse 4s ease-in-out infinite;
    }
    @keyframes glowPulse { 0%,100%{opacity:.6;transform:scale(1)} 50%{opacity:1;transform:scale(1.1)} }

    /* Logo */
    .sidebar-logo-area {
      padding: 22px 18px 16px;
      border-bottom: 1px solid rgba(255,255,255,.05);
      display: flex; align-items: center; justify-content: space-between;
      position: relative; z-index: 1;
    }
    .logo-mark { display:flex; align-items:baseline; line-height:1; }
    .logo-c    { font-size:38px; font-weight:900; color:#F85149; letter-spacing:-.03em; filter:drop-shadow(0 0 12px rgba(248,81,73,.4)); }
    .logo-imi  { font-size:38px; font-weight:900; color:#F85149; letter-spacing:-.03em; filter:drop-shadow(0 0 12px rgba(248,81,73,.4)); }
    .logo-tag  { font-size:9px; font-weight:700; letter-spacing:.22em; color:rgba(46,200,102,.6); text-transform:uppercase; margin-top:2px; }
    .logo-mini-wrap { display:flex; align-items:center; justify-content:center; width:100%; }
    .logo-mini-c { font-size:28px; font-weight:900; color:#F85149; filter:drop-shadow(0 0 8px rgba(248,81,73,.5)); }
    .mobile-close { background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.08); color:rgba(255,255,255,.5); width:32px; height:32px; border-radius:8px; cursor:pointer; display:flex; align-items:center; justify-content:center; }

    /* Toggle */
    .sidebar-toggle {
      position: absolute; right: -13px; top: 84px;
      width: 26px; height: 26px; border-radius: 50%;
      background: linear-gradient(135deg, #2EC866, #1A9E4A);
      border: 2px solid #0A0E14; color: #fff; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      z-index: 60; box-shadow: 0 0 16px rgba(46,200,102,.5);
      transition: all .2s; padding: 0;
      &:hover { transform: scale(1.15); box-shadow: 0 0 24px rgba(46,200,102,.7); }
    }

    /* User badge */
    .sidebar-user-badge {
      display: flex; align-items: center; gap: 10px;
      margin: 12px 14px 8px;
      background: rgba(255,255,255,.04);
      border: 1px solid rgba(255,255,255,.07);
      border-radius: 12px; padding: 10px 12px;
      position: relative; z-index: 1;
    }
    .user-avatar {
      width: 34px; height: 34px; border-radius: 10px;
      background: linear-gradient(135deg, #2EC866, #1A6E3A);
      display: flex; align-items: center; justify-content: center;
      font-size: 14px; font-weight: 800; color: #fff; flex-shrink: 0;
      box-shadow: 0 0 12px rgba(46,200,102,.3);
    }
    .user-info { min-width: 0; }
    .user-name { font-size: 11px; font-weight: 600; color: rgba(255,255,255,.8); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .user-role { font-size: 10px; color: rgba(46,200,102,.7); margin-top: 1px; }

    /* Status */
    .status-chip {
      display: flex; align-items: center; gap: 7px;
      margin: 0 14px 10px;
      font-size: 11px; color: rgba(255,255,255,.3);
      position: relative; z-index: 1;
    }
    .status-pulse {
      width: 7px; height: 7px; border-radius: 50%;
      background: #2EC866; box-shadow: 0 0 8px #2EC866;
      animation: statusPulse 2s infinite;
      flex-shrink: 0;
    }
    @keyframes statusPulse { 0%,100%{box-shadow:0 0 0 0 rgba(46,200,102,.6)} 50%{box-shadow:0 0 0 5px rgba(46,200,102,0)} }

    /* Nav */
    .sidebar-nav { flex:1; padding:6px 10px; overflow-y:auto; overflow-x:hidden; position:relative; z-index:1; &::-webkit-scrollbar{width:0;} }
    .nav-section { font-size:9px; font-weight:800; letter-spacing:.14em; color:rgba(255,255,255,.2); padding:10px 8px 6px; }
    .nav-divider { display:flex; align-items:center; gap:8px; padding:12px 6px 6px; span{font-size:9px;font-weight:800;letter-spacing:.14em;color:rgba(255,255,255,.2);} &::before,&::after{content:'';flex:1;height:1px;background:rgba(255,255,255,.06);} }

    .nav-item {
      display: flex; align-items: center; gap: 10px;
      padding: 9px 10px; border-radius: 12px; margin-bottom: 2px;
      color: rgba(255,255,255,.45); text-decoration: none;
      font-size: 13px; font-weight: 500;
      transition: all .18s cubic-bezier(.4,0,.2,1);
      position: relative; overflow: hidden;
      &::before { content:''; position:absolute; inset:0; background:linear-gradient(135deg,rgba(46,200,102,.08),transparent); opacity:0; border-radius:inherit; transition:opacity .18s; }
      &:hover { color:rgba(255,255,255,.85); background:rgba(255,255,255,.04); &::before{opacity:1;} }
      &.active {
        color: #2EC866;
        background: rgba(46,200,102,.08);
        border: 1px solid rgba(46,200,102,.15);
        &::before { opacity: 1; }
        .nav-icon-box { background: rgba(46,200,102,.15); color: #2EC866; box-shadow: 0 0 12px rgba(46,200,102,.2); }
        .nav-active-bar { opacity: 1; }
      }
      &.nav-noc.active { color:#F0883E; background:rgba(240,136,62,.08); border-color:rgba(240,136,62,.15); .nav-icon-box{background:rgba(240,136,62,.12);color:#F0883E;box-shadow:0 0 12px rgba(240,136,62,.2);} }
    }
    .nav-icon-box {
      width: 32px; height: 32px; border-radius: 9px;
      background: rgba(255,255,255,.05);
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0; transition: all .18s;
      svg { width: 16px; height: 16px; }
    }
    .noc-box { background: rgba(240,136,62,.08); color: #F0883E; }
    .nav-label { flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .nav-active-bar { position:absolute; right:0; top:20%; bottom:20%; width:3px; background:linear-gradient(180deg,#2EC866,#1A9E4A); border-radius:2px 0 0 2px; opacity:0; box-shadow:0 0 8px #2EC866; transition:opacity .18s; }
    .nav-count { background:linear-gradient(135deg,#2EC866,#1A9E4A); color:#fff; border-radius:8px; font-size:10px; font-weight:800; padding:2px 7px; box-shadow:0 0 10px rgba(46,200,102,.4); }
    .live-badge { font-size:9px; font-weight:900; background:linear-gradient(135deg,#F85149,#C62828); color:#fff; border-radius:5px; padding:2px 6px; letter-spacing:.06em; box-shadow:0 0 10px rgba(248,81,73,.4); animation:liveBlink 2s infinite; }
    @keyframes liveBlink { 0%,100%{opacity:1} 50%{opacity:.5} }

    /* KPI strip */
    .sidebar-kpi-strip {
      display: grid; grid-template-columns: 1fr 1fr;
      margin: 8px 12px; gap: 8px;
      border-top: 1px solid rgba(255,255,255,.05);
      padding-top: 12px;
      position: relative; z-index: 1;
    }
    .kpi-mini {
      background: rgba(255,255,255,.03); border: 1px solid rgba(255,255,255,.06);
      border-radius: 10px; padding: 8px 10px;
      .kpi-mini-val { font-size: 13px; font-weight: 800; color: #2EC866; font-family: 'JetBrains Mono', monospace; }
      .kpi-mini-lbl { font-size: 9px; color: rgba(255,255,255,.25); margin-top: 2px; text-transform: uppercase; letter-spacing: .05em; }
    }

    /* Bottom */
    .sidebar-bottom {
      display: flex; flex-direction: column; gap: 4px;
      padding: 10px 12px 16px;
      border-top: 1px solid rgba(255,255,255,.05);
      position: relative; z-index: 1;
    }
    .theme-btn, .logout-btn {
      display: flex; align-items: center; gap: 8px;
      padding: 8px 12px; border-radius: 10px; cursor: pointer;
      font-size: 12px; font-weight: 500; width: 100%;
      transition: all .15s; border: 1px solid transparent;
    }
    .theme-btn {
      background: rgba(255,255,255,.04); color: rgba(255,255,255,.45);
      border-color: rgba(255,255,255,.06);
      &:hover { background: rgba(255,255,255,.08); color: rgba(255,255,255,.8); }
    }
    .logout-btn {
      background: rgba(248,81,73,.06); color: rgba(248,81,73,.6);
      border-color: rgba(248,81,73,.1);
      &:hover { background: rgba(248,81,73,.12); color: #F85149; box-shadow: 0 0 12px rgba(248,81,73,.15); }
    }

    /* ─── MAIN ─── */
    .main-content { display:flex; flex-direction:column; background:var(--bg-base,#080C10); min-height:100vh; overflow-x:hidden; }

    .topbar {
      display: flex; align-items: center; justify-content: space-between;
      padding: 0 24px; height: 54px;
      background: rgba(13,17,25,.8);
      border-bottom: 1px solid rgba(255,255,255,.05);
      position: sticky; top: 0; z-index: 10;
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
    }
    .hamburger { background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.08); color:rgba(255,255,255,.6); width:38px; height:38px; border-radius:10px; cursor:pointer; display:flex; align-items:center; justify-content:center; }
    .topbar-brand { display:flex; align-items:baseline; flex:1; padding-left:12px; }
    .tb-c,.tb-imi { font-size:22px; font-weight:900; color:#F85149; letter-spacing:-.02em; filter:drop-shadow(0 0 8px rgba(248,81,73,.4)); }
    .topbar-right { display:flex; align-items:center; gap:12px; margin-left:auto; }
    .topbar-clock { display:flex; align-items:center; gap:6px; font-family:'JetBrains Mono',monospace; font-size:12px; color:rgba(255,255,255,.25); letter-spacing:.06em; }
    .clock-icon { font-size:13px; }

    .page-content { flex:1; padding:28px; }

    /* Mobile */
    @media (max-width:768px) {
      .shell { grid-template-columns:1fr!important; }
      .sidebar-overlay { display:block; pointer-events:none; }
      .mobile-open .sidebar-overlay { pointer-events:all; }
      .sidebar { position:fixed; left:0; top:0; bottom:0; width:280px; transform:translateX(-100%); }
      .mobile-open .sidebar { transform:translateX(0); box-shadow:8px 0 40px rgba(0,0,0,.6); }
      .sidebar-toggle { display:none; }
      .page-content { padding:16px; }
    }
    @media (min-width:769px) and (max-width:1024px) {
      .shell { grid-template-columns:72px 1fr!important; }
      .sidebar-toggle { display:none; }
    }
  `]
})
export class AppComponent implements OnInit, OnDestroy {
  collapsed = false; mobileOpen = false; isMobile = false;
  prodCount = 0; romaneioCount = 0; kpi: any = null; clock = '';
  isLoginPage = false; isDark = true;

  get isGerente()   { return this.auth.isGerente; }
  get userEmail()   { return this.auth.user?.email?.split('@')[0] || this.auth.user?.email || ''; }
  get userInitial() { return (this.auth.user?.email || 'U')[0].toUpperCase(); }

  private subs = new Subscription();
  constructor(private svc: PadariaService, private auth: AuthService, private router: Router) {
    this.router.events.subscribe(e => { if (e instanceof NavigationEnd) this.isLoginPage = e.url.includes('/login'); });
  }

  @HostListener('window:resize') onResize() { this.checkMobile(); }

  ngOnInit() {
    this.checkMobile();
    const saved = localStorage.getItem('cimi_theme') || 'dark';
    this.isDark = saved !== 'light';
    document.documentElement.setAttribute('data-theme', this.isDark ? 'dark' : 'light');
    this.subs.add(this.svc.produtos$.pipe(map(p => Object.keys(p).length)).subscribe(n => this.prodCount = n));
    this.subs.add(this.svc.romaneio$.pipe(map(r => r.length)).subscribe(n => this.romaneioCount = n));
    this.subs.add(this.svc.kpi$.subscribe(k => this.kpi = k));
    this.subs.add(interval(1000).pipe(map(() => new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit',second:'2-digit'}))).subscribe(t => this.clock = t));
  }
  ngOnDestroy() { this.subs.unsubscribe(); }
  checkMobile()  { this.isMobile = window.innerWidth <= 768; }
  onNavClick()   { if (this.isMobile) this.mobileOpen = false; }
  logout()       { this.auth.logout(); this.router.navigate(['/login']); }
  toggleTheme()  {
    this.isDark = !this.isDark;
    const t = this.isDark ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', t);
    localStorage.setItem('cimi_theme', t);
  }
}