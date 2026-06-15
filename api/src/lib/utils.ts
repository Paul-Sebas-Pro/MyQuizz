import z from "zod";

// Schéma de base pour un level
const levelBobySchema = z
  .object({
    name: z
      .string()
      .min(1, "Le nom ne peut pas être vide")
      .max(100, "Le nom ne peut pas dépasser 100 caractères")
      .trim(),
  })
  .strict(); // Refuse les champs non déclarés dans le schéma

// Schéma spécifique pour PATCH : tous les champs deviennent optionnels (on met à jour uniquement ce qu'on envoie)
// mais s'ils sont fournis, ils doivent respecter les memes règles
// .partial() => Les champs sont optionnels
const levelPatchSchema = levelBobySchema.partial();

// Cette fonction va nous permettre de vérifier que les valeurs qu'on récupère sont bien des "int"
// Ici en résumé on vérifie que l'id est bien un number
export async function parseIntFromParams(id: unknown) {
  // en une ligne, on vérifie la valeur récupérée et on regarde si on a bien un int, si le résultat est correct, zod renverra une réponse qui nous permet de continuer notre process, et si on a un problème, zod nous renverra une erreur qu'on va throw et catcher par la suite pour ne pas continuer le process
  // on utilise ici zod (z) qui va nous permettre de regarder -> si on a un number -> de type entier (int) -> avec une valeur minimale de 1 (parce qu'un id doit être positif et supérieur à 0) -> puis on appelle parseAsync qui va regarder la valeur en fonction des paramètres mentionnées précédemment
  return await z.coerce.number().int().min(1).parseAsync(id);
}

// Pour POST (création) - TOUS les champs sont requis
export async function parseLevelBody(response: unknown) {
  return await levelBobySchema.parseAsync(response);
}

// Pour PATCH (mise à jour) - champs optionnels, mais au moins 1 champ requis
export async function parseLevelPatchBody(response: unknown) {
  const parsed = await levelPatchSchema.parseAsync(response);

  // Verifier qu'au moins un champs est fourni dans le body
  if (Object.keys(parsed).length === 0) {
    throw new z.ZodError([
      {
        code: "custom",
        path: [],
        message: "Au moins un champ doit être fourni pour la mise à jour",
      },
    ]);
  }

  return parsed;
}

// export async function parseBodyFromParams(response: unknown) {
//   // on prépare un schéma qui représente ce qu'on veut récupérer de notre réponse
//   const levelBodySchema = z.object({
//     name: z.string().min(1),
//   });
//   // on va parser notre réponse
//   const answer = await levelBodySchema.parseAsync(response);
//   return answer;
// }
