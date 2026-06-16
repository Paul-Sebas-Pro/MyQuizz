<script lang="ts">
  import { api, type QuizDTO } from '../services/api';
  import QuizCard from '../components/QuizCard.svelte';

  let quizzes: QuizDTO[] = $state([]);
  let loading = $state(true);
  let error = $state('');
  let search = $state('');

  $effect(() => {
    api.getQuizzes()
      .then((data) => { quizzes = data; })
      .catch(() => { error = 'Impossible de charger les quiz.'; })
      .finally(() => { loading = false; });
  });

  const filtered = $derived(
    search.trim()
      ? quizzes.filter((q) =>
          q.title.toLowerCase().includes(search.toLowerCase()) ||
          q.tags.some((t) => t.tag.name.toLowerCase().includes(search.toLowerCase())),
        )
      : quizzes,
  );
</script>

<div class="container quiz-list">
  <header class="list-header">
    <h1>Tous les quiz</h1>
    <p class="subtitle">{quizzes.length} quiz disponibles</p>
  </header>

  <div class="search-bar">
    <input class="input" type="search" placeholder="Rechercher un quiz, un thème…"
      bind:value={search} />
  </div>

  {#if loading}
    <div class="bento bento-3">
      {#each [1,2,3,4,5,6] as _}
        <div class="tile skeleton"></div>
      {/each}
    </div>
  {:else if error}
    <p class="msg-error">{error}</p>
  {:else if filtered.length === 0}
    <div class="empty">
      {#if search}
        <p>Aucun quiz pour « {search} ».</p>
      {:else}
        <p>Aucun quiz disponible pour l'instant.</p>
      {/if}
    </div>
  {:else}
    <div class="bento bento-3">
      {#each filtered as quiz}
        <QuizCard {quiz} />
      {/each}
    </div>
  {/if}
</div>

<style>
  .quiz-list { padding: var(--sp-8) var(--sp-6); }

  .list-header { margin-bottom: var(--sp-6); }
  .list-header h1 { font-size: 2rem; margin-bottom: var(--sp-1); }
  .subtitle { color: var(--c-muted); }

  .search-bar { margin-bottom: var(--sp-8); max-width: 480px; }

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
    text-align: center;
    padding: var(--sp-12);
    color: var(--c-muted);
  }
</style>
