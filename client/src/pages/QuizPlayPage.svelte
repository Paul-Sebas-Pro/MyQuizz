<script lang="ts">
  import { authStore } from '../stores/auth.svelte';
  import { navigate } from '../lib/router.svelte';
  import { api, type QuizDTO, type QuestionDTO, type AttemptResult } from '../services/api';

  let { quizId }: { quizId: number } = $props();

  // ── État ──────────────────────────────────────────────────────────────────
  let quiz: QuizDTO | null = $state(null);
  let questions: QuestionDTO[] = $state([]);
  let loading = $state(true);
  let error = $state('');

  let step: 'play' | 'result' = $state('play');
  let currentIndex = $state(0);
  let selectedAnswers = $state<Record<number, number>>({});  // question_id → answer_id
  let result: AttemptResult | null = $state(null);
  let submitting = $state(false);

  const currentQuestion = $derived(questions[currentIndex]);
  const progress = $derived(questions.length > 0 ? ((currentIndex) / questions.length) * 100 : 0);
  const selectedForCurrent = $derived(currentQuestion ? selectedAnswers[currentQuestion.id] : undefined);
  const allAnswered = $derived(questions.every((q) => selectedAnswers[q.id] !== undefined));

  $effect(() => {
    Promise.all([api.getQuiz(quizId), api.getQuizQuestions(quizId)])
      .then(([q, qs]) => { quiz = q; questions = qs; })
      .catch(() => { error = 'Impossible de charger le quiz.'; })
      .finally(() => { loading = false; });
  });

  function selectAnswer(questionId: number, answerId: number) {
    selectedAnswers = { ...selectedAnswers, [questionId]: answerId };
  }

  function next() {
    if (currentIndex < questions.length - 1) currentIndex++;
  }

  function prev() {
    if (currentIndex > 0) currentIndex--;
  }

  async function submitQuiz() {
    if (!authStore.isAuthenticated) { navigate('/login'); return; }
    if (!allAnswered) return;

    submitting = true;
    try {
      const payload = Object.entries(selectedAnswers).map(([qId, aId]) => ({
        question_id: Number(qId),
        answer_id: aId,
      }));
      result = await api.submitAttempt(quizId, payload);
      step = 'result';
    } catch {
      error = 'Erreur lors de l\'envoi des réponses.';
    } finally {
      submitting = false;
    }
  }

  function scorePercent() {
    if (!result) return 0;
    return Math.round((result.score / result.score_max) * 100);
  }
</script>

