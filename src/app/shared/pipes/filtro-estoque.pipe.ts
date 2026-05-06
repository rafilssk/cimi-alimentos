import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'filtroEstoque', standalone: true, pure: false })
export class FiltroEstoquePipe implements PipeTransform {
  transform(lista: any[], filtro: string, busca: string): any[] {
    let result = lista;
    if (busca) {
      const t = busca.toUpperCase();
      result = result.filter((e: any) => e.produto.nome.includes(t) || e.produto.codigo.includes(busca));
    }
    if (filtro === 'baixo')  result = result.filter((e: any) => e.saldo > 0 && e.saldo < 2);
    if (filtro === 'zerado') result = result.filter((e: any) => e.saldo <= 0);
    return result.slice(0, 100);
  }
}
