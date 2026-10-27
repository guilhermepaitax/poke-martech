# MVP da arena 2D

Batalha em arena top-down contra a CPU, dentro do app Next.js existente, com Phaser 4 e Arcade Physics. A luta fica só no navegador. Não há multiplayer, PvP, salas, ranking, inventário nem progressão.

Cada etapa abaixo deve poder ser jogada e verificada antes da seguinte. Não avançar para a próxima sem aprovação.

## Estado

- [x] Etapa 0 — Auditoria e planejamento
- [x] Etapa 1 — Phaser integrado à aplicação
- [x] Ajustes visuais pedidos depois da etapa 1
- [x] Etapa 2 — Movimentação do jogador
- [x] Etapa 3 — Cartas fixas como lutadores
- [x] Etapa 4 — Combate básico
- [x] Etapa 5 — CPU
- [x] Etapa 6 — Vitória, derrota e reinício
- [x] Etapa 7 — HUD e encaixe visual
- [ ] Etapa 8 — Polimento e validação final

## Contexto do app

- Next.js 16.3.8, App Router, React 19, TypeScript strict, pnpm.
- A unidade cadastrada é a carta (`Card`): nome, HP, tipo, imagem e ataques. Não existe sprite sheet nem ciclo de caminhada.
- A batalha de cartas antiga foi removida. Este MVP não restaura decks, adversários nem as tabelas derrubadas pela migration `0012`.
- Rota autenticada: `/batalha`. Flag `FEATURE_FLAG_ARENA` (`arena`). Ausência da variável deixa a função ligada. Desligada, a nav esconde o link e a rota mostra `FeatureUnavailable`.
- Phaser 4.2.1 sobe só no cliente, com `next/dynamic` e `ssr: false`. O `useEffect` destrói o jogo ao sair da rota.
- Regras puras ficam em `src/lib/arena`. A engine fica em `src/game/arena`. A interface React fica em `src/components/arena`.

## Decisões já fechadas

- Lutadores são fixos em código, um arquivo por lutador em `src/lib/arena/fighters/` (nome, título, descrição, tipo, HP, ataques e folhas de sprite). Não vêm mais das cartas cadastradas. Ver "Roster fixo".
- A partida não é persistida. Sem tabela nova e sem recompensa.
- O canvas ocupa a tela abaixo do header e nunca passa da largura da janela. Não há scroll horizontal.
- Fundo, obstáculos, terreno e spawn vêm do mapa escolhido (ver `docs/arena-maps.md`). A proporção da arte é mantida. O mundo é maior que a câmera nos dois eixos (`arenaWorldSize`, overflow 1.5), centralizado. O que fica fora da tela será revelado quando a câmera seguir o personagem.
- A borda do canvas é reta, de 4px, na cor âmbar atual. Sem cantos arredondados.

## Etapa 0 — Auditoria e planejamento

Objetivo: entender o app e definir a integração sem alterar o domínio de cartas.

- [x] Inspecionar Next.js, roteamento, catálogo e assets
- [x] Confirmar que não há sprites de batalha, só arte de carta
- [x] Definir rota `/batalha`, flag e separação React / Phaser / regras puras
- [x] Registrar que a batalha de cartas antiga não será restaurada

## Etapa 1 — Phaser integrado à aplicação

Objetivo: arena vazia no browser, sem erro de SSR, com o restante do app intacto.

- [x] Instalar `phaser@4.2.1`
- [x] Flag `arena` e testes em `src/lib/feature-flags.test.ts`
- [x] Layout da rota com `FeatureUnavailable`
- [x] Página servidor sem importar Phaser
- [x] Cliente com `ssr: false`, uma instância e `destroy` no unmount
- [x] Cena com Arcade Physics, gravidade zero e obstáculos estáticos
- [x] Link "Batalha" na navegação, só quando a flag está ligada
- [x] `pnpm lint`, `pnpm test` e `pnpm build` passaram na entrega
- [x] Verificação no browser: um canvas, ida à Pokédex e volta, loja abrindo, flag desligada sem canvas

Arquivos principais: `src/app/(app)/batalha/page.tsx`, `src/app/(app)/batalha/layout.tsx`, `src/components/arena/`, `src/game/arena/create-game.ts`, `src/game/arena/scenes/arena-scene.ts`.

## Ajustes visuais já feitos

Pedidos depois da etapa 1. Não substituem as etapas 2 a 8.

- [x] O canvas preenche a altura da janela menos o header medido
- [x] A largura máxima é a da tela. O mínimo de 1420px foi removido
- [x] Sem scroll horizontal (`overflow-hidden` na área da batalha)
- [x] Fundo `public/arena/arena-floor.jpg` sem esticar a imagem
- [x] Mundo maior que a visão, com a mesma proporção da arte, câmera centralizada e bounds do Arcade no mundo inteiro
- [x] Borda reta de 4px em volta do canvas
- [x] Testes de `arenaWorldSize` em `src/lib/arena/world-size.test.ts`

