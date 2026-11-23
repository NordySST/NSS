// Utilitários gerais
const U = {
  ri(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; },
  rf(a, b) { return Math.random() * (b - a) + a; },
  pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; },
  chance(p) { return Math.random() < p; },
  clamp(v, a, b) { return Math.max(a, Math.min(b, v)); },
  gauss(mean = 0, sd = 1) {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return mean + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  },
  shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  },
  weighted(items, weights) {
    const total = weights.reduce((s, w) => s + w, 0);
    let r = Math.random() * total;
    for (let i = 0; i < items.length; i++) {
      r -= weights[i];
      if (r <= 0) return items[i];
    }
    return items[items.length - 1];
  },
  avg(arr) { return arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : 0; },
  _id: 1,
  uid() { return U._id++; },
  money(n) {
    const neg = n < 0; n = Math.abs(n);
    let s;
    if (n >= 1e6) s = (n / 1e6).toFixed(n >= 1e7 ? 1 : 2).replace('.', ',') + ' mi';
    else if (n >= 1e3) s = Math.round(n / 1e3) + ' mil';
    else s = Math.round(n).toString();
    return (neg ? '-' : '') + 'R$ ' + s;
  },
  esc(s) {
    return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  },
};

const NAMES = {
  first: ['Lucas', 'Gabriel', 'Mateus', 'Rafael', 'Pedro', 'Thiago', 'Bruno', 'Diego', 'Felipe', 'Gustavo',
    'Henrique', 'Igor', 'João', 'Leandro', 'Marcelo', 'Nicolas', 'Otávio', 'Paulo', 'Renan', 'Samuel',
    'Tiago', 'Vinícius', 'Wesley', 'Caio', 'Danilo', 'Eduardo', 'Fábio', 'Hugo', 'Júlio', 'Kauã',
    'Murilo', 'Natan', 'Raul', 'Sérgio', 'Vitor', 'André', 'Breno', 'Cristian', 'Davi', 'Enzo',
    'Fernando', 'Giovani', 'Heitor', 'Ivan', 'Luan', 'Miguel', 'Ruan', 'Yuri', 'Alan', 'Arthur',
    'Carlos', 'Daniel', 'Emanuel', 'Leo', 'Marcos', 'Rodrigo', 'Silas', 'Tomás', 'Wagner', 'Ícaro'],
  last: ['Silva', 'Santos', 'Oliveira', 'Souza', 'Lima', 'Pereira', 'Costa', 'Rodrigues', 'Almeida', 'Nascimento',
    'Araújo', 'Melo', 'Barbosa', 'Ribeiro', 'Martins', 'Carvalho', 'Rocha', 'Gomes', 'Freitas', 'Moura',
    'Cardoso', 'Teixeira', 'Correia', 'Dias', 'Pinto', 'Vieira', 'Monteiro', 'Mendes', 'Barros', 'Fonseca',
    'Campos', 'Nunes', 'Ramos', 'Moreira', 'Cavalcanti', 'Rezende', 'Farias', 'Batista', 'Macedo', 'Brito',
    'Peixoto', 'Andrade', 'Tavares', 'Coelho', 'Duarte', 'Lopes', 'Sales', 'Prado', 'Queiroz', 'Xavier'],
};

U.name = () => ({ first: U.pick(NAMES.first), last: U.pick(NAMES.last) });
