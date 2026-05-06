import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, interval, combineLatest } from 'rxjs';
import { map, distinctUntilChanged } from 'rxjs/operators';
import { Produto, ItemEstoque, ItemRomaneio, RegistroProducao, RegistroTransferencia, Registro, KpiSnapshot } from '../models/models';
import { SupabaseService } from './supabase.service';

@Injectable({ providedIn: 'root' })
export class PadariaService {

  private _produtos$  = new BehaviorSubject<Record<string, Produto>>({});
  private _estoque$   = new BehaviorSubject<Record<string, ItemEstoque>>({});
  private _historico$ = new BehaviorSubject<Registro[]>([]);
  private _romaneio$  = new BehaviorSubject<ItemRomaneio[]>([]);
  private _periodo$   = new BehaviorSubject<'dia'|'semana'|'mes'>('semana');
  private _loading$   = new BehaviorSubject<boolean>(false);

  readonly produtos$  = this._produtos$.asObservable();
  readonly estoque$   = this._estoque$.asObservable();
  readonly historico$ = this._historico$.asObservable();
  readonly romaneio$  = this._romaneio$.asObservable();
  readonly periodo$   = this._periodo$.asObservable();
  readonly loading$   = this._loading$.asObservable();

  readonly kpi$: Observable<KpiSnapshot> = combineLatest([this._historico$, this._periodo$]).pipe(
    map(([hist, p]) => this.calcKpi(hist, p)),
    distinctUntilChanged((a,b) => JSON.stringify(a) === JSON.stringify(b))
  );

  readonly rankingProd$ = combineLatest([this._historico$, this._periodo$]).pipe(
    map(([hist, p]) => {
      const prods = this.filtrar(hist,'producao',p) as RegistroProducao[];
      const map_: Record<string,{nome:string;qty:number}> = {};
      prods.forEach(h => { if(!map_[h.produto.codigo]) map_[h.produto.codigo]={nome:h.produto.nome,qty:0}; map_[h.produto.codigo].qty+=h.qty; });
      const sorted = Object.values(map_).sort((a,b)=>b.qty-a.qty).slice(0,10);
      const max = sorted[0]?.qty||1;
      return sorted.map(s=>({...s, pct:(s.qty/max)*100}));
    })
  );

  readonly evolucao$ = combineLatest([this._historico$, this._periodo$]).pipe(
    map(([hist, p]) => this.calcEvolucao(hist, p))
  );

  constructor(private supa: SupabaseService) {
    this.loadFromSupabase();
    this.setupRealtime();
  }

  // ── Carrega dados do Supabase ─────────────────
  async loadFromSupabase() {
    this._loading$.next(true);
    try {
      const [prods, estRows, prods_hist, transfs] = await Promise.all([
        this.supa.getProdutos(),
        this.supa.getEstoque(),
        this.supa.getProducoes(),
        this.supa.getTransferencias()
      ]);

      // Produtos
      const prodMap: Record<string,Produto> = {};
      prods.forEach((p: any) => { prodMap[p.codigo] = { codigo:p.codigo, nome:p.nome, preco:p.preco, tipo:p.tipo }; });
      this._produtos$.next(prodMap);

      // Estoque
      const estMap: Record<string,ItemEstoque> = {};
      estRows.forEach((e: any) => {
        const prod = prodMap[e.codigo] || { codigo:e.codigo, nome:e.codigo, preco:0, tipo:'kg' };
        estMap[e.codigo] = { produto:prod, saldo:e.saldo, unidade:e.unidade };
      });
      this._estoque$.next(estMap);

      // Histórico
      const hist: Registro[] = [];
      prods_hist.forEach((p: any) => {
        const prod = prodMap[p.produto_codigo] || { codigo:p.produto_codigo, nome:p.produto_nome, preco:0, tipo:'kg' };
        hist.push({ id:p.id, tipo:'producao', produto:prod, qty:p.qty, unit:p.unit, mult:p.mult||1, data:new Date(p.data) } as RegistroProducao);
      });
      transfs.forEach((t: any) => {
        const itens: ItemRomaneio[] = (t.transferencia_itens||[]).map((i: any) => ({
          id:i.id, produto:{ codigo:i.produto_codigo, nome:i.produto_nome, preco:i.produto_preco, tipo:'kg' },
          qty:i.qty, unit:i.unit, mult:i.mult||1
        }));
        hist.push({ id:t.id, tipo:'transferencia', itens, total:t.total, data:new Date(t.data) } as RegistroTransferencia);
      });
      hist.sort((a,b) => new Date(b.data).getTime() - new Date(a.data).getTime());
      this._historico$.next(hist);

    } catch(err) {
      console.error('Erro ao carregar do Supabase:', err);
      this.loadFromLocalStorage(); // fallback
    }
    this._loading$.next(false);
  }