A etapa 2 coloca o personagem no centro. A câmera o segue e revela o fundo que começa fora da tela.

## Etapa 2 — Movimentação do jogador

Objetivo: controlar um personagem provisório dentro da arena.

- [x] Entidade do jogador em `src/game/arena/entities/player.ts`
- [x] Oito direções, WASD e setas
- [x] `normalizeMove` em `src/lib/arena/movement.ts`, com teste de eixo, diagonal e input zero
- [x] Velocidade pelo Arcade, usando o delta, sem atualizar x/y pelo React
- [x] Colisão com os bounds do mundo e com os obstáculos
- [x] Setas não rolam a página enquanto o canvas está em foco
- [x] A câmera segue o personagem e mostra as partes do fundo que começam fora da tela
- [x] Sprite provisório enquanto não houver arte de caminhada

Aceite: a diagonal não é mais rápida que os eixos, o personagem não sai do mundo e o React não escreve a posição a cada frame.

## Etapa 3 — Cartas fixas como lutadores

Objetivo: a cena recebe dois fighters vindos de cartas publicadas.

- [x] `cardToFighter`: id, nome, HP mínimo 1, URL da imagem e dano do primeiro ataque numérico
- [x] Use case que lê dois slugs fixos, chamado pela página, sem mudar as APIs atuais
- [x] A imagem da carta fica no dado. O corpo usa as folhas idle e walk do Antoniomander. Carta sem imagem entra do mesmo jeito, porque a cena não depende da URL
- [x] Testes do adaptador: com ataque, sem ataque, sem imagem e HP 0
- [x] A caminhada continua nas folhas do Antoniomander, as únicas disponíveis

Aceite: uma carta sem imagem entra na arena. `GET /api/cards/[id]` continua só devolvendo carta publicada e possuída.

Slugs fixos, os dois primeiros publicados: jogador `a1-001-calvassauro` e oponente `a1-005-rafrpie`.

## Etapa 4 — Combate básico

Objetivo: o jogador mira com o mouse e causa dano uma vez por projétil.

- [x] Traço opaco do lutador até o ponteiro, com retículo
- [x] A direção do jogador segue o mouse
- [x] Clique esquerdo dispara se o cooldown acabou
- [x] Dois ataques, corpo a corpo e projétil de fogo, trocados por 1, 2 ou scroll
- [x] Projétil com Arcade, removido no impacto e na borda do mundo
- [x] Dano, cooldown e "já acertou" em funções puras, com teste
- [x] Cooldown pelo relógio da cena, não por `setInterval` global
- [x] Cross Punch nos dois ataques; fogo adiciona chama no corpo
- [x] Taking Punch quando o HP cai
- [x] Número do dano sobe e some
- [x] Rachaduras no chão que somem; golpe forte abre teia maior

Aceite: o mesmo projétil não aplica dano duas vezes e o HP muda de forma previsível.

## Etapa 5 — CPU

Objetivo: oponente local e reproduzível, sem aleatoriedade.

- [x] `decideCpu` puro em `src/lib/arena/cpu.ts`: longe persegue, perto e pronto ataca, morto não age, não bate em alvo morto
- [x] Perseguição com vetor normalizado
- [x] Ataque no alcance, com o mesmo feixe da etapa 4, mirando o jogador. Colada usa corpo a corpo. Bloco no caminho faz perseguir em vez de atirar
- [x] Testes da tabela de decisão
- [x] CPU anda a 75% da velocidade do jogador e tem cooldown 1.6× maior, para dar janela de vitória

Aceite: dá para vencer e perder. A CPU não lê input de outro jogador.

### Ajustes junto da etapa 5

- [x] Rebalanceamento: `attackPower(kind, dano, hpMaxDoAlvo)` escala o dano da carta (melee ×0.3, fogo ×0.18) e limita cada golpe a uma fração do HP do alvo (12% / 8%), mínimo 1. Cerca de 8 golpes corpo a corpo derrubam. Tiers de impacto e rachaduras recalibrados
- [x] Rebalanceamento do corpo a corpo: alcance 88 → 124, investida mais longa (620 px/s por 100 ms), cooldown 560 → 460 ms, dano ×0.4 com teto de 16% do HP (cerca de 7 golpes). Durante o golpe (investida + 260 ms) o atacante leva metade do dano à distância, com a tag `resisted`
- [x] Dash no Espaço: direção do WASD/setas, ou do mouse sem input. Cooldown de 650 ms, sem invulnerabilidade. Clip de caminhada a 24 fps, fantasmas âmbar, rastro e poeira. Label "Espaço Dash" no HUD acende quando pronto