<div class="container quiz-play">
  {#if loading}
    <div class="tile skeleton" style="min-height:400px"></div>

  {:else if error}
    <p class="msg-error">{error}</p>

  {:else if step === 'play' && currentQuestion}
    <!-- Header quiz -->
    <header class="play-header">
      <div class="play-meta">
        <h1 class="play-title">{quiz?.title}</h1>
        <span class="q-counter">{currentIndex + 1} / {questions.length}</span>
      </div>
      <!-- Barre de progression -->
      <div class="progress-bar">
        <div class="progress-fill" style="width:{progress}%"></div>
      </div>
    </header>

    <!-- Question -->
    <div class="question-tile tile">
      <p class="level-badge badge">{currentQuestion.level.name}</p>
      <h2 class="question-statement">{currentQuestion.statement}</h2>

      <!-- Réponses -->
      <div class="answers-grid">
        {#each currentQuestion.answers as answer}
          <button
            class="answer-btn"
            class:selected={selectedForCurrent === answer.id}
            onclick={() => selectAnswer(currentQuestion.id, answer.id)}>
            {answer.description}
          </button>
        {/each}
      </div>
    </div>

    <!-- Navigation -->
    <div class="play-nav">
      <button class="btn btn-secondary" onclick={prev} disabled={currentIndex === 0}>
        ← Précédent
      </button>

      <div class="dot-nav">
        {#each questions as q, i}
          <button
            class="dot"
            class:answered={selectedAnswers[q.id] !== undefined}
            class:current={i === currentIndex}
            onclick={() => { currentIndex = i; }}
            aria-label={`Question ${i + 1}`}>
          </button>
        {/each}
      </div>

      {#if currentIndex < questions.length - 1}
        <button class="btn btn-primary" onclick={next} disabled={selectedForCurrent === undefined}>
          Suivant →
        </button>
      {:else}
        <button class="btn btn-primary" onclick={submitQuiz}
          disabled={!allAnswered || submitting}>
          {submitting ? 'Envoi…' : 'Terminer →'}
        </button>
      {/if}
    </div>

    {#if !authStore.isAuthenticated}
      <p class="login-notice">
        <a href="/login" onclick={(e) => { e.preventDefault(); navigate('/login'); }}>Connectez-vous</a>
        pour sauvegarder votre score.
      </p>
    {/if}

  <!-- Résultats -->
  {:else if step === 'result' && result}
    <div class="result-card tile">
      <div class="result-score">
        <span class="score-big">{result.score}/{result.score_max}</span>
        <span class="score-pct">{scorePercent()}%</span>
      </div>

      <h2 class="result-title">
        {#if scorePercent() >= 80}🏆 Excellent !
        {:else if scorePercent() >= 50}👍 Bien joué !
        {:else}💪 Continuez d'apprendre !{/if}
      </h2>

      <!-- Détail par question -->
      <div class="result-details">
        {#each questions as q}
          {@const detail = result.details.find((d) => d.question_id === q.id)}
          <div class="result-row" class:correct={detail?.is_correct} class:wrong={!detail?.is_correct}>
            <span class="result-icon">{detail?.is_correct ? '✓' : '✗'}</span>
            <div class="result-q">
              <p class="result-statement">{q.statement}</p>
              {#if !detail?.is_correct}
                <p class="result-correct-ans">
                  Bonne réponse : {q.answers.find((a) => a.id === detail?.correct_answer_id)?.description ?? '—'}
                </p>
              {/if}
              {#if q.anecdote}
                <p class="result-anecdote">{q.anecdote}</p>
              {/if}
            </div>
          </div>
        {/each}
      </div>

      <div class="result-actions">
        <button class="btn btn-secondary" onclick={() => { step = 'play'; currentIndex = 0; selectedAnswers = {}; result = null; }}>
          Rejouer
        </button>
        <button class="btn btn-primary" onclick={() => navigate('/quizzes')}>
          Autres quiz →
        </button>
      </div>
    </div>
  {/if}
</div>

<style>
  .quiz-play { padding: var(--sp-8) var(--sp-6); max-width: 720px; }

  /* Header */
  .play-header { margin-bottom: var(--sp-6); }
  .play-meta {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    margin-bottom: var(--sp-3);
  }
  .play-title { font-size: 1.5rem; }
  .q-counter { color: var(--c-muted); font-size: 0.9rem; font-weight: 600; }

  .progress-bar {
    height: 6px;
    background: var(--c-border);
    border-radius: var(--r-full);
    overflow: hidden;
  }
  .progress-fill {
    height: 100%;
    background: var(--c-accent);
    border-radius: var(--r-full);
    transition: width 0.4s ease;
  }

  /* Question */
  .question-tile {
    display: flex;
    flex-direction: column;
    gap: var(--sp-6);
    margin-bottom: var(--sp-6);
  }
  .level-badge { align-self: flex-start; }
  .question-statement { font-size: 1.375rem; line-height: 1.4; }

  /* Réponses */
  .answers-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--sp-3);
  }
  .answer-btn {
    padding: var(--sp-4);
    border: 2px solid var(--c-border);
    border-radius: var(--r-md);
    background: var(--c-ground);
    cursor: pointer;
    font-family: var(--font-body);
    font-size: 0.9375rem;
    text-align: left;
    transition: border-color 0.15s, background 0.15s;
  }
  .answer-btn:hover { border-color: var(--c-accent); background: var(--c-accent-soft); }
  .answer-btn.selected { border-color: var(--c-accent); background: var(--c-accent-soft); font-weight: 600; }

  /* Navigation */
  .play-nav {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--sp-4);
    margin-bottom: var(--sp-4);
  }
  .dot-nav { display: flex; gap: var(--sp-2); }
  .dot {
    width: 10px; height: 10px;
    border-radius: var(--r-full);
    border: none;
    background: var(--c-border);
    cursor: pointer;
    transition: background 0.15s, transform 0.15s;
  }
  .dot.answered { background: var(--c-accent-soft); }
  .dot.current { background: var(--c-accent); transform: scale(1.3); }

  .login-notice {
    text-align: center;
    color: var(--c-muted);
    font-size: 0.875rem;
  }

  /* Résultats */
  .result-card {
    display: flex;
    flex-direction: column;
    gap: var(--sp-6);
    align-items: center;
    text-align: center;
  }
  .result-score {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--sp-2);
  }
  .score-big { font-family: var(--font-heading); font-size: 4rem; font-weight: 700; color: var(--c-accent); }
  .score-pct { font-size: 1.25rem; color: var(--c-muted); }
  .result-title { font-size: 1.5rem; }

  .result-details {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: var(--sp-3);
    text-align: left;
  }
  .result-row {
    display: flex;
    gap: var(--sp-3);
    padding: var(--sp-3) var(--sp-4);
    border-radius: var(--r-md);
    align-items: flex-start;
  }
  .result-row.correct { background: #F0FDF4; }
  .result-row.wrong { background: #FEF2F2; }
  .result-icon { font-size: 1.1rem; font-weight: 700; flex-shrink: 0; margin-top: 2px; }
  .result-row.correct .result-icon { color: var(--c-success); }
  .result-row.wrong .result-icon { color: var(--c-error); }
  .result-statement { font-weight: 600; font-size: 0.9rem; }
  .result-correct-ans { font-size: 0.85rem; color: var(--c-success); margin-top: var(--sp-1); }
  .result-anecdote { font-size: 0.8rem; color: var(--c-muted); font-style: italic; margin-top: var(--sp-1); }

  .result-actions { display: flex; gap: var(--sp-4); }

  .skeleton {
    background: linear-gradient(90deg, var(--c-tile) 25%, var(--c-tile-hover) 50%, var(--c-tile) 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
  }
  @keyframes shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }

  @media (max-width: 600px) {
    .answers-grid { grid-template-columns: 1fr; }
  }
</style>
