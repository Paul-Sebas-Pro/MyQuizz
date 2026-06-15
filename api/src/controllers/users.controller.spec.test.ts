// on importe nos fonctions permettant de tester
import assert from "node:assert";
import {it, describe} from "node:test";
// on importe prisma
import { prisma } from '../models/index.ts';
// on importe la fonction permettant de faire des requêtes
import { requester } from '../../test/index.ts';

// maintenant on va préparer nos tests de requetes

// récupérer les users
describe("GET /api/users", () => {
  it("should return an array containing the users from the database", async () => {
    // On crée les données
    // on appelle createManyAndReturn afin de récupérer le résultat de la création de nos données
    const databaseUsers = await prisma.user.createManyAndReturn({
      data: [
        {
          firstname: "Toto", lastname: "toto", email: "toto@toto.fr", password: "motdepasse"
        },
        {
          firstname: "Tata", lastname: "tata", email: "tata@tata.com", password: "motdepasse3000"
        }
      ]
    });
    // On récupère les données crées
    const { data: responseUsers } = await requester.get("/users");
    // On regarde si elles sont viables
    // sur nos données, on veut récupérer 2 users, avec chacun un id
    // est ce qu'on a 2 users
    assert.strictEqual(responseUsers.length, 2); // si notre tableau a une longueur de 2, on a bien récupéré 2 users
    // on va vérifier que les ids des users qu'on récupère sont égaux à ceux qu'on a récupéré quand on a créé nos users
    assert.strictEqual(responseUsers[0].id, databaseUsers[0].id);
    assert.strictEqual(responseUsers[1].id, databaseUsers[1].id);

    // ensuite on peut vérifier les valeurs des champs (on va pas tous les faire mais vous avez l'idée)
    assert.strictEqual(responseUsers[0].email, databaseUsers[0].email);
  });
  // Créer un user et vérifier ses propriétés

  it("should return an array containing the users from the database", async () => {
    const newUser = await prisma.user.create({
      data: {
        firstname: "michel",
        lastname: "michel",
        email: "michel@michel.michel",
        password: "motdepasse"
      } 
    });
    // petit trick de syntaxe : vu qu'on sait qu'on va recevoir un seul élément dans notre tableau, on définit la reception tel que ci dessous afin d'éviter de spécifier dans chaque segment d'asser qu'on utilise notreVariable[0] ... on utilisera plutot notreVariable
    const { data: [newUserFromApi]} = await requester.get('/users');

    assert.strictEqual(newUserFromApi.id , newUser.id);
    assert.strictEqual(newUserFromApi.firstname , newUser.firstname);
    assert.strictEqual(newUserFromApi.lastname , newUser.lastname);
    assert.strictEqual(newUserFromApi.email , newUser.email);
  });

});