  // ── Realtime ──────────────────────────────────
  private setupRealtime() {
    this.supa.onProducaoInserted(async () => {
      const prods = await this.supa.getProducoes(50);
      const prodMap = this._produtos$.value;
      const novas: RegistroProducao[] = prods.map((p: any) => ({
        id:p.id, tipo:'producao' as const,
        produto: prodMap[p.produto_codigo] || { codigo:p.produto_codigo, nome:p.produto_nome, preco:0, tipo:'kg' },
        qty:p.qty, unit:p.unit, mult:p.mult||1, data:new Date(p.data)
      }));
      const hist = this._historico$.value.filter(h=>h.tipo!=='producao');
      this._historico$.next([...novas, ...hist].sort((a,b)=>new Date(b.data).getTime()-new Date(a.data).getTime()).slice(0,500));
    });
  }

  // ── Getters ───────────────────────────────────
  get produtos()  { return this._produtos$.value; }
  get estoque()   { return this._estoque$.value; }
  get historico() { return this._historico$.value; }
  get romaneio()  { return this._romaneio$.value; }

  setPeriodo(p: 'dia'|'semana'|'mes') { this._periodo$.next(p); }

  // ── Busca ─────────────────────────────────────
  buscarProduto(termo: string): Produto[] {
    const t = termo.toUpperCase();
    return Object.values(this._produtos$.value).filter(p=>p.nome.includes(t)||p.codigo.includes(termo)).slice(0,8);
  }

  decodificarEAN13(raw: string): { produto: Produto|null; precoEtq: number|null; pesoEtq: number|null } {
    const s = raw.trim().replace(/\D/g,'');
    if (s.length===13) {
      const pref = s.substring(0,2);
      if (['20','21','22','23','24','25','26','27','28','29'].includes(pref)) {
        const cod6 = s.substring(1,7);
        const val5 = s.substring(7,12);
        const valor = parseInt(val5,10)/100;
        const codSig = cod6.replace(/0+$/,'');
        const prods = this._produtos$.value;
        const produto = prods[cod6]||prods['0'+cod6]||prods['00'+cod6]||prods['000'+cod6]||
          Object.values(prods).find(p=>p.codigo===cod6||p.codigo.endsWith(cod6)||(codSig.length>=3&&p.codigo.includes(codSig)))||null;
        const isPreco = valor >= 1.0;
        return { produto, precoEtq: isPreco?valor:null, pesoEtq: !isPreco?valor:null };
      }
      return { produto: this._produtos$.value[s]||null, precoEtq:null, pesoEtq:null };
    }
    return { produto: this._produtos$.value[s]||null, precoEtq:null, pesoEtq:null };
  }

  // ── Importar MGV ──────────────────────────────
  async importarMGV(conteudo: string): Promise<{total:number;novos:number;atualizados:number;precoAlterado:number}> {
    const prodsAntigos = this._produtos$.value;
    const prodsArr: any[] = [];
    let total=0, novos=0, atualizados=0, precoAlterado=0;

    conteudo.split('\n').forEach(line => {
      if (line.trim().length < 20) return;
      try {
        const codigo = line.substring(0,9).trim();
        const preco  = parseInt(line.substring(9,14),10)/10;
        const tp     = line.substring(14,18);
        const tipo   = (tp==='0003'||tp==='0060'||tp==='0005')?'kg':'un';
        const nome   = line.substring(18,66).trim();
        if (!nome||isNaN(preco)) return;
        const jaExistia = !!prodsAntigos[codigo];
        const precoMudou = jaExistia && Math.abs(prodsAntigos[codigo].preco-preco)>0.01;
        if (!jaExistia) novos++; else atualizados++;
        if (precoMudou) precoAlterado++;
        prodsArr.push({ codigo, nome, preco, tipo, updated_at: new Date().toISOString() });
        total++;
      } catch {}
    });

    // Salva no Supabase em lotes de 500
    for (let i=0; i<prodsArr.length; i+=500) {
      await this.supa.upsertProdutos(prodsArr.slice(i, i+500));
    }

    // Atualiza estado local
    const prodMap: Record<string,Produto> = { ...prodsAntigos };
    const estMap  = { ...this._estoque$.value };
    prodsArr.forEach(p => {
      prodMap[p.codigo] = { codigo:p.codigo, nome:p.nome, preco:p.preco, tipo:p.tipo };
      if (!estMap[p.codigo]) estMap[p.codigo] = { produto:prodMap[p.codigo], saldo:0, unidade:p.tipo };
      else estMap[p.codigo] = { ...estMap[p.codigo], produto:prodMap[p.codigo] };
    });
    this._produtos$.next(prodMap);
    this._estoque$.next(estMap);
    return { total, novos, atualizados, precoAlterado };
  }

