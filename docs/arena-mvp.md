# MVP da arena 2D

Batalha em arena top-down contra a CPU, dentro do app Next.js existente, com Phaser 4 e Arcade Physics. A luta fica só no navegador. Não há multiplayer, PvP, salas, ranking, inventário nem progressão.

Cada etapa abaixo deve poder ser jogada e verificada antes da seguinte. Não avançar para a próxima sem aprovação.

## Estado

- [x] Etapa 0 — Auditoria e planejamento
- [x] Etapa 1 — Phaser integrado à aplicação
- [x] Ajustes visuais pedidos depois da etapa 1
- [ ] Etapa 2 — Movimentação do jogador
- [ ] Etapa 3 — Cartas fixas como lutadores
- [ ] Etapa 4 — Combate básico
- [ ] Etapa 5 — CPU
- [ ] Etapa 6 — Vitória, derrota e reinício
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

Ainda não existe personagem. A câmera só revela o resto do fundo quando a etapa 2 passar a segui-lo.

## Etapa 2 — Movimentação do jogador

Objetivo: controlar um personagem provisório dentro da arena.

- [ ] Entidade do jogador em `src/game/arena/entities/player.ts`
- [ ] Oito direções, WASD e setas
- [ ] `normalizeMove` em `src/lib/arena/movement.ts`, com teste de eixo, diagonal e input zero
- [ ] Velocidade pelo Arcade, usando o delta, sem atualizar x/y pelo React
- [ ] Colisão com os bounds do mundo e com os obstáculos
- [ ] Setas não rolam a página enquanto o canvas está em foco
- [ ] A câmera segue o personagem e mostra as partes do fundo que começam fora da tela
- [ ] Sprite provisório enquanto não houver arte de caminhada

Aceite: a diagonal não é mais rápida que os eixos, o personagem não sai do mundo e o React não escreve a posição a cada frame.

## Etapa 3 — Cartas fixas como lutadores

Objetivo: a cena recebe dois fighters vindos de cartas publicadas.

- [ ] `cardToFighter`: id, nome, HP mínimo 1, URL da imagem e dano do primeiro ataque numérico
- [ ] Use case que lê dois slugs fixos, chamado pela página, sem mudar as APIs atuais
- [ ] Textura remota com fallback local se a URL falhar ou vier vazia
- [ ] Testes do adaptador: com ataque, sem ataque, sem imagem e HP 0
- [ ] Sem animação de caminhada enquanto não houver sprite sheet

Aceite: uma carta sem imagem entra na arena. `GET /api/cards/[id]` continua só devolvendo carta publicada e possuída.

Pergunta em aberto: quais dois slugs usar. Sem preferência, os dois primeiros cards publicados do seed.

## Etapa 4 — Combate básico

Objetivo: o jogador mira com o mouse e causa dano uma vez por projétil.

- [ ] Traço opaco do lutador até o ponteiro
- [ ] Clique esquerdo dispara se o cooldown acabou
- [ ] Projétil com Arcade, removido no impacto e na borda do mundo
- [ ] Dano, cooldown e "já acertou" em funções puras, com teste
- [ ] Cooldown pelo relógio da cena, não por `setInterval` global
- [ ] Feedback breve no impacto

Aceite: o mesmo projétil não aplica dano duas vezes e o HP muda de forma previsível.

## Etapa 5 — CPU

Objetivo: oponente local e reproduzível, sem aleatoriedade.

- [ ] `decideCpu` puro: longe persegue, perto e pronto ataca, morto não age
- [ ] Perseguição com vetor normalizado
- [ ] Ataque no alcance, com o mesmo projétil da etapa 4, mirando o jogador
- [ ] Testes da tabela de decisão

Aceite: dá para vencer e perder. A CPU não lê input de outro jogador.

## Etapa 6 — Vitória, derrota e reinício

Objetivo: HP zero encerra a luta e outra começa sem recarregar a página.

- [ ] `resolveOutcome`
- [ ] Se os dois chegarem a zero no mesmo passo, a derrota é do jogador
- [ ] Bloquear movimento, ataque e CPU depois do fim
- [ ] Reinício com `shutdown` antes de recriar entidades, timers e projéteis
- [ ] Testes de vitória, derrota e empate simultâneo

Aceite: a segunda luta começa com HP cheio e sem projéteis da anterior.

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

A etapa 2. Ela depende da câmera e do mundo já montados: o personagem se move no mundo, e a câmera o segue para revelar o fundo.