## Etapa 6 — Vitória, derrota e reinício

Objetivo: HP zero encerra a luta e outra começa sem recarregar a página.

- [x] `resolveOutcome` em `src/lib/arena/outcome.ts`
- [x] Se os dois chegarem a zero no mesmo passo, a derrota é do jogador
- [x] Bloquear movimento, ataque e CPU depois do fim (`combat.over`, `update` parado, lutadores sem velocidade)
- [x] Reinício com `scene.restart()`: `shutdown` antes de recriar entidades, timers e projéteis
- [x] Testes de vitória, derrota e empate simultâneo

Aceite: a segunda luta começa com HP cheio e sem projéteis da anterior.

### Ajustes junto da etapa 6

- [x] Correção: a CPU não feria o jogador. O oponente padrão (Rafrpie) não tem ataque com dano numérico, e `attackPower` devolvia 0. Agora carta sem dano usa `FALLBACK_ATTACK_DAMAGE` (30)
- [x] Esc pausa a luta (`scene.pause()`) e abre o menu: Continuar, Reiniciar, Encerrar. Esc de novo retoma
- [x] Fim da luta abre overlay de Vitória ou Derrota: Jogar de novo, Encerrar
- [x] Encerrar destrói o jogo e volta ao seletor de lutadores, mantendo a escolha
- [x] A cena avisa o React pelo evento `arena:outcome` em `game.events`. O React comanda por `arenaControls` em `create-game.ts`
- [x] Lutadores nascem um de cada lado da arena (`spawnPoints` em `src/lib/arena/spawn.ts`, 120px da borda do bound), jogador virado para leste e CPU para oeste
- [x] Seletor de dificuldade no picker, padrão Normal. Perfis em `CPU_PROFILES` (`src/lib/arena/cpu.ts`):
  - Difícil: velocidade 320, cooldown 1.15×, dano 1.15×, feixe até 80% do alcance, busca consumíveis até 900px
  - Normal: velocidade 260, cooldown 1.8×, dano 0.8×, feixe até 55% do alcance, busca consumíveis até 450px
  - CPU desvia para o consumível livre mais próximo dentro do alcance (ignora Vulnerável visível, caixa atrás de bloco e Cura com HP cheio). Corpo a corpo colado no alvo tem prioridade
- [x] Dash esquiva: durante o dash de Espaço (160 ms) o lutador não leva dano. O feixe confere a posição do alvo na chegada, então sair da linha durante a carga também esquiva. Isso substitui o "sem invulnerabilidade" da etapa 5
- [x] Som `public/arena/audio/dash.wav` no dash

## Etapa 7 — HUD e encaixe visual

Objetivo: a luta fica legível dentro do shell.

- [x] HP, nomes e imagem dos dois lutadores (`src/components/arena/arena-hud.tsx`)
- [x] Cooldown do ataque (barra de slots em React, `src/components/arena/arena-attack-bar.tsx`)
- [x] Loading e erro de boot, com "Tentar de novo"
- [x] Nova batalha e voltar à Pokédex no overlay
- [x] O HUD só reflete o snapshot emitido pela cena, não a posição por frame (`arena:snapshot`, `arenaControls.onSnapshot`)
- [x] Cores pelos tokens do app, no desktop e na nav mobile

Aceite: o HUD bate com o HP real e a navegação antiga continua igual.

### Ajustes junto da etapa 7

