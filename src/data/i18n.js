// Textos pt-BR. Fora da ajuda "?" e dos pop-ups, o jogo usa só ícones, barras e números.
var STR = {
  game: 'Rumo à Glória',
  icons: {
    energy: 'Energia', money: 'Dinheiro', star: 'Star Rating', boss: 'Técnico', team: 'Time', fans: 'Torcida',
    pace: 'Velocidade', power: 'Força', technique: 'Técnica', vision: 'Visão', freekick: 'Bola parada',
    train: 'Treino', social: 'Social', shop: 'Loja', life: 'Vida', career: 'Carreira', extras: 'Extras',
    play: 'Jogar', practice: 'Prática', profile: 'Perfil', back: 'Voltar', help: 'Ajuda',
    attack: 'Ataque', balance: 'Equilíbrio', defend: 'Defesa', effort: 'Empenho', speed: 'Velocidade da simulação',
    home: 'Em casa', away: 'Fora', league: 'Liga', locked: 'Em breve', ok: 'Confirmar', fullscreen: 'Tela cheia',
    wage: 'Salário', goalBonus: 'Bônus por gol', assistBonus: 'Bônus por assistência', total: 'Total',
    goals: 'Gols', assists: 'Assistências', passes: 'Passes', chances: 'Chances', rating: 'Nota', motm: 'Craque do Jogo',
    apps: 'Jogos', age: 'Idade', value: 'Valor de mercado', club: 'Clube', delete: 'Apagar carreira',
  },
  passWords: { simple: 'SIMPLES', good: 'BOM', great: 'ÓTIMO', stunning: 'ESPETACULAR' },
  headlines: {
    goalsWin: ['{n} decide e a torcida vai à loucura', '{n} brilha na vitória', 'Show de {n} no fim de semana'],
    goals: ['{n} marca, mas não evita tropeço', 'Gol de {n} não basta'],
    assist: ['{n} serve os companheiros', 'Passe de {n} faz a diferença'],
    good: ['{n} faz boa partida', 'Atuação segura de {n}'],
    bad: ['Tarde para esquecer de {n}', '{n} passa em branco'],
    bench: ['{n} assiste do banco'],
    levelUp: 'Novo nível!',
  },
  help: {
    menu: [
      ['.slot', 'Cada cartão é uma carreira salva. Toque para continuar ou no + para criar.'],
      ['.slot-del', 'Apaga esta carreira.'],
    ],
    create: [
      ['#cr-name', 'Digite o nome do jogador.'],
      ['#cr-gender', 'Toque para trocar o gênero.'],
      ['#cr-country', 'País do jogador. Você começa numa liga desse país.'],
      ['#cr-look', 'Aparência: pele, cabelo e cor da chuteira.'],
      ['#cr-pos', 'Atacante tem mais lances de finalização; meia tem mais lances de passe.'],
      ['#cr-ok', 'Começar a carreira.'],
    ],
    hub: [
      ['#hub-star', 'Star Rating: seu nível. A barra enche com boas atuações.'],
      ['#hub-money', 'Seu dinheiro.'],
      ['#hub-energy', 'Energia. Treinar e jogar gastam. Abaixo de 45% você começa no banco.'],
      ['#hub-rels', 'Relacionamentos: técnico, time e torcida. Mudam conforme suas atuações.'],
      ['#hub-play', 'Jogar a próxima partida.'],
      ['#nav-train', 'Treinar habilidades (gasta energia).'],
      ['.nav-locked', 'Chega nas próximas fases.'],
    ],
    train: [
      ['.tcard', 'Cada cartão é uma habilidade: nível (0 a 60), estrelas da última sessão e custo de energia.'],
      ['#tr-practice', 'Prática: joga sem gastar energia e sem evoluir.'],
    ],
    minigame: [
      ['#mg-canvas', 'Arraste a partir da bola para mirar: a distância do arraste é a força. Solte e toque de novo para escolher o efeito na barra.'],
      ['#mg-tries', 'Tentativas restantes. Acertar na 1ª vale 3 estrelas.'],
      ['#mg-wind', 'Vento: a seta mostra a direção e a força.'],
    ],
    prematch: [
      ['#pm-scheme', 'Esquema do time: ataque gera mais lances ofensivos, defesa mais interceptações.'],
      ['#pm-effort', 'Empenho: mais corações = mais lances e mais satisfação do técnico, porém mais cansaço.'],
      ['#pm-play', 'Começar a partida.'],
    ],
    match: [
      ['#mt-score', 'Placar e minuto.'],
      ['#mt-speed', 'Velocidade da simulação.'],
      ['#mt-timeline', 'Linha do tempo com os lances da partida.'],
      ['#mt-energy', 'Sua energia. Se zerar, você é substituído.'],
      ['#mt-scheme', 'Mude o esquema a qualquer momento.'],
      ['#mt-effort', 'Mude o empenho a qualquer momento.'],
    ],
    moment: [
      ['#mm-canvas', 'Interceptação: arraste o dedo para levar o jogador até a linha da bola. Passe e ataque: arraste a partir da bola para mirar e solte; depois toque para o efeito. Esperar pode abrir espaço, mas a marcação chega.'],
      ['#mm-cards', 'Atalhos: toque num companheiro para passar direto para ele.'],
    ],
    post: [
      ['#ps-rating', 'Sua nota na partida (0 a 10).'],
      ['#ps-rels', 'Como técnico, time e torcida reagiram.'],
      ['#ps-pay', 'Pagamento: salário + bônus por gol e assistência.'],
    ],
    profile: [
      ['#pf-skills', 'Suas habilidades (0 a 60).'],
      ['#pf-stats', 'Estatísticas da carreira.'],
    ],
  },
  more: {
    train: 'Cada sessão custa 40% de energia e tem 3 tentativas. Acertar na 1ª = ★★★ (+3), na 2ª = ★★ (+2), na 3ª = ★ (+1). Acima de 30 a habilidade só sobe com ★★★. Habilidades sem treino por várias partidas começam a cair. A partir do nível 15 aparece vento.',
    moment: 'Passes: menos de 15 m ou para trás = Simples; 15 m = Bom; 20 m = Ótimo; 30 m = Espetacular. Com Visão 25+ você vê quem está impedido (bandeira).',
    match: 'O técnico valoriza empenho e passes e não gosta de chances desperdiçadas. O time gosta de passes e assistências. A torcida gosta de gols, empenho e principalmente vitórias.',
  },
};
