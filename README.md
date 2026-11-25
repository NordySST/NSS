# Rumo à Glória

Jogo de carreira de futebol para celular: você controla **um único atleta**, começa aos 16 anos num clube
semiprofissional da divisão mais baixa e tenta virar uma estrela. Tela cheia, paisagem, quase sem texto
(ícones, barras e números) e botão **?** com ajuda em todas as telas. Todos os clubes e marcas são fictícios.

## Status: Fase 1 (núcleo)

- Criação do jogador (nome, gênero, país, aparência, posição)
- Hub com Star Rating, dinheiro, energia, relacionamentos (técnico, time, torcida) e próximo jogo
- Energia: treino custa 40%, recuperação de 25% após cada partida, abaixo de 45% começa no banco
- 5 treinos (minigames) com 3 tentativas e estrelas: Velocidade, Força, Técnica, Visão e Bola parada;
  vento a partir do nível 15, teto suave em 30, declínio de habilidade sem treino, modo Prática
- Controle de chute: arrastar a partir da bola (direção e força, com trajetória pontilhada) → soltar →
  tocar na barra de efeito para curvar
- Partida simulada com linha do tempo de ícones, esquema (⚔ ⚖ 🛡), empenho (1–3 ❤), intervalo e
  lances jogáveis: interceptação, passe no meio-campo (com classificação Simples/Bom/Ótimo/Espetacular,
  impedimento visível com Visão 25+) e jogada de ataque
- Fim de jogo: nota (estrelas), Craque do Jogo, reação de técnico/time/torcida, pagamento animado, manchete
- Star Rating sobe com a combinação de técnico + time + torcida
- Liga com 4 divisões × 18 clubes, turno e returno, acesso/rebaixamento de 3
- 3 slots de save (versionado), PWA instalável e offline

As fases seguintes (relacionamentos e contrato, economia e vida, profundidade, polimento) seguem a especificação.

## Como jogar

- **No navegador:** abra `index.html` (ou sirva a pasta por HTTP para usar como PWA instalável/offline).
- **Arquivo único:** `python3 tools/build.py` gera `dist/rumo-a-gloria.html`.

## Testes

`npm test` (ou `node --test tests/*.test.js`) roda os testes unitários dos sistemas: energia, ganho de
habilidade, declínio, pagamento, Star Rating, classificação de passe, tabela e calendário da liga, e uma
simulação de 10 partidas.

## Estrutura

| Pasta | Conteúdo |
|---|---|
| `src/data` | `balance.js` (todos os números do jogo), clubes/países, textos pt-BR e ajuda |
| `src/core` | RNG com semente, estado do jogo (`GameState`) |
| `src/save` | Save versionado com 3 slots |
| `src/systems` | Energia, habilidades, liga, partida, nota/relacionamentos/Star Rating/pagamento |
| `src/minigames` | Física da bola, controle de chute e os 5 treinos |
| `src/match` | Lances jogáveis da partida |
| `src/ui` | Palco 16:9, componentes, ajuda "?", som e telas |
| `tests` | Testes unitários (node:test) |