- [x] Barra de ataques em React no rodapé: slots escuros inclinados sobre faixa diagonal, ícones Lucide (`HandFist`, `Flame`/`Sun` pela energia, `ChevronsRight`), nome do ataque e tecla. Slot ativo claro e levantado. Em cooldown o slot fica opaco e cinza, uma sombra desce com linha brilhante e pisca ao ficar pronto. A cena emite `arena:hud` só nas transições (troca, ataque, dash, carga) e o CSS anima o resto. Esc pausa as animações
- [x] HUD do topo com placa chanfrada, retrato em moldura inclinada na cor da energia, barra de vida grossa em gradiente com dano atrasado, HP em número e medidor de carga do jogador em dois segmentos com selo "CHARGE!" no máximo
- [x] Fontes: menus em Sora. `Press Start 2P` (`--font-pixel`) só nos números de dano. `Rubik` 900 itálico (`--font-title`, classe `font-arena-title`) nos títulos, nomes do HUD e banners. O jogo espera `document.fonts.load` das duas antes de subir
- [x] Carregando, Vitória, Derrota, Pausado e erro usam `ArenaTitleCard`: fita branca inclinada, estrela, raios girando e confete
- [x] Anel sob o lutador animado: pulso, traços girando, cor por estado (parado, ataque, dano, carga 1, carga 2, derrotado). Ondas saem ao atacar, dashar e levar dano
- [x] Ataque carregado, só do jogador: segurar o clique 1s dá nível 1 (dano ×1.5), 2s dá nível 2 (×2.2). Soltar antes de 1s é ataque normal. Regras em `src/lib/arena/charge.ts`. Durante a carga o lutador anda a 55%, o anel gira e puxa faíscas, e o bloco do ataque mostra a barra de carga e "CARREGADO"/"MÁX!". Dash, dano, pausa e fim da luta cancelam a carga
- [x] Soco carregado: investida maior, arco mais grosso, alcance maior e onda de choque. Fogo carregado: feixe mais largo, nível 2 em magenta. Nível 2 treme a câmera
- [x] Banners grandes no canvas no mesmo estilo: fita branca inclinada com sombra colorida, estrela, raios, confete e glow (filtro do WebGL) na palavra de destaque. CRITICAL!, CARREGADO!, MÁXIMO!, SUPER GOLPE!, K.O.!. O overlay de fim espera 1.1s para o K.O. aparecer

## Roster fixo

Substitui a etapa 3 (cartas como lutadores). `ListArenaRoster`, `GetArenaFighters`, `cardToFighter` e o picker de cartas com busca e paginação foram removidos.