  // ── Registrar produção ────────────────────────
  async registrarProducao(produto: Produto, qty: number, unit: string, _custo: number, mult: number) {
    const reg: RegistroProducao = {
      id: Date.now()+Math.random(), tipo:'producao',
      produto, qty, unit, mult, data: new Date()
    };

    // Atualiza estoque local
    const est = { ...this._estoque$.value };
    if (!est[produto.codigo]) est[produto.codigo] = { produto, saldo:0, unidade:unit };
    est[produto.codigo] = { ...est[produto.codigo], saldo: est[produto.codigo].saldo + qty };
    this._estoque$.next(est);
    this._historico$.next([reg, ...this._historico$.value]);

    // Persiste no Supabase
    try {
      await this.supa.inserirProducao(reg);
      await this.supa.upsertEstoque(produto.codigo, est[produto.codigo].saldo, unit);
    } catch(err) { console.error('Erro ao salvar produção:', err); }
  }

  // ── Romaneio ──────────────────────────────────
  adicionarAoRomaneio(item: Omit<ItemRomaneio,'id'>) {
    this._romaneio$.next([...this._romaneio$.value, { ...item, id: Date.now()+Math.random() }]);
  }
  removerDoRomaneio(id: number) { this._romaneio$.next(this._romaneio$.value.filter(r=>r.id!==id)); }
  limparRomaneio() { this._romaneio$.next([]); }

  // ── Confirmar transferência ───────────────────
  async confirmarTransferencia(responsavel?: string, observacao?: string) {
    const itens = this._romaneio$.value;
    if (!itens.length) return;
    const total = itens.reduce((s,i)=>s+i.produto.preco*i.qty, 0);

    // Atualiza estoque local
    const est = { ...this._estoque$.value };
    itens.forEach(i => {
      if (!est[i.produto.codigo]) est[i.produto.codigo]={produto:i.produto,saldo:0,unidade:i.unit};
      est[i.produto.codigo]={...est[i.produto.codigo],saldo:Math.max(0,est[i.produto.codigo].saldo-i.qty)};
    });
    this._estoque$.next(est);

    const reg: RegistroTransferencia = {
      id: Date.now(), tipo:'transferencia', itens:[...itens], total, data:new Date(), responsavel, observacao
    };
    this._historico$.next([reg, ...this._historico$.value]);
    this._romaneio$.next([]);

    // Persiste
    try {
      await this.supa.inserirTransferencia(reg);
      for (const i of itens) {
        await this.supa.upsertEstoque(i.produto.codigo, est[i.produto.codigo].saldo, i.unit);
      }
    } catch(err) { console.error('Erro ao salvar transferência:', err); }
  }

