<script lang="ts">
  import { authStore } from '../stores/auth.svelte';
  import { navigate } from '../lib/router.svelte';
  import { api } from '../services/api';

  if (authStore.isAuthenticated) navigate('/dashboard');

  let tab: 'login' | 'signup' = $state('login');
  let isLoading = $state(false);
  let error = $state('');

  async function handleLogin(e: SubmitEvent) {
    e.preventDefault();
    isLoading = true;
    error = '';
    try {
      const form = new FormData(e.target as HTMLFormElement);
      await authStore.login(
        form.get('email') as string,
        form.get('password') as string,
      );
      navigate('/dashboard');
    } catch (err: any) {
      error = err.response?.data?.message || 'Identifiants incorrects.';
    } finally {
      isLoading = false;
    }
  }

  async function handleSignup(e: SubmitEvent) {
    e.preventDefault();
    isLoading = true;
    error = '';
    try {
      const form = new FormData(e.target as HTMLFormElement);
      const password = form.get('password') as string;
      const confirm = form.get('confirm') as string;
      if (password !== confirm) { error = 'Les mots de passe ne correspondent pas.'; return; }

      await api.signup({
        firstname: form.get('firstname') as string,
        lastname: form.get('lastname') as string,
        email: form.get('email') as string,
        password,
        confirm,
      });
      await authStore.login(form.get('email') as string, password);
      navigate('/dashboard');
    } catch (err: any) {
      error = err.response?.data?.message || 'Erreur lors de l\'inscription.';
    } finally {
      isLoading = false;
    }
  }
</script>

<div class="page-wrap">
  <div class="auth-card tile">
    <h1 class="auth-title">MyQuizz</h1>

    <!-- Tabs -->
    <div class="tabs">
      <button class="tab" class:active={tab === 'login'} onclick={() => { tab = 'login'; error = ''; }}>
        Connexion
      </button>
      <button class="tab" class:active={tab === 'signup'} onclick={() => { tab = 'signup'; error = ''; }}>
        Inscription
      </button>
    </div>

    {#if error}
      <p class="msg-error">{error}</p>
    {/if}

    <!-- Login -->
    {#if tab === 'login'}
      <form onsubmit={handleLogin} class="auth-form">
        <div class="form-group">
          <label for="login-email">Email</label>
          <input id="login-email" class="input" type="email" name="email"
            placeholder="alice@example.com" required />
        </div>
        <div class="form-group">
          <label for="login-password">Mot de passe</label>
          <input id="login-password" class="input" type="password" name="password"
            placeholder="••••••••" required />
        </div>
        <button class="btn btn-primary w-full" type="submit" disabled={isLoading}>
          {isLoading ? 'Connexion…' : 'Se connecter'}
        </button>
      </form>

    <!-- Signup -->
    {:else}
      <form onsubmit={handleSignup} class="auth-form">
        <div class="form-row">
          <div class="form-group">
            <label for="signup-firstname">Prénom</label>
            <input id="signup-firstname" class="input" type="text" name="firstname"
              placeholder="Alice" required />
          </div>
          <div class="form-group">
            <label for="signup-lastname">Nom</label>
            <input id="signup-lastname" class="input" type="text" name="lastname"
              placeholder="Dupont" required />
          </div>
        </div>
        <div class="form-group">
          <label for="signup-email">Email</label>
          <input id="signup-email" class="input" type="email" name="email"
            placeholder="alice@example.com" required />
        </div>
        <div class="form-group">
          <label for="signup-password">Mot de passe</label>
          <input id="signup-password" class="input" type="password" name="password"
            placeholder="••••••••" required minlength="8" />
        </div>
        <div class="form-group">
          <label for="signup-confirm">Confirmer le mot de passe</label>
          <input id="signup-confirm" class="input" type="password" name="confirm"
            placeholder="••••••••" required />
        </div>
        <button class="btn btn-primary w-full" type="submit" disabled={isLoading}>
          {isLoading ? 'Création…' : 'Créer un compte'}
        </button>
      </form>
    {/if}

    <p class="back-link">
      <button class="link-btn" onclick={() => navigate('/')}>← Retour à l'accueil</button>
    </p>
  </div>
</div>

<style>
  .page-wrap {
    min-height: calc(100vh - 4rem);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--sp-8) var(--sp-4);
    background: linear-gradient(135deg, #fff 0%, var(--c-accent-soft) 100%);
  }

  .auth-card {
    width: 100%;
    max-width: 440px;
    display: flex;
    flex-direction: column;
    gap: var(--sp-6);
    background: #fff;
    box-shadow: var(--shadow-lg);
  }

  .auth-title {
    font-size: 2rem;
    text-align: center;
    color: var(--c-accent);
  }

  .tabs {
    display: flex;
    border-bottom: 2px solid var(--c-border);
  }

  .tab {
    flex: 1;
    padding: var(--sp-3);
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    margin-bottom: -2px;
    cursor: pointer;
    font-weight: 600;
    font-size: 0.9375rem;
    color: var(--c-muted);
    transition: color 0.15s, border-color 0.15s;
  }

  .tab.active {
    color: var(--c-accent);
    border-bottom-color: var(--c-accent);
  }

  .auth-form {
    display: flex;
    flex-direction: column;
    gap: var(--sp-4);
  }

  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--sp-4);
  }

  .w-full { width: 100%; justify-content: center; }

  .back-link { text-align: center; }

  .link-btn {
    background: none;
    border: none;
    cursor: pointer;
    color: var(--c-muted);
    font-size: 0.875rem;
    text-decoration: underline;
  }
  .link-btn:hover { color: var(--c-inverse); }
</style>