- [x] `ArenaFighter` em `src/lib/arena/fighter.ts`: `id`, `name`, `title`, `description`, `energy` (`fire` | `grass` | `ground`), `ranged` (`beam` | `orb` | `bone`), `hp`, `attacks` (`melee` e `fire`, cada um com `name`, `hudName`, `description`, `power`) e `sprite` (`cellSize`, `columns`, folhas `idle`/`walk`/`attack`/`hurt` com `frames` e linha por direção, `shoot` opcional para o ataque à distância e `frameRate` opcional por folha). `tuning.displaySize` opcional muda o tamanho exibido (padrão 96)
- [x] Antoniomander (fogo, HP 70, Cabeçada / Lança-chamas). Baseado no Charmander, sprites do PMD Sprite Collab (`idle=Idle walk=Walk attack=Attack shoot=Charge hurt=Hurt defend=Charge`; `Shoot` é `CopyOf Charge` sem arquivo próprio, e os arquivos vieram com sufixo ` (N)`, renomear antes de rodar o script). Células de 36px, exibido em 110px
- [x] Calvossauro (planta, HP 80, Cabeçada / Bola de energia). Em vez do feixe lança bolas de energia verdes que viajam e conferem a posição do alvo a cada quadro (dá para esquivar). Carga 1: bola maior. Carga 2: três bolas, uma na mira e duas a ±30°. Sprites do PMD Sprite Collab (`idle=Idle walk=Walk attack=Attack shoot=Shoot hurt=Hurt defend=Charge`), células de 34px, exibido em 110px. Bola em pixel art 12x12 (`fx-textures.ts`, 2 quadros pulsando pelo percurso), rastro de pixels de escala fixa e estouro em estilhaços que crescem em degraus; helpers compartilhados com as bolhas em `pixel-fx.ts`
- [x] Papaitaxone (terra, HP 75, Clava de Osso / Ossomerang). Baseado no Cubone, sprites do PMD Sprite Collab. O osso vai em linha reta até 420px e volta perseguindo o dono; acerta no máximo uma vez na ida e uma na volta e para em obstáculo. Carga 1: osso maior e mais rápido. Carga 2: dois ossos a ±18°. Clava usa a folha `attack` (Strike) e o osso a folha `shoot` (Attack). Células de 40px, exibido em 112px
- [x] Joãovee (normal/incolor, HP 65, Ataque Rápido / Meteoro). Baseado no Eevee, sprites do PMD Sprite Collab (`idle=Idle walk=Walk attack=Attack shoot=Shoot hurt=Hurt`). O mais rápido do roster (390). Ataque Rápido usa `tuning.lungeScale` 1.35 (investida mais longa e veloz). Meteoro (`ranged: "star"`) lança estrelas de 5 pontas que curvam para o alvo com giro limitado (`STAR_TURN_RATE`), então o dash ainda esquiva e bloco para. Base: 2 estrelas; carga 1: 3 maiores; carga 2: 5 em leque rosado. O dano do golpe se divide entre as estrelas. Células de 38px, exibido em 106px
- [x] Douguitoryu (água, HP 70, Giro Rápido / Jato de Bolhas). Baseado no Staryu, sprites do PMD Sprite Collab (`idle=Idle walk=Walk attack=Rotate shoot=Shoot hurt=Hurt defend=Charge`). Giro Rápido usa `tuning.meleeSpin`: a investida gira e acerta em volta (360°, `spinConnect`) com 85% do alcance, soltando uma onda azul no lugar do corte. Jato de Bolhas (`ranged: "bubble"`, `bubble.ts`) solta 3 bolhas em fila (80ms entre elas) que ondulam de lado alternando o sentido; estouram em respingo no alvo ou bloco. Bolhas em pixel art 12x12 (`fx-textures.ts`, filtro NEAREST, escala inteira, 2 quadros alternando pelo percurso), estouro em anel pixelado que cresce em degraus. Carga 1: 3 bolhas maiores; carga 2: leque de 5. O dano se divide entre as bolhas. Tipo `water` (`--energy-water`). Células de 40px, exibido em 100px. Roster passou a 6 colunas
- [x] Bellotabuzz (elétrico, HP 70, Soco Trovão / Choque do Trovão). Baseado no Electabuzz, sprites do PMD Sprite Collab (`idle=Idle walk=Walk attack=Punch shoot=Shoot hurt=Hurt defend=Charge`; os arquivos vieram com sufixo ` (1)`, renomear antes de rodar o script). Soco Trovão é a investida normal (cone) com `tuning.meleeShock`: o acerto solta arcos elétricos pixelados em volta do alvo (`spawnShockSparks`). Choque do Trovão (`ranged: "bolt"`, `bolt.ts`) estala na mão por `BOLT_WINDUP_MS` (120ms) e cai na hora até 520px; o ponto de parada é decidido no fim do estalo, então dá para esquivar. Zigue-zague de `boltPath` desenhado na grade de 4px, pisca 3 vezes trocando a forma e o alpha em degraus, com galhos curtos aleatórios. Carga 1: raio de 2 blocos; carga 2: 3 raios em leque (±20°) roxos, dano dividido. Tipo `lightning` (`--energy-lightning`). Células de 56px, exibido em 140px. Roster passou a 7 colunas
- [x] Sprites no formato PMD (`AnimData.xml` + `*-Anim.png` + `*-Shadow.png`) viram folhas da arena com `pnpm tsx scripts/arena/pack-pmd-sprites.ts <origem> <destino> idle=Idle walk=Walk attack=Strike shoot=Attack hurt=Hurt`. O pixel branco da sombra é a âncora dos pés; o script imprime `cellSize` e `columns`
- [x] `power` substitui o dano da carta em `attackPower`. O nome curto (`hudName`) aparece nos blocos de ataque
- [x] A cena só carrega as folhas dos dois lutadores do matchup. Chaves de textura e animação levam o id do lutador. O corpo físico escala pelo tamanho da célula
- [x] O mesmo lutador pode ficar dos dois lados. No espelho o oponente ganha um tint azulado, mantido depois do flash de dano
- [x] Tela de escolha: painel do lutador do lado ativo com idle sul animado (sprite CSS, `fighter-sprite.tsx`), textura e gradiente do tipo, HP, ataques com poder e recarga. Slots Você / Oponente e grade de lutadores marcam P1 e CPU
- [x] Novo lutador: criar `src/lib/arena/fighters/<id>.ts`, pôr as folhas em `public/arena/characters/<id>/` e registrar em `ARENA_FIGHTERS`. Tipo novo pede entrada em `fighter-appearance.ts`
- [x] Efeitos de ataque em pixel art (bola, osso, estrela, bolhas e feixe): artes como texto em `fx-textures.ts`, escala inteira, posição arredondada, giro e estouro em degraus, partículas `fx-pixel` (`pixel-fx.ts`); o feixe é desenhado numa grade de blocos de 4px. O osso do Ossomerang cresceu (arte 22x10, 44x20 no tiro base; `BONE_RADIUS` 14 → 16). Padrão para ataques novos em `docs/arena-pixel-fx.md`

## Moedas por vitória

