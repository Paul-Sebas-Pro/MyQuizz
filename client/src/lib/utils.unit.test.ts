// on importe les fonctions de test
import { describe, expect, it } from "vitest"
// on importe la fonction à tester
import { toReadableDate } from "./utils"

describe("toReadableDate", () => {

    // renvoyer la date dans un format francais
    it("should return the date in a french format", () => {
        // Arrange
        // Date utilise pour les mois un index qui commence à 0, donc janvier = 0, février à 1 etc ...
        const date = new Date(2026, 0, 28);
        // Act
        // on envoie la date créée à notre fonction, et on s'attend à avoir une conversion en francais
        const result = toReadableDate(date);
        // Assert
        expect(result).toEqual("mercredi 28 janvier 2026");
    })

    // ne pas avoir de 0 avant les jours < à 10 (ex : 1 janvier et pas 01 janvier)
    it("should not get a 0 before days < to 10", () => {
        const date = new Date(2026, 0, 1);
        const result = toReadableDate(date);
        expect(result).toEqual("jeudi 1 janvier 2026");

    })
})