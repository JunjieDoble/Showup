import { DEMO_CODE, demoTeams, demoActivities, socialParticipants, gameMeta } from './data.js';
import { makeTranslator } from './i18n.js';
import { normalize, calculatePoints, createWordSearch, createCrossword, hangmanParts, cellsBetween } from './games.js';

const app = document.querySelector('#app');
const modalRoot = document.querySelector('#modal-root');
const toast = document.querySelector('#toast');
const languageSelect = document.querySelector('#language');
const homeAction = document.querySelector('#home-action');

const clone = (value) => JSON.parse(JSON.stringify(value));
const state = {
  lang: localStorage.getItem('showup_lang') || 'es', screen:'home', role:null, userName:'',
  roomCode:DEMO_CODE, roomCreated:false, activities:clone(demoActivities), teams:clone(demoTeams), currentTeamId:'up',
  currentActivity:0, gameData:null, timer:null, simTimers:[], roundResult:null, editorType:'quiz', editIndex:null,
  joinedParticipants:[], sessionStarted:false, paused:false, createTeamOpen:false, resultsHistory:[{date:'18/10',teams:3,winner:'Los Linces'},{date:'11/10',teams:4,winner:'Beta Crew'}]
};
const t = makeTranslator(() => state.lang);
const tr = (value) => typeof value === 'object' ? (value[state.lang] || value.es || Object.values(value)[0]) : value;
const esc = (value='') => String(value).replace(/[&<>'"]/g,(c)=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const gameName = (type) => t(type);
const currentActivity = () => state.activities[state.currentActivity];
const currentTeam = () => state.teams.find((team) => team.id === state.currentTeamId) || state.teams[0];

function updateStaticLanguage(){
  document.documentElement.lang=state.lang;languageSelect.value=state.lang;
  document.querySelectorAll('[data-i18n]').forEach((el)=>el.textContent=t(el.dataset.i18n));
}
function setScreen(screen){stopTimer();clearSimTimers();state.screen=screen;homeAction.classList.toggle('hidden',screen==='home');render();window.scrollTo({top:0,behavior:'smooth'});}
function render(){updateStaticLanguage();const renders={home:renderHome,teacherLogin:()=>renderLogin('teacher'),studentLogin:()=>renderLogin('student'),dashboard:renderDashboard,editor:renderEditor,room:renderRoom,teams:renderTeams,waiting:renderWaiting,teacherLive:renderTeacherLive,game:renderGame,result:renderResult,podium:renderPodium};app.innerHTML=(renders[state.screen]||renderHome)();app.focus({preventScroll:true});if(state.screen==='game')afterGameRender();}
function showToast(message){toast.textContent=message;toast.classList.add('show');clearTimeout(showToast.timer);showToast.timer=setTimeout(()=>toast.classList.remove('show'),2400);}
function showModal(title,content,actions=`<button class="btn btn-primary" data-action="close-modal">${t('close')}</button>`){modalRoot.innerHTML=`<div class="modal-backdrop"><section class="modal" role="dialog" aria-modal="true" aria-label="${esc(title)}"><h2>${esc(title)}</h2><div>${content}</div><div class="button-row">${actions}</div></section></div>`;}
function closeModal(){modalRoot.innerHTML='';}
function panelBack(){return `<button class="btn btn-ghost btn-small" data-action="back">← ${t('back')}</button>`;}
function gameIcon(type){const meta=gameMeta[type]||gameMeta.quiz;return `<span class="game-icon" style="--game-color:${meta.color}">${meta.icon}</span>`;}

function renderHome(){return `<section class="screen home-screen">
  <div class="home-copy"><span class="eyebrow">${t('classMode')}</span><h1 class="home-title">SHOW <span>UP.</span></h1><p>${t('homeIntro')}</p>
    <h2>${t('chooseRole')}</h2><div class="role-buttons"><button class="role-card" data-action="role-teacher"><i>⌁</i><span><b>${t('teacher')}</b><small>${t('newSession')} · ${t('editActivities')}</small></span></button><button class="role-card" data-action="role-student"><i>▲</i><span><b>${t('student')}</b><small>${t('roomCode')} · ${t('joinTeam')}</small></span></button></div>
    <p class="social-label">${t('noAccount')}</p><div class="socials"><button data-social="Google">G · Google</button><button data-social="Discord">◉ · Discord</button><button data-social="Facebook">f · Facebook</button></div>
  </div>
  <div class="home-visual" aria-label="Vista previa de una partida"><div class="home-arena"><div class="arena-scoreline"><span>PARTIDA 03 / 04</span><span>00:24</span></div><h2 class="arena-question">${state.lang==='ca'?'Què fa que un equip funcioni?':'¿Qué hace que un equipo funcione?'}</h2><div class="arena-options"><span>A · ${state.lang==='ca'?'Treballar per separat':'Trabajar por separado'}</span><span>B · ${state.lang==='ca'?'Compartir un objectiu':'Compartir un objetivo'} ✓</span><span>C · ${state.lang==='ca'?'Evitar desacords':'Evitar desacuerdos'}</span><span>D · ${state.lang==='ca'?'Competir dins l’equip':'Competir dentro del equipo'}</span></div></div>
    <div class="floating-points"><b>+860</b><small>PTS</small></div><div class="floating-rank"><small>RANKING LIVE</small><div><b>1</b><span>Los Linces</span><strong>2.940</strong></div><div><b>2</b><span>Tu equipo</span><strong>2.720</strong></div><div><b>3</b><span>Modo Avión</span><strong>2.510</strong></div></div>
  </div></section>`;}

function renderLogin(role){const student=role==='student';return `<section class="screen screen-narrow"><div class="login-panel panel">${panelBack()}<span class="eyebrow">${student?t('student'):t('teacher')}</span><h1>${student?(state.lang==='ca'?'Entra a la partida':'Entra en la partida'):(state.lang==='ca'?'Prepara la classe':'Prepara la clase')}</h1><p>${student?(state.lang==='ca'?'El codi de demostració ja està preparat.':'El código de demostración ya está preparado.'):(state.lang==='ca'?'No cal contrasenya en aquesta demo.':'No necesitas contraseña en esta demo.')}</p>
  <form data-form="${role}-login"><label class="field">${t('alias')}<input name="name" maxlength="24" required placeholder="${student?'Alex':'Laia'}" value="${esc(state.userName)}" /></label>${student?`<label class="field">${t('roomCode')}<input name="code" required value="${DEMO_CODE}" autocomplete="off" /></label><label class="notice"><input type="checkbox" name="guest" /><span>${t('guestNotice')}<br><b>${t('accept')}</b></span></label>`:''}<div class="error-box" id="login-error"></div><button class="btn btn-primary btn-wide" type="submit">${t('continue')} →</button></form>
  </div></section>`;}

function renderDashboard(){
  const seconds=state.activities.reduce((sum,a)=>sum+(Number(a.timeLimit)||0),0),points=state.activities.reduce((sum,a)=>sum+(Number(a.maxPoints)||0),0);
  const rows=state.activities.length?state.activities.map((a,i)=>`<article class="activity-manage-row"><span class="activity-order">${String(i+1).padStart(2,'0')}</span>${gameIcon(a.type)}<span class="activity-copy"><b>${esc(tr(a.title))}</b><small>${gameName(a.type)} · ${a.timeLimit}s · ${a.maxPoints} pts</small></span><span class="activity-actions"><button class="mini-icon-btn" data-action="move-activity-up" data-index="${i}" ${i===0?'disabled':''} aria-label="${t('moveUp')}">↑</button><button class="mini-icon-btn" data-action="move-activity-down" data-index="${i}" ${i===state.activities.length-1?'disabled':''} aria-label="${t('moveDown')}">↓</button><button class="btn btn-ghost btn-small" data-action="edit-activity" data-index="${i}">${t('edit')}</button></span></article>`).join(''):`<div class="session-empty"><span>＋</span><h3>${t('emptySession')}</h3><p>${t('emptySessionText')}</p><button class="btn btn-primary" data-action="add-activity">${t('addActivity')}</button></div>`;
  return `<section class="screen teacher-dashboard"><div class="dashboard-head"><div><span class="eyebrow">${t('teacherPanel')}</span><h1>${t('welcome')}, ${esc(state.userName||'Laia')}</h1><p class="screen-subtitle">${t('teacherIntro')}</p></div><button class="btn btn-ghost" data-action="logout">${t('logout')}</button></div><div class="dashboard-grid"><article class="session-panel panel"><div class="session-top"><div><span class="tag tag-demo">${t('demoData')}</span><h2>${t('sessionName')}</h2><p class="screen-subtitle">${t('sessionPlan')}</p></div><button class="btn btn-secondary" data-action="load-demo">↻ ${t('loadDemo')}</button></div><div class="session-kpis"><div><b>${state.activities.length}</b><span>${t('activities')}</span></div><div><b>${Math.ceil(seconds/60)} min</b><span>${t('plannedTime')}</span></div><div><b>${points.toLocaleString(state.lang==='ca'?'ca-ES':'es-ES')}</b><span>${t('totalPoints')}</span></div></div><div class="activity-manage-list">${rows}</div><div class="session-actions"><button class="btn btn-primary" data-action="create-room" ${state.activities.length?'':'disabled'}>${t('createRoom')} →</button><button class="btn btn-ghost" data-action="add-activity">＋ ${t('addActivity')}</button></div></article><aside class="side-stack"><div class="quick-panel panel"><span class="eyebrow">${t('quickStart')}</span><h3>${t('newSession')}</h3><p class="screen-subtitle">${t('newSessionHelp')}</p><div class="quick-actions"><button class="btn btn-secondary" data-action="new-session">＋ ${t('newSession')}</button><button class="btn btn-ghost" data-action="add-activity">${t('continueEditing')}</button></div></div><div class="history-panel panel"><h3>${t('previous')}</h3>${state.resultsHistory.map(x=>`<div class="history-item"><span>${x.date}<small>${x.teams} equipos</small></span><strong>${esc(x.winner)}</strong></div>`).join('')}<small class="screen-subtitle">${t('demoData')}</small></div></aside></div></section>`;
}

function renderEditor(){
  const editing=state.editIndex!==null&&state.activities[state.editIndex],heading=editing?t('editExercise'):t('newExercise');
  return `<section class="screen"><div class="editor-heading"><div>${panelBack()}<span class="eyebrow">${t('sessionBuilder')}</span><h1>${heading}</h1></div></div><div class="editor-steps" aria-label="${t('creationSteps')}"><span class="active"><b>1</b>${t('chooseGameStep')}</span><span class="active"><b>2</b>${t('configureStep')}</span><span><b>3</b>${t('reviewStep')}</span></div><div class="editor-layout improved-editor"><aside class="editor-sidebar panel"><div class="sidebar-title"><h2>${t('gameSelector')}</h2><small>${t('chooseMechanic')}</small></div><div class="game-select">${['hangman','quiz','wordsearch','crossword'].map(type=>`<button class="${state.editorType===type?'active':''}" data-action="select-game" data-type="${type}">${gameIcon(type)}<span><b>${gameName(type)}</b><small>${editorDescription(type)}</small></span></button>`).join('')}</div><div class="session-queue"><div class="queue-head"><b>${t('sessionPlan')}</b><span>${state.activities.length}</span></div>${state.activities.length?state.activities.map((a,i)=>`<button class="queue-item ${i===state.editIndex?'active':''}" data-action="edit-activity" data-index="${i}"><span>${i+1}</span><b>${esc(tr(a.title))}</b><small>${a.timeLimit}s</small></button>`).join(''):`<p>${t('emptySessionShort')}</p>`}</div></aside><article class="editor-main panel"><div class="editor-context"><div>${gameIcon(state.editorType)}<span><small>${editing?t('editingExercise'):t('creatingExercise')}</small><h2>${gameName(state.editorType)}</h2></span></div><span class="tag tag-demo">${t('localDemo')}</span></div><p class="screen-subtitle">${t('editorHelp')}</p>${editorForm()}<div id="editor-error" class="error-box"></div><div class="editor-footer-actions"><button class="btn btn-ghost" data-action="preview-exercise">◉ ${t('preview')}</button><button class="btn btn-primary" data-action="save-exercise">${editing?t('saveChanges'):t('saveExercise')} →</button>${editing?`<button class="btn btn-danger" data-action="delete-activity" data-index="${state.editIndex}">${t('deleteExercise')}</button>`:''}</div><div class="preview-box" id="exercise-preview"><div class="preview-placeholder"><span>◉</span><h3>${t('preview')}</h3><p>${t('previewHelp')}</p></div></div></article></div></section>`;
}
function editorDescription(type){return {hangman:state.lang==='ca'?'Pista i paraula':'Pista y palabra',quiz:state.lang==='ca'?'De 2 a 4 opcions':'De 2 a 4 opciones',wordsearch:state.lang==='ca'?'Paraules en una graella':'Palabras en una cuadrícula',crossword:state.lang==='ca'?'Paraules i pistes':'Palabras y pistas'}[type];}
function editorForm(){
  const type=state.editorType,draft=state.editIndex!==null?state.activities[state.editIndex]:null,value=(item='')=>esc(typeof item==='object'?tr(item):item),title=value(draft?.title),prompt=value(draft?.prompt),instructions=value(draft?.instructions),time=draft?.timeLimit||60,points=draft?.maxPoints||1000;
  let extra='';
  if(type==='quiz'){const options=draft?.type==='quiz'?tr(draft.options):[],correct=draft?.type==='quiz'?draft.correct:0;extra=`<fieldset class="full editor-fieldset"><legend>${t('options')}</legend><p class="field-hint">${t('quizOptionsHelp')}</p>${[0,1,2,3].map((_,i)=>`<label class="choice-line"><span>${String.fromCharCode(65+i)}</span><input name="option${i}" value="${value(options[i]||'')}" placeholder="${t('option')} ${i+1}" ${i<2?'required':''}/><input type="radio" name="correct" value="${i}" ${i===correct?'checked':''} aria-label="${t('correctAnswer')} ${i+1}" /></label>`).join('')}</fieldset>`;}
  if(type==='hangman')extra=`<label class="field">${t('answer')}<input name="answer" required value="${value(draft?.type==='hangman'?draft.answer:'')}" placeholder="COLABORAR" /><small>${t('hangmanAnswerHelp')}</small></label><label class="field">${t('maxErrors')}<input name="maxErrors" type="number" min="3" max="8" value="${draft?.type==='hangman'?(draft.maxErrors||6):6}" /></label>`;
  if(type==='wordsearch')extra=`<label class="field full">${t('words')}<input name="words" required value="${value(draft?.type==='wordsearch'?draft.words.join(', '):'')}" placeholder="EQUIPO, RETO, IDEA, AULA" /><small>${t('wordListHelp')}</small></label><label class="field">${t('gridSize')}<select name="size">${[8,9,10,12].map(size=>`<option value="${size}" ${size===(draft?.type==='wordsearch'?draft.size:9)?'selected':''}>${size} × ${size}</option>`).join('')}</select></label>`;
  if(type==='crossword'){const entries=draft?.type==='crossword'?draft.entries.map(entry=>`${entry.answer} | ${tr(entry.clue)}`).join('\n'):'';extra=`<label class="field full">${t('clues')}<textarea name="entries" required placeholder="EQUIPO | Grupo con un objetivo\nRETO | Problema que invita a actuar\nIDEA | Primera forma de una solución">${value(entries)}</textarea><small>${t('crosswordEntriesHelp')}</small></label>`;}
  return `<form class="editor-form" id="editor-form"><div class="form-section-title full"><b>1</b><span><strong>${t('basicInfo')}</strong><small>${t('basicInfoHelp')}</small></span></div><label class="field">${t('title')}<input name="title" required value="${title}" placeholder="${gameName(type)}" /></label><label class="field">${t('time')} (s)<input name="time" type="number" min="10" max="300" value="${time}" required /></label><label class="field full">${t('prompt')}<textarea name="prompt" required placeholder="${t('promptPlaceholder')}">${prompt}</textarea></label><label class="field full">${t('instructions')}<input name="instructions" value="${instructions}" placeholder="${t('instructionsPlaceholder')}" /></label><label class="field">${t('points')}<input name="points" type="number" min="100" max="5000" value="${points}" required /></label><div class="form-section-title full"><b>2</b><span><strong>${t('gameContent')}</strong><small>${t('gameContentHelp')}</small></span></div>${extra}</form>`;
}

function renderRoom(){const invite=`${location.origin}${location.pathname}?room=${state.roomCode}`;return `<section class="screen"><div class="dashboard-head"><div>${panelBack()}<span class="eyebrow">${t('roomStatus')}</span><h1>${t('roomReady')}</h1></div><span class="tag tag-live">● ${t('simulated')}</span></div><div class="room-layout"><article class="room-code-panel panel"><p>${t('roomCode')}</p><strong class="big-code">${state.roomCode}</strong><span class="fake-link">${esc(invite)}</span><div class="button-row"><button class="btn btn-ghost" data-copy="${state.roomCode}">${t('copyCode')}</button><button class="btn btn-ghost" data-copy="${esc(invite)}">${t('copyLink')}</button></div><button class="btn btn-primary btn-wide" data-action="teacher-start">${t('startSession')} →</button></article><article class="participant-panel panel"><div class="participant-head"><h2>${t('participants')}</h2><span class="tag tag-demo"><b id="participant-count">${state.joinedParticipants.length}</b> / 12</span></div><div class="participant-list" id="participant-list">${state.joinedParticipants.map(personRow).join('')||`<p class="screen-subtitle">${state.lang==='ca'?'Els participants simulats apareixeran en uns segons.':'Los participantes simulados aparecerán en unos segundos.'}</p>`}</div></article></div></section>`;}
function personRow(p){return `<div class="person-row"><span class="person-avatar">${esc(p.avatar)}</span><span><b>${esc(p.name)}</b><small>${t('ready')}</small></span></div>`;}

function renderTeams(){return `<section class="screen team-choice-screen"><div class="waiting-head team-choice-head"><span class="eyebrow">${t('roomCode')} · ${state.roomCode}</span><h1>${t('teamChoose')}</h1><p class="screen-subtitle">${state.lang==='ca'?'Màxim 4 integrants per equip. En triar-ne un, entraràs directament a la sala.':'Máximo 4 integrantes por equipo. Al elegir uno, entrarás directamente en la sala.'}</p></div><div class="team-create-area"><button class="btn ${state.createTeamOpen?'btn-secondary':'btn-primary'}" data-action="toggle-create-team" aria-expanded="${state.createTeamOpen}">${state.createTeamOpen?'× '+t('cancel'): '＋ '+t('createNewTeam')}</button>${state.createTeamOpen?`<form class="create-team-form compact-create-team" data-form="create-team"><label class="field">${t('teamName')}<input name="teamName" maxlength="22" required placeholder="Pixel Crew" autofocus /></label><label class="field">Color<div class="color-picker">${['#26d7e8','#8067ff','#ff647c','#ffc83d'].map((c,i)=>`<button type="button" class="color-choice ${i===0?'selected':''}" style="--color:${c}" data-color="${c}" aria-label="Color ${i+1}"></button>`).join('')}</div><input type="hidden" name="teamColor" value="#26d7e8" /></label><label class="field">${t('emblem')}<select name="emblem"><option>◆</option><option>▲</option><option>✦</option><option>●</option></select></label><button class="btn btn-primary" type="submit">${t('createAndJoin')}</button><div id="team-error" class="error-box"></div></form>`:''}</div><div class="team-grid team-choice-grid">${state.teams.map(team=>`<article class="team-card ${team.id===state.currentTeamId?'is-current':''}" style="--team-color:${team.color}"><div class="team-emblem">${team.emblem}</div><div class="team-card-copy"><h3>${esc(team.name)}</h3><div class="member-list">${team.members.map(m=>`<span>${esc(m)}</span>`).join('')}</div><p class="team-score"><b>${team.score}</b> pts · ${team.members.length}/4</p></div><button class="btn ${team.id===state.currentTeamId?'btn-secondary':'btn-ghost'} btn-wide" data-action="join-team" data-team="${team.id}" ${team.members.length>=4&&team.id!==state.currentTeamId?'disabled':''}>${team.id===state.currentTeamId?'✓ '+t('selectedTeam'):t('joinTeam')}</button></article>`).join('')}</div><div class="team-choice-footer"><button class="btn btn-ghost" data-action="leave-room">${t('leave')}</button></div></section>`;}

function renderWaiting(){const chosen=currentTeam();return `<section class="screen"><div class="waiting-head"><span class="eyebrow">${t('simulated')}</span><h1>${t('teamJoined')}</h1><div class="joined-team-banner" style="--team-color:${chosen.color}"><div class="team-emblem">${chosen.emblem}</div><span><small>${t('youRepresent')}</small><strong>${esc(chosen.name)}</strong></span><b>✓ ${t('ready')}</b></div><p class="screen-subtitle">${t('waitingText')}</p><div class="lobby-meta"><span>${t('roomCode')}: <b>${state.roomCode}</b></span><span>${t('professor')}</span><span>${state.teams.length} equipos</span></div></div><div class="team-grid">${state.teams.map(team=>`<article class="team-card ${team.id===state.currentTeamId?'is-current':''}" style="--team-color:${team.color}"><div class="team-emblem">${team.emblem}</div><h3>${esc(team.name)}</h3><div class="member-list">${team.members.map(m=>`<span>${esc(m)}</span>`).join('')}</div><span class="tag ${team.id===state.currentTeamId?'tag-selected':'tag-live'}">${team.id===state.currentTeamId?'✓ '+t('yourTeam'):'● '+t('ready')}</span></article>`).join('')}</div><div class="button-row" style="justify-content:center"><button class="btn btn-primary" data-action="start-simulation">${t('startSimulation')} →</button><button class="btn btn-ghost" data-action="leave-room">${t('leave')}</button></div></section>`;}

function renderTeacherLive(){const a=currentActivity();return `<section class="screen"><div class="dashboard-head"><div><span class="eyebrow">${t('liveControl')}</span><h1>${t('sessionName')}</h1></div><span class="tag tag-live">● ${t('simulated')}</span></div><div class="teacher-live"><article class="live-main panel"><div class="game-progress"><span>${state.currentActivity+1}/${state.activities.length}</span><i style="--progress:${((state.currentActivity+1)/state.activities.length)*100}%"></i><b>${gameName(a.type)}</b></div><div class="live-question"><span>${gameName(a.type)} · ${a.maxPoints} PTS</span><h2>${esc(tr(a.prompt))}</h2><p class="screen-subtitle">${esc(tr(a.instructions))}</p></div><div class="button-row"><button class="btn btn-primary" data-action="play-activity">${t('viewStudent')} →</button><button class="btn btn-ghost" data-action="pause">${t('pause')}</button><button class="btn btn-danger" data-action="finish-early">${t('finishTurn')}</button></div></article><aside class="live-side panel"><h2>${t('answerStates')}</h2>${state.teams.map((team,i)=>`<div class="team-state-row"><span><b>${esc(team.name)}</b><br><small>${team.score} pts</small></span><span class="state-pill">${i===1?t('ready'):(state.lang==='ca'?'Pensant…':'Pensando…')}</span></div>`).join('')}</aside></div></section>`;}

function initializeGame(){const a=currentActivity();state.gameData={resolved:false,startedAt:Date.now(),elapsed:0,points:0,correct:false};if(a.type==='quiz')Object.assign(state.gameData,{selected:null,votes:[null,null,null],locked:false});if(a.type==='hangman')Object.assign(state.gameData,{guessed:[],errors:0});if(a.type==='wordsearch'){const ws=createWordSearch(a.words,a.size);Object.assign(state.gameData,{...ws,selection:[],found:[],foundPaths:{},earned:0});}if(a.type==='crossword'){const cw=createCrossword(a.entries);Object.assign(state.gameData,{crossword:cw,active:0,cursor:null,values:{},completed:[],earned:0});}}
function startGame(){initializeGame();setScreen('game');startTimer(currentActivity().timeLimit);scheduleSimulation();}
function renderGame(){const a=currentActivity();const content={quiz:renderQuiz,hangman:renderHangman,wordsearch:renderWordSearch,crossword:renderCrossword}[a.type]();return `<section class="screen"><div class="game-progress"><span>${state.currentActivity+1}/${state.activities.length}</span><i style="--progress:${((state.currentActivity+1)/state.activities.length)*100}%"></i><b>${gameName(a.type)}</b></div><div class="game-shell"><article class="game-main panel">${content}</article><aside class="game-sidebar"><div class="timer-card panel"><div class="timer-line"><span>${t('time')}</span><b id="timer-value">${formatTime(state.timer?.remaining??a.timeLimit)}</b></div><div class="timer-track"><i id="timer-bar" style="--timer:100%"></i></div><button class="btn btn-ghost btn-small btn-wide" data-action="pause" id="pause-btn">${state.paused?t('resume'):t('pause')}</button></div>${renderTeamStatus()}${renderMiniRanking()}</aside></div></section>`;}
function questionHeader(){const a=currentActivity();return `<div class="question-card"><span class="eyebrow">${gameName(a.type)}</span><h1>${esc(tr(a.prompt))}</h1><p>${esc(tr(a.instructions))}</p><div class="game-help"><span>?</span><p><strong>${t('objective')}:</strong> ${t(`help_${a.type}`)}</p></div></div>`;}
function renderTeamStatus(){const team=currentTeam();return `<div class="team-status panel"><div class="team-emblem" style="background:${team.color}">${team.emblem}</div><h3 style="text-align:center">${esc(team.name)}</h3><span class="score-big">${team.score}</span><p style="text-align:center;color:var(--muted);font-size:9px">${t('total')} PTS</p></div>`;}
function sortedTeams(){return [...state.teams].sort((a,b)=>b.score-a.score||b.correct-a.correct||a.totalTime-b.totalTime);}
function renderMiniRanking(){return `<div class="mini-ranking panel"><h3>${t('ranking')}</h3>${sortedTeams().map((team,i)=>`<div class="mini-ranking-row"><b>${i+1}</b><span>${esc(team.name)}</span><strong>${team.score}</strong></div>`).join('')}</div>`;}

function renderQuiz(){const a=currentActivity(),g=state.gameData;return `${questionHeader()}<div class="option-grid">${tr(a.options).map((option,i)=>{let cls=g.selected===i?'selected':'';if(g.locked){cls+=' locked';if(i===a.correct)cls+=' correct-answer';else if(i===g.selected)cls+=' wrong-answer';}return `<button class="option-card ${cls}" data-action="quiz-option" data-index="${i}"><span class="option-key">${String.fromCharCode(65+i)}</span><span>${esc(option)}</span></button>`;}).join('')}</div><div class="votes-row">${['L','A','T'].map((x,i)=>`<span class="vote-avatar ${g.votes[i]!==null?'voted':''}" id="vote-${i}" title="${g.votes[i]!==null?String.fromCharCode(65+g.votes[i]):t('teamVoting')}">${x}</span>`).join('')}<small>${t('teamVoting')}</small></div><button class="btn btn-primary btn-wide" data-action="confirm-quiz" ${g.selected===null||g.locked?'disabled':''}>${t('vote')}</button>`;}
function renderHangman(){const a=currentActivity(),g=state.gameData,answer=[...a.answer.toUpperCase()];const letters='ABCDEFGHIJKLMNÑOPQRSTUVWXYZ';return `${questionHeader()}<div class="hangman-wrap"><svg class="hangman-svg" viewBox="0 0 120 100" aria-label="Ahorcado con ${g.errors} errores">${hangmanParts(g.errors)}</svg><div><div class="word-slots">${answer.map(ch=>`<span>${ch===' '?'':(g.guessed.includes(normalize(ch))?esc(ch):'')}</span>`).join('')}</div><div class="letter-grid">${[...letters].map(letter=>{const used=g.guessed.includes(normalize(letter));const inWord=normalize(a.answer).includes(normalize(letter));return `<button class="letter ${used?(inWord?'used good':'used bad'):''}" data-action="letter" data-letter="${letter}">${letter}</button>`;}).join('')}</div><div class="suggestions"><span>Leo: “A”</span><span>Aina: “R”</span><span>${g.errors}/${a.maxErrors} errores</span></div></div></div>`;}
function wordSearchEndKeys(a,g){const keys=new Set();if(g.selection.length!==1)return keys;const start=g.selection[0],targets=a.words.map(normalize).filter(word=>!g.found.includes(word)),dirs=[[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];targets.forEach(word=>dirs.forEach(([dr,dc])=>{const end={r:start.r+dr*(word.length-1),c:start.c+dc*(word.length-1)};if(end.r<0||end.r>=g.size||end.c<0||end.c>=g.size)return;const path=cellsBetween(start,end),letters=path.map(cell=>g.grid[cell.r][cell.c]).join('');if(letters===word||[...letters].reverse().join('')===word)keys.add(`${end.r},${end.c}`);}));return keys;}
function renderWordSearch(){const a=currentActivity(),g=state.gameData;const selectionKeys=new Set(g.selection.map(c=>`${c.r},${c.c}`)),foundKeys=new Set(Object.values(g.foundPaths||{}).flatMap(path=>path.map(c=>`${c.r},${c.c}`))),endKeys=wordSearchEndKeys(a,g);const foundWords=a.words.filter(word=>g.found.includes(normalize(word)));return `${questionHeader()}<div class="ws-layout"><div class="word-grid" style="--size:${g.size}" aria-label="${t('wordGrid')}">${g.grid.map((row,r)=>row.map((letter,c)=>{const key=`${r},${c}`;return `<button type="button" draggable="false" class="ws-cell ${foundKeys.has(key)?'found':''} ${selectionKeys.has(key)?'preview':''} ${g.selection.length===1&&selectionKeys.has(key)?'start':''} ${endKeys.has(key)?'candidate-end':''}" data-action="ws-cell" data-row="${r}" data-col="${c}" aria-label="${letter}, fila ${r+1}, columna ${c+1}">${letter}</button>`;}).join('')).join('')}</div><aside class="found-results"><p class="screen-subtitle ws-instruction">${g.selection.length?t('chooseLastLetter'):t('selectWord')}</p><h3>${t('foundWords')}</h3>${foundWords.length?`<div class="word-list">${foundWords.map(word=>`<span class="done">${esc(word)} <b>✓</b></span>`).join('')}</div>`:`<p class="found-empty">${t('noneFound')}</p>`}<p class="found-progress"><b>${g.found.length}</b>/${a.words.length} ${t('found')}</p></aside></div>`;}
function renderCrossword(){const g=state.gameData,cw=g.crossword;if(cw.error)return `<div class="error-box show">${t('crosswordFail')}</div>`;const {minR,maxR,minC,maxC}=cw.bounds;let cells='';for(let r=minR;r<=maxR;r++)for(let c=minC;c<=maxC;c++){const key=`${r},${c}`,letter=cw.occupied.get(key);if(!letter){cells+='<div class="cw-cell block"></div>';continue;}const number=cw.numberMap.get(key);const active=cw.placed[g.active]?.cells.some(cell=>cell.r===r&&cell.c===c);const correct=cw.placed.some((entry,idx)=>g.completed.includes(idx)&&entry.cells.some(cell=>cell.r===r&&cell.c===c));cells+=`<label class="cw-cell ${active?'active':''} ${correct?'correct':''}">${number?`<span class="cw-number">${number}</span>`:''}<input maxlength="1" value="${esc(g.values[key]||'')}" data-cw-row="${r}" data-cw-col="${c}" aria-label="Casilla ${number||''}" /></label>`;}return `${questionHeader()}<div class="crossword-layout"><div><div class="crossword-grid" style="--cols:${maxC-minC+1}">${cells}</div><div class="virtual-keyboard">${[...'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ'].map(l=>`<button data-action="cw-key" data-letter="${l}">${l}</button>`).join('')}</div></div><div class="clue-groups"><h3>${t('across')}</h3>${cw.placed.filter(x=>x.dir==='across').map(x=>clueButton(x,cw.placed.indexOf(x),g.active,g.completed)).join('')}<h3>${t('down')}</h3>${cw.placed.filter(x=>x.dir==='down').map(x=>clueButton(x,cw.placed.indexOf(x),g.active,g.completed)).join('')}<p class="screen-subtitle crossword-progress">${g.completed.length}/${cw.placed.length} ${t('found')}</p></div></div>`;}
function clueButton(entry,index,active,completed){const done=completed.includes(index);return `<button class="clue ${index===active?'active':''} ${done?'completed':''}" data-action="cw-clue" data-index="${index}"><b>${done?'✓':`${entry.number}.`}</b> ${esc(tr(entry.clue))}</button>`;}

function afterGameRender(){updateTimerDom();if(currentActivity()?.type==='crossword')bindCrosswordInputs();if(currentActivity()?.type==='wordsearch')bindWordSearchInputs();}
function crosswordEntryForCell(r,c){const g=state.gameData,active=g.crossword.placed[g.active];if(active?.cells.some(cell=>cell.r===r&&cell.c===c))return {entry:active,index:g.active};const index=g.crossword.placed.findIndex(entry=>entry.cells.some(cell=>cell.r===r&&cell.c===c));return {entry:g.crossword.placed[index],index};}
function focusCrosswordCell(key){if(!key)return;const applyFocus=()=>{const [r,c]=key.split(',');const input=document.querySelector(`[data-cw-row="${r}"][data-cw-col="${c}"]`);if(input){input.focus();input.select();}};applyFocus();requestAnimationFrame(applyFocus);setTimeout(applyFocus,0);}
function bindCrosswordInputs(){
  const g=state.gameData;
  const moveFocus=(cell)=>{
    if(!cell)return;
    const key=`${cell.r},${cell.c}`;
    g.cursor=key;
    const nextInput=document.querySelector(`[data-cw-row="${cell.r}"][data-cw-col="${cell.c}"]`);
    if(nextInput){nextInput.focus();nextInput.select();}
  };
  document.querySelectorAll('[data-cw-row]').forEach(input=>{
    input.addEventListener('focus',(event)=>{
      const target=event.currentTarget,r=+target.dataset.cwRow,c=+target.dataset.cwCol,{index}=crosswordEntryForCell(r,c);
      if(index>=0)g.active=index;
      g.cursor=`${r},${c}`;
    });
    input.addEventListener('keydown',(event)=>{
      const target=event.currentTarget,r=+target.dataset.cwRow,c=+target.dataset.cwCol,key=`${r},${c}`;
      const {entry,index}=crosswordEntryForCell(r,c);
      if(index>=0)g.active=index;
      if(event.key==='Backspace'){
        if(target.value){event.preventDefault();target.value='';g.values[key]='';return;}
        if(!entry)return;
        const position=entry.cells.findIndex(cell=>cell.r===r&&cell.c===c),previous=entry.cells[position-1];
        if(previous){event.preventDefault();const previousKey=`${previous.r},${previous.c}`;g.values[previousKey]='';const previousInput=document.querySelector(`[data-cw-row="${previous.r}"][data-cw-col="${previous.c}"]`);if(previousInput)previousInput.value='';moveFocus(previous);}
        return;
      }
      const letter=normalize(event.key);
      if(letter.length!==1||!entry)return;
      event.preventDefault();
      target.value=letter;
      g.values[key]=letter;
      const position=entry.cells.findIndex(cell=>cell.r===r&&cell.c===c),next=entry.cells[position+1];
      if(autoCompleteCrosswordEntry(index))return;
      if(next)moveFocus(next);
    });
    input.addEventListener('input',(event)=>{
      const target=event.currentTarget,r=+target.dataset.cwRow,c=+target.dataset.cwCol,key=`${r},${c}`,value=normalize(target.value).slice(-1);
      g.values[key]=value;
      target.value=value;
      const {entry,index}=crosswordEntryForCell(r,c);
      if(index>=0)g.active=index;
      if(value&&entry){const position=entry.cells.findIndex(cell=>cell.r===r&&cell.c===c),next=entry.cells[position+1];if(autoCompleteCrosswordEntry(index))return;if(next)moveFocus(next);}
    });
  });
  focusCrosswordCell(g.cursor);
}

function bindWordSearchInputs(){
  const grid=document.querySelector('.word-grid');
  const g=state.gameData;
  if(!grid||!g)return;
  const cellAt=(event)=>{
    const direct=event.target.closest?.('.ws-cell');
    if(direct)return direct;
    return document.elementFromPoint(event.clientX,event.clientY)?.closest?.('.ws-cell')||null;
  };
  const coords=(cell)=>cell?{r:+cell.dataset.row,c:+cell.dataset.col}:null;
  const paint=(path)=>{
    grid.querySelectorAll('.ws-cell').forEach(cell=>cell.classList.remove('preview','start'));
    path.forEach((cell,index)=>{
      const el=grid.querySelector(`[data-row="${cell.r}"][data-col="${cell.c}"]`);
      if(el){el.classList.add('preview');if(index===0)el.classList.add('start');}
    });
  };
  grid.addEventListener('pointerdown',(event)=>{
    if(event.pointerType==='mouse'&&event.button!==0)return;
    const start=coords(cellAt(event));
    if(!start)return;
    event.preventDefault();
    g.dragging=true;
    g.dragStart=start;
    g.selectionBeforeDrag=[...g.selection];
    g.dragMoved=false;
    g.selection=[start];
    grid.setPointerCapture?.(event.pointerId);
    paint(g.selection);
  });
  grid.addEventListener('pointermove',(event)=>{
    if(!g.dragging)return;
    event.preventDefault();
    const cell=document.elementFromPoint(event.clientX,event.clientY)?.closest?.('.ws-cell');
    const end=coords(cell);
    if(!end)return;
    const path=cellsBetween(g.dragStart,end);
    if(path.length){g.selection=path;g.dragMoved=path.length>1;paint(path);}
  });
  const finishDrag=(event)=>{
    if(!g.dragging)return;
    event.preventDefault();
    const cell=document.elementFromPoint(event.clientX,event.clientY)?.closest?.('.ws-cell');
    const end=coords(cell)||g.selection.at(-1)||g.dragStart;
    const start=g.dragStart;
    const moved=g.dragMoved;
    g.dragging=false;
    g.dragStart=null;
    g.dragMoved=false;
    try{grid.releasePointerCapture?.(event.pointerId);}catch{}
    if(!moved||sameCell(start,end)){
      const previous=g.selectionBeforeDrag||[];
      g.selectionBeforeDrag=null;
      g.suppressClickUntil=performance.now()+400;
      if(previous.length===1){if(sameCell(previous[0],start)){g.selection=[];render();}else completeWordSelection(previous[0],start);}
      else{g.selection=[start];showToast(t('chooseLastLetter'));render();}
      return;
    }
    g.selectionBeforeDrag=null;
    g.suppressClickUntil=performance.now()+400;
    completeWordSelection(start,end);
  };
  grid.addEventListener('pointerup',finishDrag);
  grid.addEventListener('pointercancel',(event)=>{
    if(!g.dragging)return;
    g.dragging=false;
    g.dragStart=null;
    g.dragMoved=false;
    g.selection=g.selectionBeforeDrag||[];
    g.selectionBeforeDrag=null;
    try{grid.releasePointerCapture?.(event.pointerId);}catch{}
    render();
  });
}

function startTimer(seconds){stopTimer();state.paused=false;state.timer={duration:seconds,remaining:seconds,endAt:Date.now()+seconds*1000,interval:null};state.timer.interval=setInterval(timerTick,250);updateTimerDom();}
function timerTick(){if(!state.timer||state.paused)return;state.timer.remaining=Math.max(0,(state.timer.endAt-Date.now())/1000);updateTimerDom();if(state.timer.remaining<=0){stopTimer(false);handleTimeUp();}}
function updateTimerDom(){if(!state.timer)return;const value=document.querySelector('#timer-value'),bar=document.querySelector('#timer-bar');if(value)value.textContent=formatTime(state.timer.remaining);if(bar)bar.style.setProperty('--timer',`${Math.max(0,state.timer.remaining/state.timer.duration*100)}%`);}
function formatTime(seconds){const s=Math.max(0,Math.ceil(seconds));return `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;}
function stopTimer(clear=true){if(state.timer?.interval)clearInterval(state.timer.interval);if(clear)state.timer=null;}
function togglePause(){if(!state.timer)return;if(state.paused){state.timer.endAt=Date.now()+state.timer.remaining*1000;state.timer.interval=setInterval(timerTick,250);state.paused=false;}else{if(state.timer.interval)clearInterval(state.timer.interval);state.timer.remaining=Math.max(0,(state.timer.endAt-Date.now())/1000);state.paused=true;}render();}
function clearSimTimers(){state.simTimers.forEach(clearTimeout);state.simTimers=[];}
function scheduleSimulation(){if(currentActivity().type!=='quiz')return;[0,1,2].forEach((_,i)=>{const id=setTimeout(()=>{if(state.screen!=='game'||state.gameData.locked)return;state.gameData.votes[i]=[0,2,1][i];const el=document.querySelector(`#vote-${i}`);if(el)el.classList.add('voted');},900+i*750);state.simTimers.push(id);});}

function elapsedSeconds(){return state.timer?Math.max(0,state.timer.duration-state.timer.remaining):currentActivity().timeLimit;}
function finishRound(correct,points=null){if(state.gameData.resolved)return;const a=currentActivity();state.gameData.resolved=true;state.gameData.elapsed=elapsedSeconds();state.gameData.correct=correct;state.gameData.points=points===null?calculatePoints(a.maxPoints,state.gameData.elapsed,a.timeLimit,correct):Math.max(0,Math.round(points));stopTimer(false);clearSimTimers();applyRoundScores();state.roundResult={correct,points:state.gameData.points,elapsed:state.gameData.elapsed};setScreen('result');}
function applyRoundScores(){const my=currentTeam(),index=state.currentActivity;const orderBefore=sortedTeams().map(t=>t.id);state.teams.forEach(team=>team.previousRank=orderBefore.indexOf(team.id)+1);my.turnScore=state.gameData.points;my.score+=state.gameData.points;if(state.gameData.correct)my.correct+=1;my.totalTime+=Math.round(state.gameData.elapsed);const sims=[[720,810],[640,560],[780,690],[700,760]][index]||[600,650];let si=0;state.teams.filter(t=>t.id!==my.id).forEach(team=>{const pts=sims[si%sims.length];team.turnScore=pts;team.score+=pts;if(pts>0)team.correct+=1;team.totalTime+=Math.round(currentActivity().timeLimit*(.35+si*.12));si++;});}
function handleTimeUp(){if(state.screen!=='game'||state.gameData.resolved)return;if(currentActivity().type==='wordsearch'||currentActivity().type==='crossword')finishRound(false,state.gameData.earned);else finishRound(false,0);}

function correctAnswerText(){const a=currentActivity();if(a.type==='quiz')return tr(a.options)[a.correct];if(a.type==='hangman')return a.answer;if(a.type==='wordsearch')return a.words.join(' · ');if(a.type==='crossword')return a.entries.map(entry=>entry.answer).join(' · ');return '';}
function renderResult(){const rr=state.roundResult,ranked=sortedTeams();return `<section class="screen"><div class="result-hero"><div class="result-icon ${rr.correct?'good':'bad'}">${rr.correct?'✓':'×'}</div><span class="eyebrow">${t('turn')} ${state.currentActivity+1}/${state.activities.length}</span><h1>${rr.correct?t('correct'):t('incorrect')}</h1><p class="screen-subtitle" style="margin-inline:auto">${rr.correct?`${t('pointsWon')}`:(state.lang==='ca'?'El marcador continua. Encara queda partida.':'El marcador continúa. Todavía queda partida.')}</p>${rr.correct?'':`<div class="correct-reveal"><span>${t('correctAnswer')}</span><strong>${esc(correctAnswerText())}</strong></div>`}<div class="points-result">+${rr.points}</div></div><div class="ranking-table"><div class="rank-row head"><span>${t('position')}</span><span>Equipo</span><span>${t('turn')}</span><span>${t('total')}</span><span>↕</span></div>${ranked.map((team,i)=>{const move=team.previousRank-(i+1);return `<div class="rank-row ${team.id===state.currentTeamId?'you':''}"><b>${i+1}</b><span class="rank-team"><i class="rank-mark" style="--team-color:${team.color}"></i>${esc(team.name)}</span><span>+${team.turnScore}</span><strong>${team.score}</strong><em class="movement ${move>0?'up':move<0?'down':''}">${move>0?'↑':move<0?'↓':'—'}</em></div>`;}).join('')}</div><div class="button-row" style="justify-content:center"><button class="btn btn-primary" data-action="next-round">${state.currentActivity===state.activities.length-1?t('sessionComplete'):t('next')} →</button></div></section>`;}

function renderPodium(){const ranked=sortedTeams().slice(0,3),heights=['260px','205px','165px'];return `<section class="screen podium-screen"><span class="eyebrow">${t('demoResults')}</span><h1>${t('sessionComplete')}</h1><p class="screen-subtitle" style="margin-inline:auto">${t('winner')}: <b style="color:${ranked[0]?.color}">${esc(ranked[0]?.name||'')}</b></p><div class="podium">${ranked.map((team,i)=>`<article class="podium-place ${i===0?'first':i===1?'second':'third'}" style="--team-color:${team.color};--height:${heights[i]}"><div class="team-emblem">${team.emblem}</div><h3>${esc(team.name)}</h3><span>${team.score} pts</span><div class="podium-block">${i+1}</div></article>`).join('')}</div><div class="session-summary"><span>${state.activities.length} ${t('activities').toLowerCase()}</span><span>${ranked.reduce((n,x)=>n+x.correct,0)} aciertos</span><span>${t('simulated')}</span></div><div class="button-row" style="justify-content:center"><button class="btn btn-secondary" data-action="review-results">${t('review')}</button>${state.role==='teacher'?`<button class="btn btn-ghost" data-action="dashboard">${t('dashboard')}</button>`:''}<button class="btn btn-primary" data-action="new-game">${t('newGame')}</button><button class="btn btn-ghost" data-action="home">${t('goHome')}</button></div><div class="confetti" aria-hidden="true">${Array.from({length:28},(_,i)=>`<i style="left:${(i*37)%100}%;--color:${['#bdf34a','#26d7e8','#8067ff','#ff647c','#ffc83d'][i%5]};--duration:${2.8+(i%5)*.35}s;--rotate:${i*21}deg;--drift:${(i%2?1:-1)*(20+i%7)*1.5}px"></i>`).join('')}</div></section>`;}

function resetSessionScores(){state.teams=clone(demoTeams);state.currentActivity=0;state.roundResult=null;state.sessionStarted=false;state.gameData=null;state.createTeamOpen=false;state.currentTeamId=state.role==='student'?null:'up';}
function showSocial(provider){showModal(t('socialDemo'),`<div id="social-flow"><div class="spinner"></div><p style="text-align:center">${esc(provider)} · ${state.lang==='ca'?'Comprovant accés…':'Comprobando acceso…'}</p></div>`,``);setTimeout(()=>{const flow=document.querySelector('#social-flow');if(flow)flow.innerHTML=`<p>${t('socialText')}</p><span class="tag tag-demo">${t('demo')}</span><div class="button-row"><button class="btn btn-primary" data-action="close-modal">${t('close')}</button></div>`;},850);}
async function copyValue(value){try{await navigator.clipboard.writeText(value);showToast(t('copied'));}catch{showToast(value);}}

function readEditorActivity(){const form=document.querySelector('#editor-form'),fd=new FormData(form),type=state.editorType,existing=state.editIndex!==null?state.activities[state.editIndex]:null;const base={id:existing?.id||`custom-${Date.now()}`,type,title:String(fd.get('title')||'').trim(),prompt:String(fd.get('prompt')||'').trim(),instructions:String(fd.get('instructions')||'').trim(),timeLimit:+fd.get('time'),maxPoints:+fd.get('points')};if(!base.title||!base.prompt||!base.timeLimit||!base.maxPoints)return {error:t('required')};if(type==='quiz'){base.options=[0,1,2,3].map(i=>String(fd.get(`option${i}`)||'').trim()).filter(Boolean);base.correct=+fd.get('correct');if(base.options.length<2||base.correct<0||base.correct>=base.options.length)return {error:t('atLeastOptions')};}if(type==='hangman'){base.answer=String(fd.get('answer')||'').trim().toUpperCase();base.maxErrors=+fd.get('maxErrors')||6;if(!base.answer)return {error:t('required')};}if(type==='wordsearch'){base.words=String(fd.get('words')||'').split(',').map(x=>x.trim()).filter(Boolean);base.size=+fd.get('size');const ws=createWordSearch(base.words,base.size);if(ws.error)return {error:t('wordsTooLong')};}if(type==='crossword'){base.entries=String(fd.get('entries')||'').split('\n').map(line=>{const [answer,...clue]=line.split('|');return {answer:(answer||'').trim(),clue:clue.join('|').trim()};}).filter(x=>x.answer&&x.clue);if(base.entries.length<2||createCrossword(base.entries).error)return {error:t('crosswordFail')};}return {activity:base};}
function previewActivity(activity){const box=document.querySelector('#exercise-preview');let view=`<h3>${esc(activity.title)}</h3><p>${esc(activity.prompt)}</p>`;if(activity.type==='quiz')view+=`<div class="option-grid">${activity.options.map((o,i)=>`<div class="option-card ${i===activity.correct?'correct-answer':''}"><b>${String.fromCharCode(65+i)}</b><span>${esc(o)}</span></div>`).join('')}</div>`;if(activity.type==='hangman')view+=`<div class="word-slots">${[...activity.answer].map(()=>'<span></span>').join('')}</div>`;if(activity.type==='wordsearch'){const ws=createWordSearch(activity.words,activity.size);view+=`<div class="word-grid" style="--size:${ws.size};max-width:360px">${ws.grid.flatMap((row,r)=>row.map((l,c)=>`<span class="ws-cell">${l}</span>`)).join('')}</div>`;}if(activity.type==='crossword')view+=`<p>${activity.entries.map(x=>`${esc(x.answer)} · ${esc(x.clue)}`).join('<br>')}</p>`;box.innerHTML=view;}

document.addEventListener('click',(event)=>{const target=event.target.closest('button,a[data-action]');if(!target)return;const action=target.dataset.action;
  if(target.dataset.social){showSocial(target.dataset.social);return;}if(target.dataset.copy){copyValue(target.dataset.copy);return;}
  if(action==='close-modal')closeModal();
  if(action==='role-teacher')setScreen('teacherLogin');if(action==='role-student')setScreen('studentLogin');
  if(action==='back'){const back={teacherLogin:'home',studentLogin:'home',editor:'dashboard',room:'dashboard'}[state.screen]||'home';setScreen(back);}
  if(action==='logout'||action==='home'){resetSessionScores();state.role=null;state.userName='';setScreen('home');}
  if(action==='load-demo'){state.activities=clone(demoActivities);state.editIndex=null;showToast(t('loadDemo'));render();}
  if(action==='new-session'){state.activities=[];state.editorType='quiz';state.editIndex=null;setScreen('editor');}
  if(action==='open-editor'||action==='add-activity'){state.editIndex=null;state.editorType='quiz';setScreen('editor');}
  if(action==='edit-activity'){const index=+target.dataset.index;if(!state.activities[index])return;state.editIndex=index;state.editorType=state.activities[index].type;setScreen('editor');}
  if(action==='select-game'){state.editorType=target.dataset.type;render();}
  if(action==='preview-exercise'||action==='save-exercise'){const result=readEditorActivity(),error=document.querySelector('#editor-error');if(result.error){error.textContent=result.error;error.classList.add('show');return;}error.classList.remove('show');if(action==='preview-exercise'){previewActivity(result.activity);}else{const editing=state.editIndex!==null;if(editing)state.activities[state.editIndex]=result.activity;else{state.activities.push(result.activity);state.editIndex=state.activities.length-1;}showToast(editing?t('changesSaved'):t('exerciseAdded'));render();}}
  if(action==='delete-activity'){const index=+target.dataset.index,activity=state.activities[index];if(!activity)return;showModal(t('deleteExercise'),`<p>${t('deleteConfirm')} <b>${esc(tr(activity.title))}</b>?</p>`,`<button class="btn btn-danger" data-action="confirm-delete-activity" data-index="${index}">${t('yesDelete')}</button><button class="btn btn-ghost" data-action="close-modal">${t('cancel')}</button>`);}
  if(action==='confirm-delete-activity'){const index=+target.dataset.index;if(state.activities[index])state.activities.splice(index,1);state.editIndex=null;closeModal();showToast(t('exerciseDeleted'));render();}
  if(action==='move-activity-up'||action==='move-activity-down'){const index=+target.dataset.index,next=action==='move-activity-up'?index-1:index+1;if(index<0||next<0||index>=state.activities.length||next>=state.activities.length)return;[state.activities[index],state.activities[next]]=[state.activities[next],state.activities[index]];render();}
  if(action==='create-room'){if(!state.activities.length){showToast(state.lang==='ca'?'Afegeix almenys una activitat.':'Añade al menos una actividad.');return;}state.roomCreated=true;state.joinedParticipants=[];setScreen('room');startParticipantSimulation();}
  if(action==='teacher-start'){state.sessionStarted=true;state.currentActivity=0;setScreen('teacherLive');}
  if(action==='play-activity')startGame();
  if(action==='toggle-create-team'){state.createTeamOpen=!state.createTeamOpen;render();}
  if(action==='join-team'){const team=state.teams.find(x=>x.id===target.dataset.team);if(!team)return;if(team.members.length>=4&&!team.members.includes(state.userName)){showToast(t('teamFull'));return;}state.teams.forEach(x=>x.members=x.members.filter(m=>m!==state.userName));if(!team.members.includes(state.userName))team.members.push(state.userName);state.currentTeamId=team.id;showToast(`${t('selectedTeam')}: ${team.name}`);setScreen('waiting');}
  if(action==='go-waiting')setScreen('waiting');if(action==='leave-room')setScreen('home');if(action==='start-simulation'){state.currentActivity=0;startGame();}
  if(action==='quiz-option'&&!state.gameData.locked){state.gameData.selected=+target.dataset.index;render();}
  if(action==='confirm-quiz'){const a=currentActivity(),g=state.gameData;if(g.selected===null)return;g.locked=true;const votes=[...g.votes.filter(v=>v!==null),g.selected],counts=votes.reduce((m,v)=>(m[v]=(m[v]||0)+1,m),{}),max=Math.max(...Object.values(counts)),winners=Object.keys(counts).filter(k=>counts[k]===max).map(Number);if(winners.length>1){showModal(t('captainTie'),`<div class="option-grid">${winners.map(i=>`<button class="option-card" data-action="captain-choice" data-index="${i}"><b>${String.fromCharCode(65+i)}</b><span>${esc(tr(a.options)[i])}</span></button>`).join('')}</div>`,``);}else resolveQuiz(winners[0]);}
  if(action==='captain-choice'){closeModal();resolveQuiz(+target.dataset.index);}
  if(action==='letter'){selectLetter(target.dataset.letter);}
  if(action==='ws-cell'){if((state.gameData.suppressClickUntil||0)>performance.now())return;selectWordCell(+target.dataset.row,+target.dataset.col);}
  if(action==='cw-clue'){state.gameData.active=+target.dataset.index;const entry=state.gameData.crossword.placed[state.gameData.active];const cell=entry.cells.find(item=>!state.gameData.values[`${item.r},${item.c}`])||entry.cells[0];state.gameData.cursor=`${cell.r},${cell.c}`;render();}
  if(action==='cw-key'){enterCrosswordLetter(target.dataset.letter);}
  if(action==='pause')togglePause();
  if(action==='finish-early'){showModal(t('finishTurn'),`<p>${state.lang==='ca'?'Vols finalitzar l’activitat abans que s’acabi el temps?':'¿Quieres finalizar la actividad antes de que termine el tiempo?'}</p>`,`<button class="btn btn-danger" data-action="confirm-finish">${t('finishTurn')}</button><button class="btn btn-ghost" data-action="close-modal">${t('back')}</button>`);}
  if(action==='confirm-finish'){closeModal();handleTimeUp();}
  if(action==='next-round'){if(state.currentActivity>=state.activities.length-1){setScreen('podium');}else{state.currentActivity++;if(state.role==='teacher')setScreen('teacherLive');else startGame();}}
  if(action==='review-results')setScreen('result');if(action==='dashboard')setScreen('dashboard');if(action==='new-game'){resetSessionScores();state.role==='teacher'?setScreen('dashboard'):setScreen('teams');}
});

document.addEventListener('submit',(event)=>{event.preventDefault();const form=event.target,kind=form.dataset.form,fd=new FormData(form);if(kind==='teacher-login'){const name=String(fd.get('name')||'').trim();if(!name)return loginError(t('required'));state.role='teacher';state.userName=name;setScreen('dashboard');}if(kind==='student-login'){const name=String(fd.get('name')||'').trim(),code=String(fd.get('code')||'').trim().toUpperCase(),guest=fd.get('guest');if(!name||!guest)return loginError(t('required'));if(code!==DEMO_CODE)return loginError(t('invalidCode'));state.role='student';state.userName=name;state.roomCode=code;state.currentTeamId=null;state.createTeamOpen=false;setScreen('teams');}if(kind==='create-team'){const name=String(fd.get('teamName')||'').trim(),color=String(fd.get('teamColor')||'#26d7e8'),emblem=String(fd.get('emblem')||'◆');const error=document.querySelector('#team-error');if(!name){error.textContent=t('required');error.classList.add('show');return;}if(state.teams.some(x=>x.name.toLowerCase()===name.toLowerCase())){error.textContent=t('duplicateTeam');error.classList.add('show');return;}const id=`team-${Date.now()}`;state.teams.forEach(x=>x.members=x.members.filter(m=>m!==state.userName));state.teams.push({id,name,color,emblem,members:[state.userName],score:0,turnScore:0,correct:0,totalTime:0,previousRank:state.teams.length+1});state.currentTeamId=id;state.createTeamOpen=false;showToast(`${t('selectedTeam')}: ${name}`);setScreen('waiting');}});
document.addEventListener('click',(event)=>{const color=event.target.closest('[data-color]');if(!color)return;document.querySelectorAll('[data-color]').forEach(x=>x.classList.remove('selected'));color.classList.add('selected');document.querySelector('input[name="teamColor"]').value=color.dataset.color;});
languageSelect.addEventListener('change',()=>{state.lang=languageSelect.value;localStorage.setItem('showup_lang',state.lang);render();});
homeAction.addEventListener('click',()=>{resetSessionScores();setScreen('home');});

function loginError(message){const box=document.querySelector('#login-error');box.textContent=message;box.classList.add('show');}
function startParticipantSimulation(){socialParticipants.forEach(person=>{const id=setTimeout(()=>{if(state.screen!=='room')return;state.joinedParticipants.push(person);const list=document.querySelector('#participant-list'),count=document.querySelector('#participant-count');if(list){if(state.joinedParticipants.length===1)list.innerHTML='';list.insertAdjacentHTML('beforeend',personRow(person));}if(count)count.textContent=state.joinedParticipants.length;},person.delay);state.simTimers.push(id);});}
function resolveQuiz(choice){const correct=choice===currentActivity().correct;finishRound(correct);}
function selectLetter(letter){const a=currentActivity(),g=state.gameData,key=normalize(letter);if(g.guessed.includes(key))return;g.guessed.push(key);if(!normalize(a.answer).includes(key))g.errors++;const solved=[...normalize(a.answer)].every(ch=>g.guessed.includes(ch));if(solved){const base=calculatePoints(a.maxPoints,elapsedSeconds(),a.timeLimit,true),bonus=Math.round((a.maxErrors-g.errors)/a.maxErrors*100);finishRound(true,Math.min(a.maxPoints,base+bonus));return;}if(g.errors>=a.maxErrors){finishRound(false,0);return;}render();}
function selectWordCell(r,c){const g=state.gameData,clicked={r,c};if(!g.selection.length||g.selection.length>1){g.selection=[clicked];showToast(t('chooseLastLetter'));render();return;}const start=g.selection[0];if(sameCell(start,clicked)){g.selection=[];render();return;}completeWordSelection(start,clicked);}
function completeWordSelection(start,end){const a=currentActivity(),g=state.gameData,path=cellsBetween(start,end);const selected=path.map(cell=>g.grid[cell.r]?.[cell.c]||'').join(''),reversed=[...selected].reverse().join('');const match=a.words.map(normalize).find(word=>!g.found.includes(word)&&(word===selected||word===reversed));if(match){g.found.push(match);g.foundPaths[match]=path;const portion=a.maxPoints/a.words.length,won=calculatePoints(portion,elapsedSeconds(),a.timeLimit,true);g.earned+=won;showToast(`+${Math.round(won)} · ${match}`);}else showToast(t('invalidWordSelection'));g.selection=[];if(g.found.length===a.words.length){finishRound(true,g.earned);return;}render();}
function sameCell(a,b){return a.r===b.r&&a.c===b.c;}
function enterCrosswordLetter(letter){const g=state.gameData,entry=g.crossword.placed[g.active];if(!entry)return;let target=g.cursor?entry.cells.find(cell=>`${cell.r},${cell.c}`===g.cursor):null;if(!target)target=entry.cells.find(cell=>!g.values[`${cell.r},${cell.c}`])||entry.cells[0];const position=entry.cells.indexOf(target);g.values[`${target.r},${target.c}`]=letter;if(autoCompleteCrosswordEntry(g.active))return;const next=entry.cells[position+1];g.cursor=next?`${next.r},${next.c}`:`${target.r},${target.c}`;render();}
function autoCompleteCrosswordEntry(index){const a=currentActivity(),g=state.gameData,cw=g.crossword,entry=cw.placed[index];if(!entry||g.completed.includes(index))return false;const answer=entry.cells.map(cell=>g.values[`${cell.r},${cell.c}`]||'').join('');if(answer.length!==entry.answer.length||normalize(answer)!==entry.answer)return false;g.completed.push(index);const portion=a.maxPoints/cw.placed.length,won=calculatePoints(portion,elapsedSeconds(),a.timeLimit,true);g.earned+=won;showToast(`✓ ${entry.answer} · +${Math.round(won)} pts`);if(g.completed.length===cw.placed.length){finishRound(true,g.earned);return true;}let nextIndex=-1;for(let step=1;step<=cw.placed.length;step++){const candidate=(index+step)%cw.placed.length;if(!g.completed.includes(candidate)){nextIndex=candidate;break;}}if(nextIndex>=0){g.active=nextIndex;const nextEntry=cw.placed[nextIndex],cell=nextEntry.cells.find(item=>!g.values[`${item.r},${item.c}`])||nextEntry.cells[0];g.cursor=`${cell.r},${cell.c}`;}render();return true;}

updateStaticLanguage();render();