- [x] Vitória paga 5 moedas no normal e 10 no difícil. Só as 4 primeiras vitórias do dia pagam (dia em `America/Sao_Paulo`). Regras em `src/lib/arena/rewards.ts`
- [x] A luta continua no cliente. Ao iniciar (boot, reinício, nova batalha) o cliente chama `POST /api/arena/matches` com a dificuldade e recebe um `matchId`. Na vitória chama `POST /api/arena/matches/:id/win`, na derrota `POST /api/arena/matches/:id/defeat`
- [x] Com as 4 vitórias premiadas do dia já usadas, o início não grava partida e devolve `matchId: null`. A luta roda normal e a vitória mostra o aviso de limite
- [x] Derrota fecha a partida com `finished_at`, `outcome = 'defeat'` e `reward = 0`
- [x] Tabela `arena_matches` (`difficulty`, `started_at`, `finished_at`, `outcome` `victory`/`defeat`, `reward`). Partida sem `finished_at` foi abandonada (reinício ou saída no meio). O claim roda numa transação: trava a partida e a carteira, recusa partida de outro usuário, já finalizada ou com menos de 15s, conta as vitórias premiadas do dia, credita a carteira e grava `coin_ledger` com `reason = 'arena_win'`
- [x] O overlay de vitória mostra "+N moedas · X/4", o aviso de limite ou a falha. O saldo do header atualiza invalidando `profileKeys.me()`
- [ ] Limite conhecido: o servidor confia que o cliente venceu. O teto diário limita o abuso a 40 moedas por dia

## Consumíveis

- [x] Caixas caem a cada 6–10s em ponto aleatório dentro da área andável, fora dos obstáculos e a 160px+ dos lutadores. No máximo 3 no mapa; cada uma some em 15s (pisca nos últimos 3s). Regras em `src/lib/arena/pickups.ts`
- [x] Player e CPU coletam ao encostar (a CPU não persegue caixas). A caixa some com um estouro de partículas e o efeito aparece como texto flutuante acima do lutador, no estilo dos números de dano
- [x] Efeitos: Velocidade+ (×1.4 por 6s), Dano+ (×1.35 dano causado por 6s), Cura (+20% do HP máximo, instantânea), Sem recarga (zera a recarga de ataques e dash por 5s; a recarga em andamento acaba na hora) e Vulnerável (×1.4 dano recebido por 5s). Mesmo efeito renova a duração em vez de empilhar
- [x] Caixas e sombra em pixel art 16x16 (blocos de 3px, filtro nearest), assadas por tipo em `pickup.ts`. Balançam em degraus de pixel e soltam brilhos quadrados
- [x] Caixa tipada tem cor e ícone do efeito. Caixa misteriosa (roxa, "?", 30% das quedas) sorteia qualquer efeito na coleta, inclusive Vulnerável
- [x] Efeito temporário desenha um anel girando nos pés com faíscas subindo, na cor do efeito (`buff-aura.ts`). Pisca no último segundo e some ao expirar
- [x] K.O. e redimensionamento da tela limpam as caixas; K.O. limpa os efeitos

## Defesa

- [x] Segurar Shift defende: o golpe recebido causa 30% do dano (mín. 1, tag "Defendeu") e não coloca o lutador em hurt, então ele segue andando. Vale para corpo a corpo e todos os projéteis. Regras em `src/lib/arena/defense.ts`
- [x] Defendendo, anda a 35% da velocidade e não ataca, carrega nem dá dash. Começar a defender cancela a carga
- [x] Barra de guarda (100): cada bloqueio gasta 22 + 18 por nível de carga do golpe. Recarrega 45/s depois de 0,5s sem defender. Zerou: "GUARDA QUEBRADA!", o golpe atordoa e a defesa fica bloqueada por 1,2s (slot SHIFT do HUD em recarga, barra de guarda no rodapé)
- [x] Papaitaxone e Joãovee usam a animação `Charge` do PMD como `defend.png`; quem não tem folha defende no `idle`. Todos ganham a bolha de escudo hexagonal (`shield-fx.ts`), que pisca e solta faíscas no bloqueio, racha com guarda baixa e estilhaça ao quebrar
- [x] CPU defende ao ver o jogador iniciar um golpe (corpo a corpo só de perto): 15% / 35% / 60% de chance por 350 / 450 / 550 ms em fácil / normal / difícil
- [x] Tutorial ganhou o passo "Defender" depois do Dash: o boneco atira fraco a cada 1,8s e o passo conclui ao bloquear um tiro (parry também conta). No treino o HP do jogador também recarrega abaixo de 30%
- [x] Parry: golpe que chega até 100 ms depois de levantar a guarda é anulado (sem dano, sem gastar guarda), com banner "PARRY!", flash dourado e anel de estilhaços em pixel (`parryShield`). Baixar a guarda fecha a janela por 500 ms, então apertar/soltar Shift sem parar não funciona. Contra-ataque automático, um por levantar, com força de carga nível 1: corpo a corpo aparado atordoa o atacante e o defensor investe nele; tiro aparado vira um tiro do próprio defensor de volta no atacante
- [x] CPU faz parry em 0% / 12% / 20% das defesas (fácil / normal / difícil). Quando decide fazer parry, a janela dela cobre a defesa inteira (pega tiro de longe); na defesa comum ela levanta a guarda só depois da janela de parry

## Ataque especial

