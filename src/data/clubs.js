// Países e partes de nomes para gerar clubes fictícios (nenhum clube real).
var COUNTRIES = {
  BR: { name: 'Brasil', flag: '🇧🇷', leagues: ['Série Ouro', 'Série Prata', 'Série Bronze', 'Série Várzea'],
    prefix: ['Esporte Clube', 'Atlético', 'União', 'Sport', 'Grêmio', 'Associação', 'Clube Náutico', 'Operário', 'Ferroviário', 'Independente', 'Comercial', 'América', 'Botafogo do', 'Estrela do', 'Real'],
    cities: ['Porto Alvo', 'Vale Verde', 'Serra Azul', 'Maré Alta', 'Pedra Branca', 'Rio Claro', 'Campo Largo', 'Areia Fina', 'Lagoa Seca', 'Morro Alto', 'Boa Brisa', 'Cajueiro', 'Pinhal', 'Ribeira', 'Planalto', 'Alvorada', 'Dunas', 'Cerrado', 'Colina', 'Mangueiral', 'Bela Aurora', 'Três Pontes', 'Barra Funda', 'Cachoeira', 'Ventania', 'Jatobá', 'Ipê Roxo', 'Litoral', 'Sertão Novo', 'Primavera', 'Itaverde', 'Águas Claras', 'São Bento do Sul', 'Monte Sereno', 'Pau Brasil', 'Vila Rica', 'Recanto', 'Paraíso', 'Santa Luz', 'Ouro Fino', 'Riacho Doce', 'Arraial', 'Beira-Mar', 'Pontal', 'Brejo Alto', 'Coqueiral', 'Tamandaré', 'Varjão', 'Cumbuco', 'Baraúna', 'Juazeiro Novo', 'Lajedo', 'Guaraí', 'Taquari', 'Urubici', 'Itaimbé', 'Capim Dourado', 'Serra Negra', 'Vale do Sol', 'Bom Retiro', 'Ilha Grande', 'Tibagi', 'Piraju', 'Caiçara', 'Sabará Novo', 'Peruíbe Alto', 'Boqueirão', 'Itapemirim Velho', 'Mucuri', 'Jacarandá', 'Buriti', 'Aroeira'] },
  EN: { name: 'Inglaterra', flag: '🏴', leagues: ['Premier Crown', 'First Shield', 'Second Shield', 'County League'],
    prefix: ['', 'Athletic', 'Rovers', 'Town', 'United', 'Wanderers', 'City', 'Albion', 'Harriers'],
    cities: ['Ashford Vale', 'Brookmere', 'Calder Bridge', 'Dunmoor', 'Eastholm', 'Fernwick', 'Greystow', 'Harrowgate Mill', 'Ivyleigh', 'Kingsmoor'] },
  ES: { name: 'Espanha', flag: '🇪🇸', leagues: ['Liga Corona', 'Segunda Corona', 'Tercera Plata', 'Regional'],
    prefix: ['Real', 'Club Deportivo', 'Atlético', 'Unión', 'Racing', 'Sporting'],
    cities: ['Valdeluz', 'Montenar', 'Riosol', 'Castellar', 'Peñablanca', 'Aguamar', 'Torrealta', 'Villaverde Sur'] },
  IT: { name: 'Itália', flag: '🇮🇹', leagues: ['Serie Oro', 'Serie Argento', 'Serie Bronzo', 'Dilettanti'],
    prefix: ['AC', 'Sporting', 'Unione', 'Virtus', 'Atletico', 'Pro'],
    cities: ['Valmonte', 'Portoalto', 'Santa Ilaria', 'Borgoverde', 'Castelfino', 'Lagobello', 'Rocca Nera', 'Marenova'] },
  DE: { name: 'Alemanha', flag: '🇩🇪', leagues: ['Meisterliga', 'Zweite Liga', 'Dritte Liga', 'Regionalliga'],
    prefix: ['FC', 'SV', 'TSV', 'Eintracht', 'Union', 'Borussia'],
    cities: ['Altenburg-Süd', 'Bergfeld', 'Dornhain', 'Eichental', 'Falkenau', 'Grünwald-Ost', 'Hohenbruck', 'Kesselbach'] },
  AR: { name: 'Argentina', flag: '🇦🇷', leagues: ['Primera Estrella', 'Nacional B', 'Primera C', 'Federal'],
    prefix: ['Club Atlético', 'Deportivo', 'Sportivo', 'Unión', 'Racing', 'Independiente'],
    cities: ['Villa Serena', 'Puerto Calmo', 'San Lucero', 'Las Colinas', 'Río Hondo Norte', 'Pampa Alta', 'Cerro Azul', 'Bahía Mansa'] },
};

// cores de escudo (pares)
var CREST_COLORS = [
  ['#c62828', '#ffffff'], ['#1565c0', '#ffffff'], ['#111111', '#e53935'], ['#2e7d32', '#ffffff'], ['#6a1b9a', '#ffd54f'],
  ['#ef6c00', '#111111'], ['#00838f', '#ffffff'], ['#33691e', '#ffeb3b'], ['#37474f', '#ffffff'], ['#0277bd', '#ffeb3b'],
  ['#bf360c', '#ffffff'], ['#d32f2f', '#000000'], ['#283593', '#90caf9'], ['#212121', '#ffffff'], ['#f9a825', '#1b5e20'],
  ['#7b1fa2', '#ffffff'], ['#558b2f', '#ffffff'], ['#c2185b', '#ffffff'], ['#4e342e', '#ffcc80'], ['#e65100', '#fff3e0'],
  ['#455a64', '#ff7043'], ['#1a237e', '#ffffff'], ['#827717', '#ffffff'], ['#00695c', '#ffffff'], ['#0d47a1', '#e53935'],
];
var CREST_SHAPES = ['shield', 'round', 'diamond', 'square'];

// aparência do jogador
var LOOKS = {
  skin: ['#f6d2b8', '#e8b48f', '#c98b5e', '#a0673f', '#6e4227', '#4a2c1a'],
  hair: ['#1b1b1b', '#4b2e1a', '#8a5a2b', '#d9b25f', '#b5462d', '#9e9e9e'],
  boot: ['#111111', '#e53935', '#1e88e5', '#fdd835', '#43a047', '#ffffff', '#ff6d00', '#8e24aa'],
};
