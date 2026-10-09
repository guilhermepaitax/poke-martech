type Member = {
  id: string;
  name: string;
  trait: string;
  stamps: string[];
  spices: string[];
  flavors: string[];
  visual: string;
};

const MEMBERS: Member[] = [
  {
    id: "mago",
    name: "Mago",
    trait: "dev careca",
    stamps: ["Calva", "Careca", "Mago", "Antonio", "Calvo"],
    spices: ["Calvo", "Careca", "Brue", "Brincadeira", "Tooltip"],
    flavors: [
      "A careca reflete o monitor e o code review perde o foco.",
      "Raspa a cabeça e o build, milagrosamente, passa.",
      "Sem um fio de cabelo, sobra espaço para mais um import.",
      "O brilho da careca já derrubou duas dailies.",
      "O problema dele são as brrincadeiras",
      "Azul brue é sua cor favorita",
    ],
    visual:
      "Cabeça lisa e brilhante, sem um fio de cabelo, postura de quem vive no editor.",
  },
  {
    id: "rafa",
    name: "Rafa",
    trait: "dev virado em Jiraiya",
    stamps: ["Raf", "Jiraya", "Rafa"],
    spices: ["Jiraya", "Agente", "Rafa"],
    flavors: [
      "Virado em um Jiraiya",
      "Cabelo branco, pose de sapo e um pergaminho no lugar do README.",
      "Sempre anda com um agente de segurança acompanhando",
      "Treina no telhado e commita quando o sol apaga.",
    ],
    visual:
      "Cabelo branco de eremita, marcas vermelhas no rosto e um jeito de sapo ninja.",
  },
  {
    id: "gabi",
    name: "Gabi",
    trait: "dev que odeia carecas",
    stamps: ["Gab", "Gabi"],
    spices: ["Cabelo", "Anti Careca", "Peladofobia"],
    flavors: [
      "Se aparece uma careca, bufa antes mesmo do oi.",
      "O cabelo volumoso é escudo e argumento.",
      "Recusa pair programming com quem reflete a luz.",
    ],
    visual:
      "Cabelo enorme e cheio, expressão de quem não tolera careca por perto.",
  },
  {
    id: "paitax",
    name: "Paitax",
    trait: "dev frequentador do submundo",
    stamps: ["Pai", "Paitax", "Papaitax", "Papai"],
    spices: ["Submundo", "Paitax", "Papai"],
    flavors: [
      "Opa, bom dia! Pessoal",
      "Tá bom, não tá?",
      "Dizem que vivia no submundo, mas não se tem provas",
      "Volta do submundo com um bug novo e zero explicação.",
    ],
    visual:
      "Capuz, sombras e um ar de quem frequenta o submundo depois do expediente.",
  },
  {
    id: "joao",
    name: "João",
    trait: "dev do submundo que ama franjudas",
    stamps: ["Jão", "João"],
    spices: ["Franja", "Submundo"],
    flavors: [
      "No submundo, não pode ver uma franja",
      "Prioridade número um: a franja. O deploy que espere.",
      "Coleciona franjudas do mesmo jeito que fecha ticket.",
      "De dia dev, de noite caminhoneiro",
    ],
    visual:
      "Franja marcada cobrindo a testa, clima de submundo e um sorriso de quem gosta de franjudas.",
  },
  {
    id: "doug",
    name: "Doug",
    trait: "dev que sonha em ser pai",
    stamps: ["Doug", "Douguito", "Dougras"],
    spices: ["Papai", "Doug", "Neném", "Bebê"],
    flavors: [
      "Treina o golpe pensando no dia em que vai ser pai.",
      "Já escolheu o nome do filho e ainda não o do branch.",
      "Embala o bug para dormir e promete corrigir amanhã.",
      "Olha carrinho de bebê no meio do planejamento.",
    ],
    visual:
      "Olhar sonhador de futuro pai, energia paternal, como se já carregasse uma mochila de bebê.",
  },
  {
    id: "bellotti",
    name: "Bellotti",
    trait: "dev backend que faz piadas sem graça",
    stamps: ["Bellotti", "Bellotinho", "Bello"],
    spices: ["Zueira", "Backend", "Piada", "Música"],
    flavors: [
      "A piada sem graça chega antes do response.",
      "O backend aguenta. A mesa, nem sempre.",
      "Conta o trocadilho e o endpoint devolve 500.",
      "Cria uma música nova para cada bug",
    ],
    visual:
      "Jeito de dev backend contando uma piada sem graça, meio sorriso, zero plateia.",
  },
  {
    id: "wilson",
    name: "Wilson",
    trait: "QA que gosta de BYD e do Mickey",
    stamps: ["Wilson", "Wil"],
    spices: ["Byd", "Mickey", "QA", "Teste"],
    flavors: [
      "Abre o bug, estaciona o BYD e ainda fala do Mickey.",
      "O relatório de QA vem com orelha redonda no canto.",
      "Adora fazer um deploy e ficar parado no trânsito.",
      "Rei dos testes automatizados",
      "Pra quem puder e quiser, ele tem uma carona no BYD",
    ],
    visual:
      "Orelhas redondas de Mickey e um detalhe de carro BYD, postura de QA.",
  },
  {
    id: "julia",
    name: "Julia",
    trait: "QA que não gosta dos devs",
    stamps: ["Julia", "Ju"],
    spices: ["Antidev", "Julia", "Bug"],
    flavors: [
      "Olhou para o dev, suspirou e abriu o bug.",
      "QA primeiro, paciência com dev nunca.",
      "Cada commit vira um defeito até que se prove o contrário.",
      "O oi já vem com severidade alta.",
    ],
    visual:
      "Postura de QA com olhar desconfiado, como se todo dev fosse um defeito ambulante.",
  },
  {
    id: "thiago",
    name: "Thiago",
    trait: "dev que estraga os testes automatizados",
    stamps: ["Thi", "Thiago"],
    spices: ["Rensga", "Paia", "Quebra", "Testes", "Fisioterapia"],
    flavors: [
      "Passou perto da suíte e a pipeline ficou vermelha.",
      "O teste automatizado foge quando escuta o nome.",
      "Um refactor inocente e o CI pede demissão.",
      "Não quebra de propósito. O resultado é o mesmo.",
      "Rensgaaa! O teste quebrou!",
    ],
    visual:
      "Cercado de testes quebrados e um CI vermelho, ar de quem não fez por mal.",
  },
  {
    id: "gerhard",
    name: "Gerhard",
    trait: "DevOps",
    stamps: ["Gerhard", "Ger"],
    spices: ["Deploy", "Argentino", "Branch", "Moto"],
    flavors: [
      "Se passou na máquina dele, já era deploy.",
      "O changelog que se vire depois do push.",
      "Sobe sexta à noite e chama isso de estabilidade.",
      "Pipeline verde é opinião. Produção é fato.",
    ],
    visual:
      "Headset, terminal aberto e a calma de quem sobe deploy no fim da sexta.",
  },
  {
    id: "allyshow",
    name: "Allyshow",
    trait: "QA do time",
    stamps: ["Ally", "Allyshow"],
    spices: ["Teste", "Check", "Tricas"],
    flavors: [
      "Checklist na mão e bug na mira.",
      "Nenhuma história passa sem critério de aceite.",
      "Encontra a falha que o resto jurou que não existia.",
      "Aprova só quando o cenário chato também passa.",
    ],
    visual:
      "Prancheta de QA, olhar atento, caçando a falha que o resto deixou passar.",
  },
  {
    id: "hercules",
    name: "Hercules",
    trait: "dev do time",
    stamps: ["Hercu", "Hércules"],
    spices: ["Código", "Força"],
    flavors: [
      "Carrega o sprint nas costas e ainda sobra review.",
      "Rebaseia o que o resto tem medo de tocar.",
      "O porte é de quem segura a release sozinho.",
      "Força no código e zero drama no canal.",
    ],
    visual:
      "Porte forte de dev que segura o sprint, braços de quem rebaseia sem medo.",
  },
  {
    id: "tauan",
    name: "Tauan",
    trait: "dev do time",
    stamps: ["Tauan", "Tau"],
    spices: ["Código", "Commit", "Bombeiro"],
    flavors: [
      "Aparece, commita e segue o fluxo.",
      "O time agradece em silêncio e abre o próximo card.",
      "Entra na branch, resolve e some antes do standup acabar.",
      "Sem alarde: o diff fala por ele.",
    ],
    visual:
      "Dev do time, fone no pescoço e moletom, no meio do fluxo sem alarde.",
  },
];

export { MEMBERS };
export type { Member };