- [x] Terceiro ataque por lutador, tecla 3 (o scroll cicla os três slots). Clique dispara na mira, sem carga por segurar. Dano `attackPower("special")` (×0.7, teto 30% do HP do alvo)
- [x] Medidor (0–100) em `src/lib/arena/special.ts`: acertar dá `9 + 90 × dano/HP`, apanhar dá `15 + 170 × dano/HP`, defender dá 8 e parry dá 18 (golpe médio: ~5 acertos ou 3 golpes sofridos enchem). Dano de especial não enche medidor de ninguém. Cheio libera o slot ESPECIAL (banner "ESPECIAL PRONTO!", onda no anel) e o disparo zera o medidor. Reinício zera
- [x] HUD: slot ESPECIAL (ícone `Sparkles`) com barra do medidor e selo "PRONTO"; barra fina do especial sob o HP dos dois lutadores (dá para ver quando a CPU está pronta). Painel do picker mostra o especial
- [x] CPU usa o especial quando pronto, no alcance (`SPECIAL_RANGE`) e sem bloco no caminho, depois de esperar `specialDelayMs` (1,5s / 0,6s / 0 em fácil / normal / difícil)
- [x] Especiais (uma mecânica nova cada, efeitos em pixel art conforme `docs/arena-pixel-fx.md`):
  - Antoniomander — Redemoinho de Fogo (`fire-tornado.ts`): furacão de fogo guiado por 3,5s. O WASD move o furacão em vez do lutador (CPU: vai até o jogador) a 340px/s, preso a 900px do dono, e para em bloco (queima o bloco). Quem encosta leva tique de dano a cada 250ms (sem travar em hurt) e anda a 50%. Visual: funil de faixas espirais de fogo em 12 elipses na grade de 4px (base fina, topo largo com miolo de fumaça e espiral girando), cauda balançando e brasas soltas. Por onde passa o chão fica queimado (manchas de carvão irregulares na grade de 4px, brasas que esfriam de laranja para vermelho e apagam; some em degraus após ~4,5s, só visual). Acerto no oponente solta chamas pixel subindo pelo corpo dele e brasas; o som `fire-tornado-hit.wav` toca quando o furacão começa a encostar (intervalo mínimo de 0,9s). Enquanto guia, o Antoniomander fica parado, sem atacar, defender nem dar dash (`channelUntil`); golpe que passa nele desfaz o furacão e clicar de novo encerra antes. O anel mostra o tempo restante
  - Calvossauro — Névoa de Veneno (`toxic-mist.ts`), como o Spray Tóxico da Emz: a rajada sai da boca e avança 400px em 0,4s crescendo de 26 para 100px de raio (para em bloco). Quem ela varre leva um acerto (35% do dano) uma vez. No fim vira nuvem parada por 1s: tique a cada 250ms em quem estiver dentro (30% do dano somado). Qualquer contato envenena por 3s (50% do dano somado nos 6 tiques) (tique a cada 500ms que a defesa não segura); reencostar renova, não empilha. Calvossauro imune. Som `toxic-mist.wav` no disparo; cada dano dentro da névoa toca o laser agudo (rate 1,5–2,1, tom sorteado) como bolha estourando. Visual: névoa em caroços roxos com miolo escuro e costuras entre caroços, veios verdes ondulados com falhas, gavinhas grossas com gancho nas bordas, pontinhos verdes e bolhas tóxicas estourando, na grade de 4px e em degraus de 90ms
  - Mira da Névoa: com o slot especial selecionado a seta vira um cone do alcance da névoa (boca 52px, ponta 200px de largura, 400px). Segurar o clique enche a força em 0,9s (preenchimento verde até onde a névoa vai cair, faixa na frente; branca no máximo); soltar dispara com alcance de 120px (clique rápido) a 400px (força cheia). Dano, dash, defesa ou paralisia cancelam. A CPU mira com a força que cai no jogador. Névoa e acerto ficam no nível dos pés, alinhados ao cone
  - Envenenado (`poison-fx.ts`): selo pixel (gota verde com caveira) balançando sobre a cabeça, pisca no último segundo; bolhas roxas sobem do corpo em degraus e estouram em anel pixel; cada tique estoura uma bolha maior. HUD mostra o chip "Veneno" piscando ao lado do medidor do especial
  - Papaitaxone — Terremoto (`quake.ts`): anel que cresce até 300px em 600ms; acerta uma vez quando a borda passa. Indefensável (atravessa Shift e parry), só o dash escapa. Também acerta blocos
  - Joãovee — Último Recurso (`last-resort.ts`): exige alvo a até 380px e à vista; some e reaparece 4 vezes em volta do alvo (110ms cada), intocável durante a sequência, último golpe empurra
  - Douguitoryu — Surfar (`surf.ts`): onda que abre de 120 para 280px de largura enquanto avança até 640px na mira (560px/s, para em bloco) e empurra o alvo (sem empurrão se ele defender). Mira em cone com força igual à Névoa (`SPECIAL_AIM.surf`, alcance 200–640px, 0,9s para encher, força em azul). A CPU escolhe a força que cai no jogador. Onda com rastro, corpo, crista e espuma mais grossos, sai dos pés e fica abaixo dos lutadores
  - Bellotabuzz — Trovão (`thunder.ts`): marca os pés do alvo (ou o ponto mirado, se longe); 650ms depois o raio cai do céu em 70px e paralisa 1s. Sair da marca esquiva; defender segura sem paralisar
