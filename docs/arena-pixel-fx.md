# Efeitos de ataque em pixel art

Todo efeito de ataque da arena (projétil, feixe, impacto) segue o visual dos sprites PMD: pixels grandes, nítidos, sem brilho suave. Vale para qualquer lutador novo — já criar o ataque assim.

Referências prontas: bolha (`bubble.ts`), bola de energia (`orb.ts`), estrela (`star.ts`), osso (`bone.ts`), feixe (`beam.ts`) e raio (`bolt.ts`), todos em `src/game/arena/entities/`. Especiais: furacão de fogo em funil de faixas espirais com rastro (`fire-tornado.ts`), névoa tóxica (`toxic-mist.ts`), status de veneno (`poison-fx.ts`, artes `TOXIC_BUBBLE_ART` 10x10 e `POISON_BADGE_ART` 9x9), anel de terremoto (`quake.ts`), onda (`surf.ts`), raio do céu (`thunder.ts`) e teleporte (`last-resort.ts`); efeitos que duram vários quadros implementam `SpecialFx` (`special-fx.ts`) e avançam pelo delta em `stepCombat`.

## Regras

1. **Arte como texto em `fx-textures.ts`.** Cada quadro é um array de strings (uma por linha, todas do mesmo tamanho) e uma paleta `PixelPalette` que mapeia o caractere para `{ color, alpha }`. Espaço é transparente. Convenção dos caracteres: `#` contorno, `.`/`w` miolo, `c` núcleo claro, `o`/`s` sombra, `w` também brilho quando houver núcleo.
   - Tamanho pequeno: 12x12 é o padrão (`PIXEL_ART_SIZE`); formas alongadas podem fugir disso (osso 22x10, estrela 13x13). O `bake` usa as dimensões da própria arte.
   - Variante carregada = mesma arte com outra paleta, não tint por cima.
   - Animação = 2 quadros alternando pela distância percorrida (`FRAME_DISTANCE`), não tween de escala.
   - Registrar a chave em `FX_TEXTURES` e a tripla `[chave, arte, paleta]` na lista `pixelArt` de `createFxTextures` — ela aplica o filtro `NEAREST`.
   - Arte branca (paleta `POP_PALETTE`) quando o efeito recebe tint, como `shards` e `bubblePop`.

2. **Escala inteira.** `pixelScale(raio, tamanhoDaArte)` de `pixel-fx.ts` devolve um inteiro ≥ 2, então um pixel da arte vira 2, 3 ou 4 px do mundo. Nunca escalar por fração.

3. **Posição arredondada.** `setPosition(Math.round(x), Math.round(y))` em todo quadro.

4. **Mudanças em degraus.** Nada de tween suave de tamanho ou ângulo:
   - giro com `snapAngle(ânguloContínuo, passos)` (osso 8 passos, estrela 20); guardar o ângulo contínuo no shot e só mostrar o arredondado;
   - estouro com `pixelRing` (escala sobe +1 por degrau via `delayedCall`), usando a textura `FX_TEXTURES.shards` ou uma própria.

5. **Partículas são `fx-pixel`.** `pixelTrail` (rastro com escala fixa = 1 pixel da arte) e `pixelBurst` (rajada de saída/impacto). Não usar `fx-glow`, `fx-spark` nem `BlendModes.ADD` com halo radial em ataque novo.

6. **Formas desenhadas em `Graphics`** (feixes, cargas) vão para a grade de blocos de 4px do mundo, como em `beam.ts`: amostrar a forma, `snap` para a grade, deduplicar (`pixelGrid`) e desenhar com `fillRect`. Círculos com `pixelDisc` (raio também em degraus de bloco).

7. **Hitbox não muda com a arte.** O raio de acerto mora em `src/lib/arena/combat.ts` (`*_RADIUS`); se a arte crescer de forma visível, ajustar o raio junto.

## Receita para um projétil novo

1. Desenhar a arte (e o quadro alternativo) em `fx-textures.ts`, com paleta normal e carregada.
2. Criar `src/game/arena/entities/<ataque>.ts` copiando `orb.ts` (linha reta) ou `star.ts` (persegue o alvo): `Style` com a(s) textura(s), `launch` com `pixelScale` + `pixelTrail` + `pixelBurst`, `step` com posição arredondada e troca de quadro, impacto com `pixelRing` + `pixelBurst`.
3. Ligar em `combat.ts` pelo novo `RangedStyle` em `src/lib/arena/fighter.ts`.
4. Conferir no `/arena-check` os três níveis de carga: nada borrado, nada girando liso.
