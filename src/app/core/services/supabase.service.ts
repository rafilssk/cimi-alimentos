import { Injectable } from '@angular/core';
import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  private client: SupabaseClient;

  constructor() {
    this.client = createClient(
      environment.supabase.url,
      environment.supabase.anonKey
    );
  }

  get db() { return this.client; }

  // ── Produtos ──────────────────────────────────
  async upsertProdutos(produtos: any[]) {
    const { error } = await this.client
      .from('produtos')
      .upsert(produtos, { onConflict: 'codigo' });
    if (error) throw error;
  }

  async getProdutos() {
    let all: any[] = [];
    let from = 0;
    const pageSize = 1000;
    while (true) {
      const { data, error } = await this.client
        .from('produtos')
        .select('*')
        .order('nome')
        .range(from, from + pageSize - 1);
      if (error) throw error;
      if (!data || data.length === 0) break;
      all = all.concat(data);
      if (data.length < pageSize) break;
      from += pageSize;
    }
    return all;
  }

  // ── Estoque ───────────────────────────────────
  async getEstoque() {
    const { data, error } = await this.client
      .from('estoque')
      .select('*, produtos(*)');
    if (error) throw error;
    return data || [];
  }

  async upsertEstoque(codigo: string, saldo: number, unidade: string) {
    const { error } = await this.client
      .from('estoque')
      .upsert({ codigo, saldo, unidade, updated_at: new Date().toISOString() },
        { onConflict: 'codigo' });
    if (error) throw error;
  }

  // ── Produções ─────────────────────────────────
  async inserirProducao(p: any) {
    const { data, error } = await this.client
      .from('producoes')
      .insert({
        produto_codigo: p.produto.codigo,
        produto_nome:   p.produto.nome,
        qty:  p.qty,
        unit: p.unit,
        mult: p.mult,
        data: new Date().toISOString()
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async getProducoes(limite = 200) {
    const { data, error } = await this.client
      .from('producoes')
      .select('*')
      .order('data', { ascending: false })
      .limit(limite);
    if (error) throw error;
    return data || [];
  }

  // ── Transferências ────────────────────────────
  async inserirTransferencia(t: any) {
    // Insere o romaneio
    const { data: transf, error: e1 } = await this.client
      .from('transferencias')
      .insert({
        total:       t.total,
        responsavel: t.responsavel || null,
        observacao:  t.observacao  || null,
        data: new Date().toISOString()
      })
      .select()
      .single();
    if (e1) throw e1;

    // Insere os itens
    const itens = t.itens.map((i: any) => ({
      transferencia_id: transf.id,
      produto_codigo:   i.produto.codigo,
      produto_nome:     i.produto.nome,
      produto_preco:    i.produto.preco,
      qty:  i.qty,
      unit: i.unit,
      mult: i.mult || 1
    }));
    const { error: e2 } = await this.client
      .from('transferencia_itens')
      .insert(itens);
    if (e2) throw e2;
    return transf;
  }

  async getTransferencias(limite = 100) {
    const { data, error } = await this.client
      .from('transferencias')
      .select('*, transferencia_itens(*)')
      .order('data', { ascending: false })
      .limit(limite);
    if (error) throw error;
    return data || [];
  }

  // ── Realtime ──────────────────────────────────
  onProducaoInserted(callback: (row: any) => void): RealtimeChannel {
    return this.client
      .channel('producoes-live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'producoes' },
        payload => callback(payload.new))
      .subscribe();
  }

  onTransferenciaInserted(callback: (row: any) => void): RealtimeChannel {
    return this.client
      .channel('transferencias-live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'transferencias' },
        payload => callback(payload.new))
      .subscribe();
  }
}