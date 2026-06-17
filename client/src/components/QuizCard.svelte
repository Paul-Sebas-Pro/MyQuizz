<script lang="ts">
  import type { QuizDTO } from '../services/api';
  import { navigate } from '../lib/router.svelte';

  let { quiz }: { quiz: QuizDTO } = $props();
</script>

<article class="tile quiz-card" role="button" tabindex="0"
  onclick={() => navigate(`/quizzes/${quiz.id}`)}
  onkeydown={(e) => e.key === 'Enter' && navigate(`/quizzes/${quiz.id}`)}>

  <div class="tags">
    {#each quiz.tags.slice(0, 3) as { tag }}
      <span class="badge">{tag.name}</span>
    {/each}
  </div>

  <h3 class="title">{quiz.title}</h3>

  {#if quiz.description}
    <p class="desc">{quiz.description}</p>
  {/if}

  <footer class="card-footer">
    <span class="author">par {quiz.author.firstname} {quiz.author.lastname}</span>
    <button class="btn btn-sm btn-primary" onclick={(e) => { e.stopPropagation(); navigate(`/quizzes/${quiz.id}`); }}>
      Jouer →
    </button>
  </footer>
</article>

<style>
  .quiz-card {
    display: flex;
    flex-direction: column;
    gap: var(--sp-3);
    cursor: pointer;
  }

  .tags {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-2);
  }

  .title {
    font-size: 1.25rem;
    font-weight: 700;
    line-height: 1.3;
    flex: 1;
  }

  .desc {
    color: var(--c-muted);
    font-size: 0.9rem;
    line-height: 1.5;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .card-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: auto;
    padding-top: var(--sp-3);
    border-top: 1px solid rgba(0,0,0,.08);
  }

  .author {
    font-size: 0.8rem;
    color: var(--c-muted);
  }
</style>
