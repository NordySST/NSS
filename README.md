# Rumo à Glória

Jogo de futebol de carreira no navegador, com dois modos:

- **Carreira de Jogador** — crie seu atleta (atacante, meia ou defensor), comece aos 17 anos na Terceira Divisão,
  treine atributos, cuide da energia, da felicidade e do relacionamento com treinador, torcida e elenco,
  compre equipamentos e bens, receba propostas de outros clubes e decida os lances das partidas
  (arraste para trás a partir da bola e solte para chutar ou passar; use o efeito para curvar a bola).
- **Carreira de Técnico** — assuma um clube, escolha formação e mentalidade, monte a escalação,
  faça substituições durante o jogo, compre e venda jogadores, renove contratos, cuide das finanças
  (bilheteria, salários, cota de TV, estádio) e atenda às expectativas da diretoria.

São 30 clubes fictícios em 3 divisões (turno e returno, 2 sobem e 2 caem), com jogadores que envelhecem,
evoluem e se aposentam a cada temporada.

## Como jogar

Abra `index.html` no navegador. Não precisa instalar nada. O progresso fica salvo no próprio navegador
(um save para cada modo).

## Estrutura

| Arquivo | Conteúdo |
|---|---|
| `js/util.js` | Funções auxiliares e nomes |
| `js/data.js` | Clubes, ligas, geração de jogadores e tabela |
| `js/engine.js` | Simulação das partidas, rodadas e fim de temporada |
| `js/kick.js` | Minijogo dos lances (física da bola, goleiro, defensores) |
| `js/matchview.js` | Tela de partida ao vivo (campo, narração, estatísticas) |
| `js/player.js` | Modo Carreira de Jogador |
| `js/manager.js` | Modo Carreira de Técnico |
| `js/main.js` | Menu, interface base e salvamento |
