<script lang="ts">
  import { api, type QuizDTO } from '../services/api';
  import { authStore } from '../stores/auth.svelte';
  import { navigate } from '../lib/router.svelte';
  import QuizCard from '../components/QuizCard.svelte';

  let recentQuizzes: QuizDTO[] = $state([]);
  let loading = $state(true);
  let error = $state('');

  $effect(() => {
    api.getRecentQuizzes()
      .then((data) => { recentQuizzes = data; })
      .catch(() => { error = 'Impossible de charger les quiz.'; })
      .finally(() => { loading = false; });
  });
</script>

<!-- Hero -->
<section class="hero">
  <div class="container hero-inner">
    <div class="hero-text">
      <h1 class="hero-title">Testez vos<br /><em>connaissances</em></h1>
      <p class="hero-desc">
        Des quiz sur le développement web, la programmation et bien plus encore.
        Créez votre compte et suivez votre progression.
      </p>
      <div class="hero-cta">
        {#if authStore.isAuthenticated}
          <button class="btn btn-primary" onclick={() => navigate('/quizzes')}>
            Parcourir les quiz →
          </button>
          <button class="btn btn-secondary" onclick={() => navigate('/dashboard')}>
            Mon dashboard
          </button>
        {:else}
          <button class="btn btn-primary" onclick={() => navigate('/login')}>
            Commencer gratuitement →
          </button>
          <button class="btn btn-secondary" onclick={() => navigate('/quizzes')}>
            Voir les quiz
          </button>
        {/if}
      </div>
    </div>

    <div class="hero-stats bento bento-2">
      <div class="tile stat-tile">
        <span class="stat-number">100+</span>
        <span class="stat-label">Questions</span>
      </div>
      <div class="tile stat-tile">
        <span class="stat-number">3</span>
        <span class="stat-label">Niveaux</span>
      </div>
      <div class="tile stat-tile">
        <span class="stat-number">∞</span>
        <span class="stat-label">Tentatives</span>
      </div>
      <div class="tile stat-tile">
        <span class="stat-number">🏆</span>
        <span class="stat-label">Classement</span>
      </div>
    </div>
  </div>
</section>

<!-- Quiz récents -->
<section class="recent-section">
  <div class="container">
    <div class="section-header">
      <h2>Quiz récents</h2>
      <button class="btn btn-ghost btn-sm" onclick={() => navigate('/quizzes')}>
        Tous les quiz →
      </button>
    </div>

    {#if loading}
      <div class="bento bento-3">
        {#each [1,2,3] as _}
          <div class="tile skeleton"></div>
        {/each}
      </div>
    {:else if error}
      <p class="msg-error">{error}</p>
    {:else if recentQuizzes.length === 0}
      <p class="empty">Aucun quiz disponible pour l'instant.</p>
    {:else}
      <div class="bento bento-3">
        {#each recentQuizzes as quiz}
          <QuizCard {quiz} />
        {/each}
      </div>
    {/if}
  </div>
</section>

<style>
  /* Hero */
  .hero {
    padding: var(--sp-16) 0;
    background: linear-gradient(135deg, #fff 0%, var(--c-accent-soft) 100%);
  }

  .hero-inner {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--sp-12);
    align-items: center;
  }

  .hero-title {
    font-size: clamp(2.5rem, 5vw, 4rem);
    margin-bottom: var(--sp-4);
  }

  .hero-title em {
    color: var(--c-accent);
    font-style: italic;
  }

  .hero-desc {
    color: var(--c-muted);
    font-size: 1.125rem;
    margin-bottom: var(--sp-8);
    max-width: 42ch;
  }

  .hero-cta {
    display: flex;
    gap: var(--sp-4);
    flex-wrap: wrap;
  }

  .hero-stats {
    max-width: 360px;
    justify-self: center;
  }

  .stat-tile {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--sp-2);
    text-align: center;
  }

  .stat-number {
    font-family: var(--font-heading);
    font-size: 2rem;
    font-weight: 700;
    color: var(--c-accent);
  }

  .stat-label {
    font-size: 0.875rem;
    color: var(--c-muted);
    font-weight: 500;
  }

  /* Quiz récents */
  .recent-section {
    padding: var(--sp-12) 0;
  }

  .section-header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    margin-bottom: var(--sp-8);
  }

  .section-header h2 {
    font-size: 1.75rem;
  }

  .skeleton {
    min-height: 200px;
    background: linear-gradient(90deg, var(--c-tile) 25%, var(--c-tile-hover) 50%, var(--c-tile) 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
  }

  @keyframes shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }

  .empty {
    color: var(--c-muted);
    text-align: center;
    padding: var(--sp-12);
  }

  @media (max-width: 768px) {
    .hero-inner { grid-template-columns: 1fr; }
    .hero-stats { display: none; }
  }
</style>
