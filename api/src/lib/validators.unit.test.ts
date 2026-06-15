// On récupère les packages nécessaires : assert et test
import assert from "node:assert";
import { describe, it } from "node:test";
import { isValidPassword } from "./validators.ts";


describe("isValidPassword", () => {

  // tester qu'on récupère bien "true" quand le mot de pase est valide
  it("should get true when password is valid", () => {
    // Arrange
    const password = "IPUHEHiuyiuh42@";
    // Act
    const result = isValidPassword(password);
    // Assert
    // équivalent : assert.ok(result)
    assert.strictEqual(result, true); // ici on vérifie que le résultat est bien valide
  });

  // tester qu'on récupère bien "false" quand le mot de passe est trop court
  it("should get false when password is too short", () => {
    // Arrange
    const password = "@42TYu"; // 6 caractères mais toutes les autres conditions
    // Act
    const result = isValidPassword(password);
    // Assert
    assert.strictEqual(result, false); // on s'attend ici à recevoir false
  });


  // tester qu'on récupère bien "false" quand on pas a de caractère spécial
  it("should get false when there is no special caracter", () => {
    // Arrange
    const password = "AZyu34ooooooooooooooo";
    // Act
    const result = isValidPassword(password);
    // Assert
    assert.strictEqual(result, false);
  });
});