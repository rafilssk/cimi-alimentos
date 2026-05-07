import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
  <div class="login-shell">
    <!-- Animated background -->
    <div class="bg-grid"></div>
    <div class="bg-glow g1"></div>
    <div class="bg-glow g2"></div>
    <div class="bg-glow g3"></div>

    <div class="login-card">
      <div class="card-glow"></div>

      <div class="login-logo">
        <div class="logo-ring">
          <span class="logo-letter">C</span>
        </div>
        <div>
          <div class="logo-text"><span class="lc">c</span><span class="limi">imi</span></div>
          <div class="logo-sub">ALIMENTOS · SISTEMA</div>
        </div>
      </div>

      <div class="login-headline">Bem-vindo de volta</div>
      <div class="login-sub">Entre com suas credenciais para acessar o sistema</div>

      <div class="login-form">
        <div class="field-wrap">
          <div class="field-icon">
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><circle cx="7.5" cy="5" r="3" stroke="currentColor" stroke-width="1.3"/><path d="M1.5 13c0-3.314 2.686-6 6-6s6 2.686 6 6" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>
          </div>
          <input type="email" [(ngModel)]="email" placeholder="seu@email.com" (keydown.enter)="entrar()" [disabled]="loading()" autocomplete="email">
        </div>

        <div class="field-wrap">
          <div class="field-icon">
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><rect x="2.5" y="6.5" width="10" height="7" rx="1.5" stroke="currentColor" stroke-width="1.3"/><path d="M5 6.5V4.5a2.5 2.5 0 015 0v2" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>
          </div>
          <input [type]="showPass?'text':'password'" [(ngModel)]="senha" placeholder="••••••••" (keydown.enter)="entrar()" [disabled]="loading()" autocomplete="current-password">
          <button class="eye-btn" (click)="showPass=!showPass" type="button" tabindex="-1">
            <svg *ngIf="!showPass" width="15" height="15" viewBox="0 0 15 15" fill="none"><ellipse cx="7.5" cy="7.5" rx="5.5" ry="3.5" stroke="currentColor" stroke-width="1.3"/><circle cx="7.5" cy="7.5" r="1.8" fill="currentColor"/></svg>
            <svg *ngIf="showPass"  width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M2 2l11 11M5.5 5.8A3.5 3.5 0 009.2 9.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/><path d="M3.5 4.5C2.3 5.5 1.5 6.5 1.5 7.5c0 2 2.7 3.5 6 3.5a7 7 0 002-.3M7 4c2.8.3 5 1.7 5 3.5 0 .4-.1.8-.4 1.2" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>
          </button>
        </div>

        <div class="login-erro" *ngIf="erro()">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" stroke="#F85149" stroke-width="1.3"/><path d="M7 4.5v3M7 9.5v.3" stroke="#F85149" stroke-width="1.5" stroke-linecap="round"/></svg>
          {{ erro() }}
        </div>

        <button class="btn-entrar" (click)="entrar()" [disabled]="loading()">
          <span class="btn-bg"></span>
          <span class="btn-content">
            <span *ngIf="!loading()">Entrar no sistema</span>
            <span *ngIf="loading()" class="spinner"></span>
          </span>
        </button>
      </div>

      <div class="login-footer">
        <span>🔒 Acesso restrito · Cimi Alimentos</span>
      </div>
    </div>
  </div>
  `,
  styles: [`
    .login-shell {
      min-height: 100vh;
      background: #05080D;
      display: flex; align-items: center; justify-content: center;
      padding: 20px; position: relative; overflow: hidden;
    }

    /* Animated grid */
    .bg-grid {
      position: absolute; inset: 0;
      background-image:
        linear-gradient(rgba(46,200,102,.04) 1px, transparent 1px),
        linear-gradient(90deg, rgba(46,200,102,.04) 1px, transparent 1px);
      background-size: 48px 48px;
      mask-image: radial-gradient(ellipse at center, black 30%, transparent 80%);
    }

    /* Glow orbs */
    .bg-glow { position: absolute; border-radius: 50%; pointer-events: none; filter: blur(60px); animation: orbFloat 8s ease-in-out infinite; }
    .g1 { width:500px; height:500px; background:rgba(46,200,102,.08); top:-150px; left:-150px; animation-delay:0s; }
    .g2 { width:400px; height:400px; background:rgba(248,81,73,.06); bottom:-100px; right:-100px; animation-delay:3s; }
    .g3 { width:300px; height:300px; background:rgba(88,166,255,.05); top:50%; left:50%; transform:translate(-50%,-50%); animation-delay:6s; }
    @keyframes orbFloat { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(20px,-20px) scale(1.05)} 66%{transform:translate(-15px,15px) scale(.95)} }

    /* Card */
    .login-card {
      background: rgba(13,18,25,.85);
      border: 1px solid rgba(255,255,255,.08);
      border-radius: 24px; padding: 44px 40px; width: 100%; max-width: 420px;
      position: relative; z-index: 1; overflow: hidden;
      backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
      box-shadow: 0 40px 80px rgba(0,0,0,.7), 0 0 0 1px rgba(255,255,255,.04), inset 0 1px 0 rgba(255,255,255,.06);
    }
    .card-glow { position:absolute; top:-80px; left:50%; transform:translateX(-50%); width:300px; height:200px; background:radial-gradient(circle,rgba(46,200,102,.12),transparent 70%); pointer-events:none; animation:cardGlow 4s ease-in-out infinite; }
    @keyframes cardGlow { 0%,100%{opacity:.6} 50%{opacity:1} }

    /* Logo */
    .login-logo { display:flex; align-items:center; gap:16px; margin-bottom:28px; }
    .logo-ring { width:52px; height:52px; border-radius:16px; background:linear-gradient(135deg,rgba(248,81,73,.15),rgba(248,81,73,.05)); border:1px solid rgba(248,81,73,.2); display:flex; align-items:center; justify-content:center; box-shadow:0 0 20px rgba(248,81,73,.15); flex-shrink:0; }
    .logo-letter { font-size:24px; font-weight:900; color:#F85149; filter:drop-shadow(0 0 8px rgba(248,81,73,.5)); }
    .logo-text { display:flex; align-items:baseline; }
    .lc,.limi { font-size:30px; font-weight:900; color:#F85149; letter-spacing:-.03em; line-height:1; filter:drop-shadow(0 0 10px rgba(248,81,73,.4)); }
    .logo-sub { font-size:9px; font-weight:700; letter-spacing:.22em; color:rgba(46,200,102,.5); text-transform:uppercase; margin-top:2px; }

    .login-headline { font-size:20px; font-weight:800; color:#E8EFF8; letter-spacing:-.03em; margin-bottom:6px; }
    .login-sub { font-size:13px; color:#4A5568; margin-bottom:28px; line-height:1.55; }

    /* Fields */
    .login-form { }
    .field-wrap {
      position: relative; margin-bottom: 14px;
      input {
        width:100%; padding:12px 42px; background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.08);
        border-radius:12px; font-size:14px; color:#E8EFF8; outline:none; transition:all .2s;
        &::placeholder { color:#4A5568; }
        &:focus { border-color:#2EC866; background:rgba(46,200,102,.05); box-shadow:0 0 0 3px rgba(46,200,102,.12),0 0 20px rgba(46,200,102,.08); }
        &:disabled { opacity:.4; }
      }
    }
    .field-icon { position:absolute; left:14px; top:50%; transform:translateY(-50%); color:#4A5568; pointer-events:none; transition:color .2s; }
    .field-wrap:focus-within .field-icon { color:#2EC866; }
    .eye-btn { position:absolute; right:12px; top:50%; transform:translateY(-50%); background:none; border:none; color:#4A5568; cursor:pointer; padding:4px; display:flex; transition:color .15s; &:hover{color:#8A95A3;} }

    .login-erro { display:flex; align-items:center; gap:8px; background:rgba(248,81,73,.1); border:1px solid rgba(248,81,73,.2); border-radius:10px; padding:11px 14px; font-size:13px; color:#F85149; margin-bottom:14px; box-shadow:0 0 16px rgba(248,81,73,.08); }

    .btn-entrar {
      width:100%; padding:14px; border:none; border-radius:12px; cursor:pointer;
      position:relative; overflow:hidden; margin-top:4px; min-height:50px;
      display:flex; align-items:center; justify-content:center;
      transition:transform .2s, box-shadow .2s;
      &:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 12px 36px rgba(46,200,102,.4); }
      &:active:not(:disabled) { transform:translateY(0); }
      &:disabled { opacity:.5; cursor:not-allowed; }
    }
    .btn-bg { position:absolute; inset:0; background:linear-gradient(135deg,#2EC866,#1A9E4A); transition:filter .2s; }
    .btn-entrar:hover .btn-bg { filter:brightness(1.12); }
    .btn-content { position:relative; z-index:1; font-size:15px; font-weight:800; color:#fff; letter-spacing:-.01em; display:flex; align-items:center; gap:8px; }

    .spinner { width:22px; height:22px; border-radius:50%; border:2.5px solid rgba(255,255,255,.3); border-top-color:#fff; animation:spin .7s linear infinite; }
    @keyframes spin { to { transform:rotate(360deg); } }

    .login-footer { text-align:center; font-size:11px; color:#2A3545; margin-top:28px; }

    @media(max-width:480px) {
      .login-card { padding:32px 24px; border-radius:20px; }
      .lc,.limi { font-size:26px; }
      .login-headline { font-size:18px; }
    }
  `]
})
export class LoginComponent {
  email = ''; senha = ''; showPass = false;
  loading = signal(false); erro = signal('');
  constructor(private auth: AuthService, private router: Router) {
    if (this.auth.isLoggedIn) this.router.navigate([this.auth.isGerente ? '/dashboard' : '/producao']);
  }
  async entrar() {
    if (!this.email || !this.senha) { this.erro.set('Preencha e-mail e senha'); return; }
    this.loading.set(true); this.erro.set('');
    const err = await this.auth.login(this.email, this.senha);
    this.loading.set(false);
    if (err) this.erro.set('E-mail ou senha incorretos');
    else this.router.navigate([this.auth.isGerente ? '/dashboard' : '/producao']);
  }
}