# Mapas da arena

Cada mapa é fixo em código, um arquivo por mapa em `src/lib/arena/maps/` (mesmo padrão de `src/lib/arena/fighters/`). O tipo é `ArenaMap` em `src/lib/arena/map.ts`. A escolha acontece numa etapa própria depois dos lutadores (`arena-map-picker.tsx`), com opção Aleatório sorteada na hora da luta.

Mapas atuais: **Arena da Selva** (`arena-da-selva.ts`) e **Ilha das Estrelas** (`ilha-das-estrelas.ts`).

## O que o mapa define

- `background`: chave e caminho da arte (1672x941 nos mapas atuais). `pixelArt: true` aplica filtro `NEAREST`.
- `walkInset`: margem em px do mundo entre a borda da arte e a área onde se anda.
- `spawn` (opcional): posição dos lutadores em fração da arte. Sem valor, usa `spawnPoints`.
- `obstacles` + `obstacleTheme`: blocos quebráveis e a paleta (`sandstone`, `basalt`) em `entities/obstacle.ts`.
- `blockedAreas` / `waterAreas`: áreas bloqueadas (viram rocha) e de água, em fração da arte (0 a 1). Geradas pelo editor de mapas.
- `terrain`: zonas `water` / `rock` escritas à mão (opcional; prefira o editor). `mapTerrain(map)` soma tudo; rocha vence água quando se sobrepõem.
- `water`: bônus de quem nada dentro da água (`speedScale`, `damageScale`).
- `props`: enfeites interativos (estrela-do-mar foge de quem chega perto).
- `ambient.fish`: peixe saltando nas zonas de água.
- `traits`: chips mostrados na escolha do mapa.

## Terreno e acesso

Regras puras em `src/lib/arena/terrain.ts`. O lutador declara `mobility` (`"swim"`, `"fly"`); sem valor, só anda em terra.

| Terreno | Quem entra |
| ------- | ---------- |
| água    | swim, fly  |
| rocha   | fly        |

- Movimento: cada zona vira um corpo estático; cada lutador só colide com as zonas que não alcança.
- Projéteis ignoram terreno (passam por cima de água e rocha).
- Caixas de consumível nunca nascem em zona de terreno.
- A CPU usa a grade de `src/lib/arena/navigation.ts` para contornar o que não alcança; se o alvo está na água, espera na margem mais perto e atira.
- Todo lutador `energy: "water"` precisa de `mobility: ["swim"]` (teste em `fighters.test.ts`).

## Efeitos

Água e enfeites seguem `docs/arena-pixel-fx.md` (arte em texto em `fx-textures.ts`, escala inteira, mudanças em degraus):

- `entities/water-fx.ts`: reflexo em blocos de 8px, ondinhas de 4px, brilhos, peixe, espirro + som `water-in` ao entrar, ondinha nos pés e sprite meio afundado, espirro no lugar de rachadura quando o golpe cai na água.
- `entities/map-props.ts`: estrela-do-mar que cintila e foge em pulinhos.

## Editor de mapas

`/admin/mapas`, só para admin e atrás da flag `arena-map-editor` (link "Mapas" no menu do admin aparece com a flag ligada).

- Escolha o mapa: a malha abre com as áreas atuais do config.
- Ferramentas: Bloqueado (B), Água (A), Borracha (E); botão direito apaga; Ctrl+Z desfaz. Pincel 1×1, 3×3 ou 5×5.
- Tamanho da célula em px da arte (8 a 32). Trocar reamostra o desenho.
- "Spawn e obstáculos" marca os pontos de spawn (verde) e os blocos quebráveis (amarelo) para não pintar em cima.
- **Exportar áreas** copia `blockedAreas: [...]` e `waterAreas: [...]` (células vizinhas já juntas em retângulos). Cole no arquivo do mapa no lugar dos arrays atuais. O texto também fica num campo abaixo da malha.

Lógica pura da malha em `src/lib/arena/map-grid.ts`.

## Receita para um mapa novo

1. Colocar a arte em `public/arena/backgrounds/`.
2. Criar `src/lib/arena/maps/<id>.ts` e registrar em `maps/index.ts`.
3. Pintar as áreas em `/admin/mapas`, exportar e colar em `blockedAreas`/`waterAreas`.
4. Conferir em jogo em `/arena-check?map=<id>&zones=1` (água azul, rocha vermelha), redimensionando a janela.
5. `pnpm test`: `maps.test.ts` confere ids, zonas dentro da arte e spawn/obstáculos fora de terreno.
