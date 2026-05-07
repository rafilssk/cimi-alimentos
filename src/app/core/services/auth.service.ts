import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

export type UserRole = 'gerente' | 'operador';

export interface AppUser {
  email: string;
  role: UserRole;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private client: SupabaseClient;
  private _user$ = new BehaviorSubject<AppUser | null>(null);

  readonly user$ = this._user$.asObservable();
  get user() { return this._user$.value; }
  get isLoggedIn() { return !!this._user$.value; }
  get isGerente() { return this._user$.value?.role === 'gerente'; }

  constructor() {
    this.client = createClient(environment.supabase.url, environment.supabase.anonKey);
    this.restoreSession();
  }

  private async restoreSession() {
    const { data } = await this.client.auth.getSession();
    if (data.session?.user) this.setUser(data.session.user);
    this.client.auth.onAuthStateChange((_event, session) => {
      if (session?.user) this.setUser(session.user);
      else this._user$.next(null);
    });
  }

  private setUser(user: User) {
    const role: UserRole = user.user_metadata?.['role'] || 'operador';
    this._user$.next({ email: user.email!, role });
  }

  async login(email: string, password: string): Promise<string | null> {
    const { error } = await this.client.auth.signInWithPassword({ email, password });
    return error ? error.message : null;
  }

  async logout() {
    await this.client.auth.signOut();
    this._user$.next(null);
  }
}
