<script lang="ts">
  import { authStore } from '../stores/auth.svelte';
  import { navigate } from '../lib/router.svelte';
  import { api, type UserProfileDTO, type AttemptDTO } from '../services/api';

  let { userId }: { userId: number } = $props();

  if (!authStore.isAuthenticated) navigate('/login');

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
</script>

<div class="container profile-page">
  {#if loading}
    <div class="tile skeleton" style="min-height:300px"></div>

  {:else if profile}
    <div class="profile-layout">
      <!-- Card profil -->
      <aside class="profile-card tile">
        <div class="avatar">
          {profile.firstname[0]}{profile.lastname[0]}
        </div>
        <h1 class="profile-name">{profile.firstname} {profile.lastname}</h1>
        <p class="profile-email">{profile.email}</p>
        <span class="badge">{profile.role}</span>

        <div class="profile-stats">
          <div class="p-stat">
            <span class="p-stat-num">{profile.nb_quiz_played}</span>
            <span class="p-stat-lbl">Quiz joués</span>
          </div>
          <div class="p-stat">
            <span class="p-stat-num">{attempts.length}</span>
            <span class="p-stat-lbl">Tentatives</span>
          </div>
        </div>

        {#if authStore.user?.id === userId}
          <button class="btn btn-ghost btn-sm" onclick={() => navigate('/dashboard')}>
            Mon dashboard
          </button>
        {/if}
      </aside>

      <!-- Historique -->
      <main class="profile-history">
        <h2>Historique</h2>

        {#if attempts.length === 0}
          <div class="tile empty-state">
            <p>Aucune tentative pour l'instant.</p>
          </div>
        {:else}
          <div class="attempts-list">
            {#each attempts as attempt}
              {@const pct = scorePercent(attempt.score, attempt.score_max)}
              <article class="tile attempt-row"
                onclick={() => navigate(`/quizzes/${attempt.quiz.id}`)}
                role="button" tabindex="0"
                onkeydown={(e) => e.key === 'Enter' && navigate(`/quizzes/${attempt.quiz.id}`)}>
                <div class="attempt-info">
                  <span class="attempt-title">{attempt.quiz.title}</span>
                  <time class="attempt-date">
                    {new Date(attempt.created_at).toLocaleDateString('fr-FR')}
                  </time>
                </div>
                <div class="attempt-score">
                  <span class="score-chip" style="background:{pct >= 80 ? '#F0FDF4' : pct >= 50 ? 'var(--c-accent-soft)' : '#FEF2F2'}; color:{pct >= 80 ? 'var(--c-success)' : pct >= 50 ? 'var(--c-accent)' : 'var(--c-error)'}">
                    {attempt.score}/{attempt.score_max} · {pct}%
                  </span>
                </div>
              </article>
            {/each}
          </div>
        {/if}
      </main>
    </div>
  {/if}
</div>

<style>
  .profile-page { padding: var(--sp-8) var(--sp-6); }

  .profile-layout {
    display: grid;
    grid-template-columns: 300px 1fr;
    gap: var(--sp-8);
    align-items: start;
  }

  /* Card profil */
  .profile-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--sp-4);
    text-align: center;
    position: sticky;
    top: 5rem;
  }

  .avatar {
    width: 80px; height: 80px;
    border-radius: var(--r-full);
    background: var(--c-accent);
    color: #fff;
    font-family: var(--font-heading);
    font-size: 1.75rem;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    text-transform: uppercase;
  }

  .profile-name { font-size: 1.5rem; }
  .profile-email { color: var(--c-muted); font-size: 0.875rem; }

  .profile-stats {
    display: flex;
    gap: var(--sp-6);
    width: 100%;
    justify-content: center;
    padding-top: var(--sp-4);
    border-top: 1px solid var(--c-border);
  }
  .p-stat { display: flex; flex-direction: column; align-items: center; gap: var(--sp-1); }
  .p-stat-num { font-family: var(--font-heading); font-size: 1.5rem; font-weight: 700; color: var(--c-accent); }
  .p-stat-lbl { font-size: 0.75rem; color: var(--c-muted); }

  /* Historique */
  .profile-history h2 { font-size: 1.5rem; margin-bottom: var(--sp-6); }
  .attempts-list { display: flex; flex-direction: column; gap: var(--sp-3); }

  .attempt-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--sp-3) var(--sp-4);
    cursor: pointer;
  }

  .attempt-info { display: flex; flex-direction: column; gap: var(--sp-1); }
  .attempt-title { font-weight: 600; font-size: 0.9375rem; }
  .attempt-date { font-size: 0.8rem; color: var(--c-muted); }

  .score-chip {
    padding: var(--sp-2) var(--sp-3);
    border-radius: var(--r-full);
    font-size: 0.8rem;
    font-weight: 700;
  }

  .empty-state {
    padding: var(--sp-8);
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

  @media (max-width: 768px) {
    .profile-layout { grid-template-columns: 1fr; }
    .profile-card { position: static; }
  }
</style>
