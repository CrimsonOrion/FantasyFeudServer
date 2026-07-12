(function () {
    var state = {
        Question: '',
        Team1Name: 'Team 1',
        Team2Name: 'Team 2',
        Team1Score: 0,
        Team2Score: 0,
        Team1Members: [],
        Team2Members: [],
        Strikes: 0,
        Responses: 0,
        Answers: []
    };

    var activeQuestionEl = null;

    function $(sel, root) {
        return (root || document).querySelector(sel);
    }

    function $$(sel, root) {
        return Array.prototype.slice.call((root || document).querySelectorAll(sel));
    }

    function parseMembers(text) {
        return text.split(',')
            .map(function (n) { return n.trim(); })
            .filter(function (n) { return n.length > 0; })
            .map(function (name) { return { Name: name, Active: 0 }; });
    }

    async function pushState() {
        var body = Object.assign({ IsValid: true }, state);
        await fetch('/question', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        renderState();
    }

    function renderState() {
        $('#team1Score').value = state.Team1Score;
        $('#team2Score').value = state.Team2Score;
        $('#strikeCount').textContent = state.Strikes;
    }

    function currentPot() {
        return state.Answers.reduce(function (sum, a) {
            return sum + (a.Visible ? a.Value : 0);
        }, 0);
    }

    function renderMemberSelect(team) {
        var listEl = $('#team' + team + 'MemberSelect');
        var members = state['Team' + team + 'Members'];
        listEl.innerHTML = '';
        members.forEach(function (member) {
            var li = document.createElement('li');
            li.textContent = member.Name;
            li.className = member.Active === 1 ? 'active' : '';
            li.addEventListener('click', function () {
                var wasActive = member.Active === 1;
                members.forEach(function (m) { m.Active = 0; });
                member.Active = wasActive ? 0 : 1;
                renderMemberSelect(team);
                pushState();
            });
            listEl.appendChild(li);
        });
    }

    function setActiveQuestion(el) {
        if (activeQuestionEl && activeQuestionEl !== el) {
            activeQuestionEl.classList.remove('active');
            $$('.reveal-toggle', activeQuestionEl).forEach(function (btn) {
                btn.disabled = true;
                btn.textContent = 'Reveal';
            });
        }
        activeQuestionEl = el;
        el.classList.add('active');
        $$('.reveal-toggle', el).forEach(function (btn) { btn.disabled = false; });
    }

    function clearActiveQuestion() {
        if (activeQuestionEl) {
            activeQuestionEl.classList.remove('active');
            $$('.reveal-toggle', activeQuestionEl).forEach(function (btn) {
                btn.disabled = true;
                btn.textContent = 'Reveal';
            });
            activeQuestionEl = null;
        }
    }

    function wireTeamControls() {
        $('#team1Name').addEventListener('change', function (e) {
            state.Team1Name = e.target.value;
            pushState();
        });
        $('#team2Name').addEventListener('change', function (e) {
            state.Team2Name = e.target.value;
            pushState();
        });
        $('#team1Members').addEventListener('change', function (e) {
            state.Team1Members = parseMembers(e.target.value);
            renderMemberSelect('1');
            pushState();
        });
        $('#team2Members').addEventListener('change', function (e) {
            state.Team2Members = parseMembers(e.target.value);
            renderMemberSelect('2');
            pushState();
        });

        $$('.score-btn').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var team = btn.dataset.team;
                var delta = parseInt(btn.dataset.delta, 10);
                var key = 'Team' + team + 'Score';
                state[key] = Math.max(0, state[key] + delta);
                pushState();
            });
        });

        $('#team1Score').addEventListener('change', function (e) {
            state.Team1Score = Math.max(0, parseInt(e.target.value, 10) || 0);
            pushState();
        });
        $('#team2Score').addEventListener('change', function (e) {
            state.Team2Score = Math.max(0, parseInt(e.target.value, 10) || 0);
            pushState();
        });

        $$('.score-reset').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var team = btn.dataset.team;
                state['Team' + team + 'Score'] = 0;
                pushState();
            });
        });

        $('#awardPot1').addEventListener('click', function () {
            state.Team1Score += currentPot();
            pushState();
        });
        $('#awardPot2').addEventListener('click', function () {
            state.Team2Score += currentPot();
            pushState();
        });
    }

    function resetBoardFields() {
        state.Question = '';
        state.Strikes = 0;
        state.Responses = 0;
        state.Answers = [];
        clearActiveQuestion();
    }

    function wireRoundControls() {
        $('#addStrike').addEventListener('click', function () {
            state.Strikes = Math.min(4, state.Strikes + 1);
            pushState();
        });
        $('#resetStrikes').addEventListener('click', function () {
            state.Strikes = 0;
            pushState();
        });
        $('#resetBoard').addEventListener('click', function () {
            resetBoardFields();
            pushState();
        });
        $('#resetGame').addEventListener('click', function () {
            resetBoardFields();
            state.Team1Name = 'Team 1';
            state.Team2Name = 'Team 2';
            state.Team1Score = 0;
            state.Team2Score = 0;
            state.Team1Members = [];
            state.Team2Members = [];
            $('#team1Name').value = state.Team1Name;
            $('#team2Name').value = state.Team2Name;
            $('#team1Members').value = '';
            $('#team2Members').value = '';
            renderMemberSelect('1');
            renderMemberSelect('2');
            pushState();
        });
    }

    function wireQuestions() {
        $$('.question').forEach(function (el) {
            var question = JSON.parse(el.dataset.question);

            $('.start-question', el).addEventListener('click', function () {
                state.Question = question.question;
                state.Strikes = 0;
                state.Responses = question.answers.length;
                state.Answers = question.answers.map(function (a) {
                    return { Answer: a.answer, Value: a.value, Visible: 0 };
                });
                setActiveQuestion(el);
                pushState();
            });

            $$('.reveal-toggle', el).forEach(function (btn) {
                btn.addEventListener('click', function () {
                    if (el !== activeQuestionEl) return;
                    var index = parseInt(btn.dataset.index, 10);
                    var answer = state.Answers[index];
                    answer.Visible = answer.Visible ? 0 : 1;
                    btn.textContent = answer.Visible ? 'Hide' : 'Reveal';
                    pushState();
                });
            });
        });
    }

    function findQuestionElement(questionText) {
        return $$('.question').find(function (el) {
            return JSON.parse(el.dataset.question).question === questionText;
        });
    }

    async function hydrate() {
        try {
            var response = await fetch('/current-state');
            var current = await response.json();
            if (current) {
                Object.assign(state, current);
                $('#team1Name').value = state.Team1Name;
                $('#team2Name').value = state.Team2Name;
                $('#team1Members').value = (state.Team1Members || []).map(function (m) { return m.Name; }).join(', ');
                $('#team2Members').value = (state.Team2Members || []).map(function (m) { return m.Name; }).join(', ');
                state.Team1Members = state.Team1Members || [];
                state.Team2Members = state.Team2Members || [];
                renderMemberSelect('1');
                renderMemberSelect('2');

                var matchEl = findQuestionElement(state.Question);
                if (matchEl) {
                    setActiveQuestion(matchEl);
                    $$('.reveal-toggle', matchEl).forEach(function (btn) {
                        var index = parseInt(btn.dataset.index, 10);
                        var visible = state.Answers[index] && state.Answers[index].Visible;
                        btn.textContent = visible ? 'Hide' : 'Reveal';
                    });
                }
            }
        } catch (error) {
            console.error('Failed to load current state', error);
        }
        renderState();
    }

    document.addEventListener('DOMContentLoaded', function () {
        if (!$('#teams')) return;
        wireTeamControls();
        wireRoundControls();
        wireQuestions();
        hydrate();
    });
})();
