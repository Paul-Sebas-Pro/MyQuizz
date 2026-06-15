<header>
  <h1>MyQuiz</h1>
</header>

<main>
  {#if $auth.isLoading}
    <p>Chargement...</p>
  {:else if $auth.isAuthenticated}
    <p>Bienvenue {$auth.user?.firstname}</p>
    <button onclick={() => auth.logout()}>Déconnexion</button>
  {:else}
    <Login />
    <Signup />
  {/if}
</main>

<footer>
  O'Clock - {new Date().getFullYear()} - Tous droits réservés
</footer>


<script lang="ts">
  import { onMount } from "svelte";
  import Login from "./components/Login.svelte";
  import Signup from "./components/Signup.svelte";
  import { auth } from "./stores/auth.js";

  onMount(async () => {
    await auth.checkAuth();
  });

</script>

<style lang="css" scoped>
  h1 {
    text-decoration: underline;
  }

  footer {
    padding-top: 2rem;
  }
</style>