- [x] Mira reutilizável (`src/lib/arena/aim.ts`): `AimSpec` (hoje `kind: "cone"` com `range`, `minRange`, `nearWidth`, `farWidth`, `powerMs`), `aimPower`, `aimReach`, `powerForDistance`, `coneWidth`, `conePolygon`. Desenho em `drawAimShape` (`entities/aim.ts`, grade de 4px). Especial ganha mira própria com uma entrada em `SPECIAL_AIM` (`special.ts`); a cena troca a seta pelo formato, enche a força enquanto o clique fica segurado e passa o alcance (`reach`) até `tryAttack`/`launchSpecial`. Formato novo = novo `kind` no tipo e no desenho
- [x] Estados novos no `Player`: `slowUntil`, `stunnedUntil` (`stunPlayer`, sem andar, atacar, defender nem dash), `untouchableUntil`, `channelUntil` (`isChanneling`/`endChannel`) e `poison` (`applyPoison`/`poisonTick`, avançado em `stepCombat`). K.O. limpa veneno e canalização

## Controle (gamepad)

- [x] Leitura direta de `navigator.getGamepads()` (layout padrão W3C, primeiro controle conectado) em `src/game/arena/input/arena-gamepad.ts`; regras puras (zona morta, auto-mira, soma com teclado) em `src/lib/arena/gamepad.ts`. Teclado/mouse seguem valendo junto
- [x] Analógico esquerdo (ou direcional) anda; meio tombo anda mais devagar (`clampMove`, zona morta radial de 0,2). Analógico direito mira; solto, mira sozinho no oponente. Com especial de alcance (cone) o ponto mirado fica no alcance máximo dele
- [x] Um botão por golpe: A corpo a corpo, X distância, Y especial. Apertar já seleciona o slot; segurar carrega (ou enche a força da mira) e soltar dispara. Y de novo enquanto guia o furacão encerra antes
- [x] B ou RB dá dash; segurar LB ou LT defende (parry igual ao Shift). Start pausa e retoma (lido no React, já que a cena pausada não roda `update`)
- [x] O último input usado (`device` no HUD) troca os rótulos do HUD (A/X/Y/B/LB) e os textos do tutorial
- [x] Menus pelo controle (`use-gamepad-menu.ts`, foco espacial em `src/lib/arena/menu-nav.ts`): direcional/analógico move o foco entre os botões da tela (segurar repete), A clica, realce `[data-pad-nav]` some ao usar o mouse. Vale no pause/vitória/derrota (B continua a luta), fim do tutorial, escolha de lutador (LB/RB troca você/oponente, Start vai para a arena) e escolha de arena (B volta, Start luta). Botão ainda segurado ao trocar de tela ou retomar a luta não conta como aperto (`settledPad`)

| Ação | Controle | Teclado |
|---|---|---|
| Andar | Analógico esquerdo / direcional | WASD / setas |
| Mirar | Analógico direito (solto = auto-mira) | Mouse |
| Corpo a corpo / Distância / Especial | A / X / Y (segurar carrega) | 1 / 2 / 3 + clique |
| Dash | B ou RB | Espaço |
| Defesa | LB ou LT (segurar) | Shift |
| Pausar | Start | Esc |

## Etapa 8 — Polimento e validação final

Objetivo: fechar o MVP.

- [ ] Corrigir o que os testes manuais acharem
- [ ] Conferir o destroy ao sair da rota
- [ ] Rodar `pnpm lint`, `pnpm test` e `pnpm build`
- [ ] Anotar os limites: sem PvP, roster fixo em código, batalha só em memória

Aceite: uma luta inteira inicia, termina e reinicia. Pokédex, loja e admin continuam abrindo.

## Fora do escopo

- [ ] Multiplayer, PvP, WebSockets e Colyseus
- [ ] Matchmaking, salas e ranking
- [ ] Inventário, evolução e progressão
- [ ] Monetização
- [ ] Reescrita do cadastro de cartas

## Próximo passo

A etapa 8. Polimento e validação final.
