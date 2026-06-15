<section>
    <h2>Créer un compte</h2>
    <form onsubmit={handleSignup}>
        <label for="firstname">
            Prénom :
            <input type="text" placeholder="Alice" name="firstname" required>
        </label>

        <label for="lastname">
            Nom :
            <input type="text" placeholder="O'Clock" name="lastname" required>
        </label>

        <label for="email">
            Email :
            <input type="email" placeholder="alice@oclock.io" name="email" required>
        </label>

        <label for="password">
            Mot de passe :
            <input type="password" placeholder="******" name="password" required>
        </label>

        <label for="confirm">
            Confirmation :
            <input type="password" placeholder="******" name="confirm" required>
        </label>

        <button disabled={isLoading}>
            {isLoading ? "Inscription..." : "S'inscrire"}
        </button>
        {#if error}
            <p class="error">{error}</p>
        {/if}
    </form>
</section>

<script lang="ts">
    import { api } from "../services/api";

    // Définition des variables réactives (Runes)
    let isLoading = $state(false);
    let error = $state("");

    async function handleSignup(event: SubmitEvent) {
        event.preventDefault();

        // on passe l'état en "chargement"
        // on efface les anciennes erreurs
        isLoading = true;
        error = "";

        try {
            // on récupere les données saisies dans le formulaire
            const formData = new FormData(event.target as HTMLFormElement);
            const firstname = formData.get("firstname") as string;
            const lastname = formData.get("lastname") as string;
            const email = formData.get("email") as string;
            const password = formData.get("password") as string;
            const confirm = formData.get("confirm") as string;

            // Appel de l'API pour s'inscrire (signup)
            await api.signup({
                firstname,
                lastname,
                email,
                password,
                confirm
            });

            // Redirection vers la page login
            window.location.href = "/login";
        } catch (err) {
            // Si quelque chose échoue, on capture l'erreur
            // On cherche le message d'erreur renvoyé par le serveur, sinon on met un message générique
            error = (err as any).response?.data?.message || "Erreur lors de l'inscription";
        } finally {
            // Quoi qu'il arrive (succès ou échec), on arrête l'état de chargement
            isLoading = false;
        }
    }
</script>