  // ── Demo data ─────────────────────────────────
  carregarDemoData() {
    const demoProds: Produto[] = [
      { codigo:'100009036', nome:'BOLO FATIAS PRESTÍGIO KG',   preco:74.90, tipo:'kg' },
      { codigo:'100009040', nome:'BOLO PUDIM KG',               preco:44.90, tipo:'kg' },
      { codigo:'100009042', nome:'MINI BOMBA LEITE CONDENSADO', preco:69.90, tipo:'kg' },
      { codigo:'100009043', nome:'MINI BOMBA BRIGADEIRO KG',    preco:69.90, tipo:'kg' },
      { codigo:'100009046', nome:'BOLO RECHEADO PUDIM KG',      preco:59.90, tipo:'kg' },
      { codigo:'100009051', nome:'CAKE PÃO DE MEL KG',          preco:59.90, tipo:'kg' },
    ];
    const prodMap: Record<string,Produto> = {};
    const estMap: Record<string,ItemEstoque> = {};
    demoProds.forEach(p => { prodMap[p.codigo]=p; estMap[p.codigo]={produto:p,saldo:0,unidade:p.tipo}; });
    this._produtos$.next(prodMap);
    this._estoque$.next(estMap);
    const now = new Date(); const regs: Registro[] = [];
    for (let d=6;d>=0;d--) {
      const dt=new Date(now); dt.setDate(dt.getDate()-d);
      demoProds.slice(0,4).forEach(p => {
        const qty=Math.round(5+Math.random()*20);
        estMap[p.codigo].saldo+=qty;
        regs.push({id:Date.now()+Math.random(),tipo:'producao',produto:p,qty,unit:p.tipo,mult:1,data:new Date(dt)} as RegistroProducao);
      });
      const itens: ItemRomaneio[]=demoProds.slice(0,3).map(p=>({id:Date.now()+Math.random(),produto:p,qty:parseFloat((1+Math.random()*5).toFixed(1)),unit:p.tipo}));
      const total=itens.reduce((s,i)=>s+i.produto.preco*i.qty,0);
      itens.forEach(i=>{estMap[i.produto.codigo].saldo=Math.max(0,estMap[i.produto.codigo].saldo-i.qty);});
      regs.push({id:Date.now()+Math.random(),tipo:'transferencia',itens,total,data:new Date(dt)} as RegistroTransferencia);
    }
    this._historico$.next(regs.sort((a,b)=>new Date(b.data).getTime()-new Date(a.data).getTime()));
    this._estoque$.next(estMap);
  }

  async limparTudo() {
    this._produtos$.next({}); this._estoque$.next({});
    this._historico$.next([]); this._romaneio$.next([]);
    localStorage.clear();
  }

  // ── Helpers ───────────────────────────────────
  private filtrar(hist: Registro[], tipo: string, periodo: 'dia'|'semana'|'mes') {
    const now = new Date();
    return hist.filter(h => {
      if (h.tipo!==tipo) return false;
      const d=new Date(h.data);
      if (periodo==='dia') return d.toDateString()===now.toDateString();
      if (periodo==='semana') { const s=new Date(now); s.setDate(s.getDate()-6); return d>=s; }
      const s=new Date(now); s.setDate(s.getDate()-29); return d>=s;
    });
  }

  private calcKpi(hist: Registro[], periodo: 'dia'|'semana'|'mes'): KpiSnapshot {
    const prods  = this.filtrar(hist,'producao',periodo) as RegistroProducao[];
    const transfs= this.filtrar(hist,'transferencia',periodo) as RegistroTransferencia[];
    return {
      totalProduzido:     prods.reduce((s,h)=>s+h.qty,0),
      totalTransferencias:transfs.length,
      valorTransferido:   transfs.reduce((s,h)=>s+h.total,0),
      timestamp: new Date()
    };
  }

  private calcEvolucao(hist: Registro[], periodo: 'dia'|'semana'|'mes') {
    const now=new Date();
    const days=periodo==='dia'?1:periodo==='semana'?7:30;
    return Array.from({length:days},(_,i)=>{
      const d=new Date(now); d.setDate(d.getDate()-(days-1-i));
      const label=d.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'});
      const transfs=hist.filter(h=>h.tipo==='transferencia'&&new Date(h.data).toDateString()===d.toDateString()) as RegistroTransferencia[];
      return { label, valor: transfs.reduce((s,h)=>s+h.total,0) };
    });
  }

  // Fallback localStorage
  private loadFromLocalStorage() {
    try {
      const p=localStorage.getItem('pm_produtos');
      const e=localStorage.getItem('pm_estoque');
      const h=localStorage.getItem('pm_historico');
      if (p) this._produtos$.next(JSON.parse(p));
      if (e) this._estoque$.next(JSON.parse(e));
      if (h) this._historico$.next(JSON.parse(h).map((r:any)=>({...r,data:new Date(r.data)})));
    } catch {}
  }
}
