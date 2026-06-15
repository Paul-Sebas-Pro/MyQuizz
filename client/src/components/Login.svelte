<section>
    <h2>Se connecter</h2>
    <form onsubmit={handleLogin}>
        <label for="email">
            Email :
            <input type="email" placeholder="alice@oclock.io" name="email" required>
        </label>
        <label for="password">
            Mot de passe :
            <input type="password" placeholder="*****" name="password" required>
        </label>

        <button disabled={isLoading}>
            {isLoading ? "Connexion" : "Se connecter"}
        </button>
        {#if error}
            <p class="error">{error}</p>
        {/if}
    </form>
</section>

<script lang="ts">
    import { get } from "svelte/store";
    import { api } from "../services/api";
    import { auth } from "../stores/auth";

    // Redirection vers la page dashboard si on est déja connecté
    if (get(auth).isAuthenticated) {
        window.location.href = "/dashboard";
    }

    // Définition des variables réactives (Runes)
    let isLoading = $state(false);
    let error = $state("");

    // Gestion du formulaire de connexion
    async function handleLogin(event: SubmitEvent) {
        event.preventDefault();

        // on passe l'état en "chargement"
        // on efface les anciennes erreurs
        isLoading = true;
        error = "";

        try {
            // on récupere les données saisies dans le formulaire (email, password)
            const formData = new FormData(event.target as HTMLFormElement);
            const email = formData.get("email") as string;
            const password = formData.get("password") as string;

            // Appel de l'API pour tenter de se connecter avec les identifiants
            const { access_token, refresh_token } = await api.login(email, password);

            // Sauvegarde des tokens dans le localStorage
            localStorage.setItem("access_token", access_token);
            localStorage.setItem("refresh_token", refresh_token);

            // Un fois connecté, on récupere les infos du profil de l'utilisateur
            const user = await api.getMe();

            // On met à jour l'état global de l'application avec les infos de l'utilisateur
            auth.setUser(user);

            // Redirection vers le tableau de bord
            window.location.href = "/dashboard";
        } catch (err) {
            // Si quelque chose échoue (mauvais mot de passe, serveur HS), on capture l'erreur
            // On cherche le message d'erreur renvoyé par le serveur, sinon on met un message générique
            error = (err as any).response?.data?.message || "Erreur de connexion";
        } finally {
            // Quoi qu'il arrive (succès ou échec), on arrête l'état de chargement
            isLoading = false;
        }
    }
</script>