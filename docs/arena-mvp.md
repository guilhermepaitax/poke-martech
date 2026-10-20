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
- [ ] Etapa 7 — HUD e encaixe visual
- [ ] Etapa 8 — Polimento e validação final

## Contexto do app

- Next.js 16.3.8, App Router, React 19, TypeScript strict, pnpm.
- A unidade cadastrada é a carta (`Card`): nome, HP, tipo, imagem e ataques. Não existe sprite sheet nem ciclo de caminhada.
- A batalha de cartas antiga foi removida. Este MVP não restaura decks, adversários nem as tabelas derrubadas pela migration `0012`.
- Rota autenticada: `/batalha`. Flag `FEATURE_FLAG_ARENA` (`arena`). Ausência da variável deixa a função ligada. Desligada, a nav esconde o link e a rota mostra `FeatureUnavailable`.
- Phaser 4.2.1 sobe só no cliente, com `next/dynamic` e `ssr: false`. O `useEffect` destrói o jogo ao sair da rota.
- Regras puras ficam em `src/lib/arena`. A engine fica em `src/game/arena`. A interface React fica em `src/components/arena`.

## Decisões já fechadas

- Lutadores do MVP serão duas cartas publicadas fixas, via adaptador. Sem picker e sem API nova de catálogo.
- Carta sem imagem usa um fallback geométrico e não quebra a cena.
- A partida não é persistida. Sem tabela nova e sem recompensa.
- O canvas ocupa a tela abaixo do header e nunca passa da largura da janela. Não há scroll horizontal.
- O fundo é `public/arena/arena-floor.jpg`. A proporção da arte é mantida. O mundo é maior que a câmera nos dois eixos (`arenaWorldSize`, overflow 1.5), centralizado. O que fica fora da tela será revelado quando a câmera seguir o personagem.
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
  - Difícil é a CPU da etapa 5: velocidade 255, cooldown 1.6×, dano 1×, feixe até 65% do alcance
  - Normal: velocidade 200, cooldown 2.6×, dano 0.6×, feixe até 45% do alcance
- [x] Dash esquiva: durante o dash de Espaço (160 ms) o lutador não leva dano. O feixe confere a posição do alvo na chegada, então sair da linha durante a carga também esquiva. Isso substitui o "sem invulnerabilidade" da etapa 5
- [x] Som `public/arena/audio/dash.wav` no dash

## Etapa 7 — HUD e encaixe visual

Objetivo: a luta fica legível dentro do shell.

- [ ] HP, nomes e imagem dos dois lutadores
- [ ] Cooldown do ataque
- [ ] Loading e erro de boot
- [ ] Nova batalha e voltar à Pokédex
- [ ] O HUD só reflete o snapshot emitido pela cena, não a posição por frame
- [ ] Cores pelos tokens do app, no desktop e na nav mobile

Aceite: o HUD bate com o HP real e a navegação antiga continua igual.

## Etapa 8 — Polimento e validação final

Objetivo: fechar o MVP.

- [ ] Corrigir o que os testes manuais acharem
- [ ] Conferir o destroy ao sair da rota
- [ ] Rodar `pnpm lint`, `pnpm test` e `pnpm build`
- [ ] Anotar os limites: sem sprite de caminhada, sem PvP, dois cards fixos, batalha só em memória

Aceite: uma luta inteira inicia, termina e reinicia. Pokédex, loja e admin continuam abrindo.

## Fora do escopo

- [ ] Multiplayer, PvP, WebSockets e Colyseus
- [ ] Matchmaking, salas e ranking
- [ ] Inventário, evolução e progressão
- [ ] Monetização
- [ ] Reescrita do cadastro de cartas

## Próximo passo

A etapa 7. HUD legível dentro do shell.
