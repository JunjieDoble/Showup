export const DEMO_CODE = 'SHOW-4821';

export const demoTeams = [
  { id:'linces', name:'Los Linces', color:'#26d7e8', emblem:'◆', members:['Marta','Nil','Ona'], score:1180, turnScore:0, correct:2, totalTime:41, previousRank:1 },
  { id:'up', name:'Tu equipo', color:'#8067ff', emblem:'▲', members:['Tú','Leo','Aina'], score:1050, turnScore:0, correct:2, totalTime:46, previousRank:2 },
  { id:'avion', name:'Modo Avión', color:'#ff647c', emblem:'✦', members:['Pol','Sara','Eric'], score:920, turnScore:0, correct:1, totalTime:54, previousRank:3 }
];

export const demoActivities = [
  {
    id:'q1', type:'quiz', maxPoints:1000, timeLimit:40,
    title:{es:'Decisiones en equipo',ca:'Decisions en equip'},
    prompt:{es:'¿Qué acción ayuda más a resolver un desacuerdo dentro de un equipo?',ca:'Quina acció ajuda més a resoldre un desacord dins d’un equip?'},
    instructions:{es:'Votad una opción. La mayoría decide la respuesta del equipo.',ca:'Voteu una opció. La majoria decideix la resposta de l’equip.'},
    options:{es:['Evitar hablar del problema','Escuchar y buscar un punto común','Dejar que decida una sola persona','Dividir el equipo'],ca:['Evitar parlar del problema','Escoltar i buscar un punt comú','Deixar que decideixi una sola persona','Dividir l’equip']},
    correct:1
  },
  {
    id:'h1', type:'hangman', maxPoints:1000, timeLimit:55, maxErrors:6,
    title:{es:'Concepto oculto',ca:'Concepte ocult'},
    prompt:{es:'Capacidad de trabajar con otras personas para alcanzar un objetivo común.',ca:'Capacitat de treballar amb altres persones per assolir un objectiu comú.'},
    instructions:{es:'Elegid letras y descubrid el concepto.',ca:'Trieu lletres i descobriu el concepte.'},
    answer:'COLABORAR'
  },
  {
    id:'w1', type:'wordsearch', maxPoints:1000, timeLimit:70, size:9,
    title:{es:'Palabras que construyen equipo',ca:'Paraules que construeixen equip'},
    prompt:{es:'Encuentra cuatro conceptos relacionados con el aprendizaje colaborativo.',ca:'Troba quatre conceptes relacionats amb l’aprenentatge col·laboratiu.'},
    instructions:{es:'Marca la primera y la última letra de cada palabra.',ca:'Marca la primera i l’última lletra de cada paraula.'},
    words:['EQUIPO','RETO','IDEA','AULA']
  },
  {
    id:'c1', type:'crossword', maxPoints:1000, timeLimit:85,
    title:{es:'El reto compartido',ca:'El repte compartit'},
    prompt:{es:'Completa el crucigrama con conceptos de la experiencia.',ca:'Completa els mots encreuats amb conceptes de l’experiència.'},
    instructions:{es:'Selecciona una pista y escribe la respuesta.',ca:'Selecciona una pista i escriu la resposta.'},
    entries:[
      {answer:'EQUIPO', clue:{es:'Grupo que comparte un objetivo.',ca:'Grup que comparteix un objectiu.'}},
      {answer:'RETO', clue:{es:'Problema que invita a actuar.',ca:'Problema que convida a actuar.'}},
      {answer:'IDEA', clue:{es:'Primera forma de una posible solución.',ca:'Primera forma d’una possible solució.'}},
      {answer:'AULA', clue:{es:'Espacio donde ocurre la experiencia.',ca:'Espai on passa l’experiència.'}}
    ]
  }
];

export const socialParticipants = [
  {name:'Marta',avatar:'M',delay:500},{name:'Nil',avatar:'N',delay:1050},{name:'Ona',avatar:'O',delay:1700},
  {name:'Pol',avatar:'P',delay:2300},{name:'Sara',avatar:'S',delay:2950},{name:'Eric',avatar:'E',delay:3600}
];

export const gameMeta = {
  quiz:{icon:'◫',color:'#bdf34a'}, hangman:{icon:'⌁',color:'#ff647c'}, wordsearch:{icon:'⌗',color:'#26d7e8'}, crossword:{icon:'✣',color:'#ffc83d'}
};
