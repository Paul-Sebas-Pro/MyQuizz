<script lang="ts">
  import { authStore } from '../stores/auth.svelte';
  import { navigate } from '../lib/router.svelte';
  import { api, type AttemptDTO, type UserProfileDTO } from '../services/api';

  if (!authStore.isAuthenticated) navigate('/login');

  const userId = authStore.user!.id;

  let profile: UserProfileDTO | null = $state(null);
  let attempts: AttemptDTO[] = $state([]);
  let loading = $state(true);

  $effect(() => {
    Promise.all([api.getUserProfile(userId), api.getUserAttempts(userId)])
      .then(([p, a]) => { profile = p; attempts = a; })
      .finally(() => { loading = false; });
  });

  function scorePercent(score: number, max: number) {
    return max > 0 ? Math.round((score / max) * 100) : 0;
  }

  function scoreColor(pct: number) {
    if (pct >= 80) return 'var(--c-success)';
    if (pct >= 50) return 'var(--c-accent)';
    return 'var(--c-error)';
  }
</script>

<div class="container dashboard">
  <header class="dash-header">
    <div>
      <h1>Bonjour, {authStore.user?.firstname} 👋</h1>
      <p class="subtitle">Voici votre tableau de bord</p>
    </div>
    <button class="btn btn-primary" onclick={() => navigate('/quizzes')}>
      Jouer un quiz →
    </button>
  </header>

  {#if loading}
    <div class="bento bento-3">
      {#each [1,2,3] as _}
        <div class="tile skeleton" style="min-height:100px"></div>
      {/each}
    </div>
  {:else}
    <!-- Stats -->
    <div class="bento bento-4 stats-row">
      <div class="tile stat-tile">
        <span class="stat-num">{profile?.nb_quiz_played ?? 0}</span>
        <span class="stat-lbl">Quiz joués</span>
      </div>
      <div class="tile stat-tile">
        <span class="stat-num">{attempts.length}</span>
        <span class="stat-lbl">Tentatives</span>
      </div>
      <div class="tile stat-tile">
        <span class="stat-num">
          {#if attempts.length > 0}
            {Math.round(attempts.reduce((acc, a) => acc + scorePercent(a.score, a.score_max), 0) / attempts.length)}%
          {:else}
            —
          {/if}
        </span>
        <span class="stat-lbl">Score moyen</span>
      </div>
      <div class="tile stat-tile">
        <span class="stat-num">{profile?.role ?? '—'}</span>
        <span class="stat-lbl">Rôle</span>
      </div>
    </div>

    <!-- Historique -->
    <section class="history-section">
      <h2>Historique des tentatives</h2>

      {#if attempts.length === 0}
        <div class="tile empty-state">
          <p>Aucune tentative pour l'instant.</p>
          <button class="btn btn-primary" onclick={() => navigate('/quizzes')}>
            Jouer mon premier quiz →
          </button>
        </div>
      {:else}
        <div class="attempts-list">
          {#each attempts as attempt}
            {@const pct = scorePercent(attempt.score, attempt.score_max)}
            <article class="tile attempt-card"
              onclick={() => navigate(`/quizzes/${attempt.quiz.id}`)}
              role="button" tabindex="0"
              onkeydown={(e) => e.key === 'Enter' && navigate(`/quizzes/${attempt.quiz.id}`)}>
              <div class="attempt-info">
                <h3 class="attempt-title">{attempt.quiz.title}</h3>
                <time class="attempt-date">
                  {new Date(attempt.created_at).toLocaleDateString('fr-FR', {
                    day: 'numeric', month: 'long', year: 'numeric',
                  })}
                </time>
              </div>
              <div class="attempt-score">
                <span class="score-label" style="color: {scoreColor(pct)}">
                  {attempt.score}/{attempt.score_max}
                </span>
                <div class="score-bar">
                  <div class="score-fill" style="width:{pct}%; background:{scoreColor(pct)}"></div>
                </div>
                <span class="score-pct" style="color:{scoreColor(pct)}">{pct}%</span>
              </div>
            </article>
          {/each}
        </div>
      {/if}
    </section>
  {/if}
</div>

<style>
  .dashboard {
    padding: var(--sp-8) var(--sp-6);
  }

  .dash-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: var(--sp-8);
    flex-wrap: wrap;
    gap: var(--sp-4);
  }

  .dash-header h1 { font-size: 2rem; margin-bottom: var(--sp-1); }
  .subtitle { color: var(--c-muted); }

  .stats-row { margin-bottom: var(--sp-8); }

  .stat-tile {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--sp-2);
    text-align: center;
    padding: var(--sp-6);
  }

  .stat-num {
    font-family: var(--font-heading);
    font-size: 2rem;
    font-weight: 700;
    color: var(--c-accent);
    text-transform: capitalize;
  }

  .stat-lbl { font-size: 0.875rem; color: var(--c-muted); font-weight: 500; }

  .history-section h2 { margin-bottom: var(--sp-6); font-size: 1.5rem; }

  .attempts-list { display: flex; flex-direction: column; gap: var(--sp-3); }

  .attempt-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--sp-6);
    cursor: pointer;
    padding: var(--sp-4) var(--sp-6);
  }

  .attempt-info { flex: 1; min-width: 0; }
  .attempt-title {
    font-size: 1rem;
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .attempt-date { font-size: 0.8rem; color: var(--c-muted); }

  .attempt-score {
    display: flex;
    align-items: center;
    gap: var(--sp-3);
    flex-shrink: 0;
  }

  .score-label { font-weight: 700; font-size: 1rem; min-width: 3rem; text-align: right; }

  .score-bar {
    width: 80px;
    height: 6px;
    background: var(--c-border);
    border-radius: var(--r-full);
    overflow: hidden;
  }
  .score-fill { height: 100%; border-radius: var(--r-full); transition: width 0.6s ease; }

  .score-pct { font-size: 0.8rem; font-weight: 600; min-width: 2.5rem; }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--sp-4);
    padding: var(--sp-12);
    text-align: center;
    color: var(--c-muted);
  }

  .skeleton {
    background: linear-gradient(90deg, var(--c-tile) 25%, var(--c-tile-hover) 50%, var(--c-tile) 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
  }
  @keyframes shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
</style>
