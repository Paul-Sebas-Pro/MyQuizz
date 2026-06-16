<script lang="ts">
  import { onMount } from 'svelte';
  import { authStore } from './stores/auth.svelte';
  import { getPath } from './lib/router.svelte';
  import NavBar from './components/NavBar.svelte';
  import HomePage from './pages/HomePage.svelte';
  import LoginPage from './pages/LoginPage.svelte';
  import DashboardPage from './pages/DashboardPage.svelte';
  import QuizListPage from './pages/QuizListPage.svelte';
  import QuizPlayPage from './pages/QuizPlayPage.svelte';
  import ProfilePage from './pages/ProfilePage.svelte';

  onMount(() => authStore.checkAuth());

  const path = $derived(getPath());
  const segments = $derived(path.split('/').filter(Boolean));

  const page = $derived((() => {
    if (path === '/' || path === '') return 'home';
    if (path === '/login') return 'login';
    if (path === '/dashboard') return 'dashboard';
    if (path === '/quizzes' || path === '/quizzes/') return 'quiz-list';
    if (segments[0] === 'quizzes' && segments[1] && !isNaN(Number(segments[1]))) return 'quiz-play';
    if (segments[0] === 'profile' && segments[1] && !isNaN(Number(segments[1]))) return 'profile';
    return '404';
  })());
</script>

{#if authStore.isLoading}
  <div class="splash">
    <p class="splash-logo">MyQuizz</p>
  </div>
{:else}
  <NavBar />

  <main>
    {#if page === 'home'}
      <HomePage />
    {:else if page === 'login'}
      <LoginPage />
    {:else if page === 'dashboard'}
      <DashboardPage />
    {:else if page === 'quiz-list'}
      <QuizListPage />
    {:else if page === 'quiz-play'}
      <QuizPlayPage quizId={Number(segments[1])} />
    {:else if page === 'profile'}
      <ProfilePage userId={Number(segments[1])} />
    {:else}
      <div class="container not-found">
        <h1>404</h1>
        <p>Page introuvable.</p>
        <button class="btn btn-primary" onclick={() => { history.pushState({}, '', '/'); window.dispatchEvent(new PopStateEvent('popstate')); }}>
          Retour à l'accueil
        </button>
      </div>
    {/if}
  </main>

  <footer class="site-footer">
    <div class="container footer-inner">
      <span class="footer-brand">MyQuizz</span>
      <span class="footer-copy">© {new Date().getFullYear()} — Projet portfolio</span>
    </div>
  </footer>
{/if}

<style>
  :global(#app) {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
  }

  main { flex: 1; }

  .splash {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #fff 0%, var(--c-accent-soft) 100%);
  }
  .splash-logo {
    font-family: var(--font-heading);
    font-size: 3rem;
    font-weight: 700;
    color: var(--c-accent);
    animation: pulse 1.5s ease-in-out infinite;
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }

  .not-found {
    padding: var(--sp-16) var(--sp-6);
    text-align: center;
  }
  .not-found h1 {
    font-size: 6rem;
    color: var(--c-accent);
    margin-bottom: var(--sp-4);
  }
  .not-found p { color: var(--c-muted); margin-bottom: var(--sp-6); }

  .site-footer {
    border-top: 1px solid var(--c-border);
    padding: var(--sp-6) 0;
    margin-top: var(--sp-12);
  }
  .footer-inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .footer-brand { font-family: var(--font-heading); font-weight: 700; color: var(--c-accent); }
  .footer-copy { font-size: 0.875rem; color: var(--c-muted); }
</style>
