<script lang="ts">
  import { authStore } from '../stores/auth.svelte';
  import { navigate } from '../lib/router.svelte';

  function handleLogout() {
    authStore.logout();
    navigate('/');
  }
</script>

<nav>
  <div class="container nav-inner">
    <button class="logo" onclick={() => navigate('/')}>
      MyQuizz
    </button>

    <div class="nav-links">
      <button class="nav-link" onclick={() => navigate('/quizzes')}>Quiz</button>

      {#if authStore.isAuthenticated}
        <button class="nav-link" onclick={() => navigate('/dashboard')}>Dashboard</button>
        <button class="nav-link" onclick={() => navigate(`/profile/${authStore.user?.id}`)}>
          {authStore.user?.firstname}
        </button>
        <button class="btn btn-sm btn-ghost" onclick={handleLogout}>Déconnexion</button>
      {:else}
        <button class="btn btn-sm btn-primary" onclick={() => navigate('/login')}>Connexion</button>
      {/if}
    </div>
  </div>
</nav>

<style>
  nav {
    position: sticky;
    top: 0;
    z-index: 100;
    background: rgba(255, 255, 255, 0.92);
    backdrop-filter: blur(12px);
    border-bottom: 1px solid var(--c-border);
  }

  .nav-inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 4rem;
  }

  .logo {
    font-family: var(--font-heading);
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--c-inverse);
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
  }

  .nav-links {
    display: flex;
    align-items: center;
    gap: var(--sp-4);
  }

  .nav-link {
    background: none;
    border: none;
    cursor: pointer;
    font-family: var(--font-body);
    font-size: 0.9375rem;
    font-weight: 500;
    color: var(--c-muted);
    padding: var(--sp-2) var(--sp-3);
    border-radius: var(--r-sm);
    transition: color 0.15s, background 0.15s;
  }

  .nav-link:hover {
    color: var(--c-inverse);
    background: var(--c-accent-soft);
  }
</style>
