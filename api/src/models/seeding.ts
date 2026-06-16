// Échantillonnage (seeding)

import { hash } from "argon2";
import { prisma } from "./index.ts";

// ── Niveaux ──────────────────────────────────────────────────────────────────
const [debutant, intermediaire, expert] = await Promise.all([
  prisma.level.upsert({ where: { name: "Débutant" }, update: {}, create: { name: "Débutant" } }),
  prisma.level.upsert({ where: { name: "Intermédiaire" }, update: {}, create: { name: "Intermédiaire" } }),
  prisma.level.upsert({ where: { name: "Expert" }, update: {}, create: { name: "Expert" } }),
]);

// ── Tags ──────────────────────────────────────────────────────────────────────
const [tagJS, tagCSS, tagPython, tagWeb] = await Promise.all([
  prisma.tag.upsert({ where: { name: "JavaScript" }, update: {}, create: { name: "JavaScript" } }),
  prisma.tag.upsert({ where: { name: "CSS" }, update: {}, create: { name: "CSS" } }),
  prisma.tag.upsert({ where: { name: "Python" }, update: {}, create: { name: "Python" } }),
  prisma.tag.upsert({ where: { name: "Web" }, update: {}, create: { name: "Web" } }),
]);

// Sous-tags (hiérarchie)
await Promise.all([
  prisma.tag.upsert({ where: { name: "HTML" }, update: { parent_id: tagWeb.id }, create: { name: "HTML", parent_id: tagWeb.id } }),
  prisma.tag.upsert({ where: { name: "TypeScript" }, update: { parent_id: tagJS.id }, create: { name: "TypeScript", parent_id: tagJS.id } }),
]);

// ── Utilisateurs ──────────────────────────────────────────────────────────────
const password = await hash("Passw0rd!");

const [alice, bob, charlie] = await Promise.all([
  prisma.user.upsert({
    where: { email: "alice@dupont.fr" },
    update: {},
    create: { firstname: "Alice", lastname: "Dupont", email: "alice@dupont.fr", password, role: "author" },
  }),
  prisma.user.upsert({
    where: { email: "bob@leponge.fr" },
    update: {},
    create: { firstname: "Bob", lastname: "Léponge", email: "bob@leponge.fr", password, role: "author" },
  }),
  prisma.user.upsert({
    where: { email: "charlie@martin.fr" },
    update: {},
    create: { firstname: "Charlie", lastname: "Martin", email: "charlie@martin.fr", password, role: "admin" },
  }),
]);

// ── Quiz JavaScript ───────────────────────────────────────────────────────────
const quizJS = await prisma.quiz.create({
  data: {
    title: "Les bases du JavaScript",
    description: "Testez vos connaissances sur les fondamentaux du JS : variables, boucles et fonctions.",
    published_at: new Date(),
    author_id: alice.id,
    tags: { create: [{ tag_id: tagJS.id }, { tag_id: tagWeb.id }] },
    questions: {
      create: [
        {
          statement: "Comment déclare-t-on une variable en JavaScript ?",
          anecdote: "ES6 a introduit let et const en 2015 pour remplacer var.",
          link: "https://developer.mozilla.org/fr/docs/Web/JavaScript/Guide/Grammar_and_types",
          level_id: debutant.id,
          answers: {
            create: [
              { description: "var x = 5", is_valid: false },
              { description: "let x = 5", is_valid: true },
              { description: "x := 5", is_valid: false },
              { description: "const x = 5", is_valid: true },
            ],
          },
        },
        {
          statement: "Quel opérateur compare à la fois la valeur ET le type ?",
          level_id: debutant.id,
          answers: {
            create: [
              { description: "==", is_valid: false },
              { description: "===", is_valid: true },
              { description: "!=", is_valid: false },
              { description: "=", is_valid: false },
            ],
          },
        },
        {
          statement: "Que retourne typeof null ?",
          anecdote: "Bug historique de JavaScript, présent depuis la version 1.0 de 1995.",
          level_id: intermediaire.id,
          answers: {
            create: [
              { description: '"null"', is_valid: false },
              { description: '"object"', is_valid: true },
              { description: '"undefined"', is_valid: false },
              { description: '"boolean"', is_valid: false },
            ],
          },
        },
      ],
    },
  },
});

// ── Quiz CSS ──────────────────────────────────────────────────────────────────
const quizCSS = await prisma.quiz.create({
  data: {
    title: "Flexbox & Grid",
    description: "Maîtrisez l'alignement, le positionnement et la mise en page responsive.",
    published_at: new Date(),
    author_id: bob.id,
    tags: { create: [{ tag_id: tagCSS.id }, { tag_id: tagWeb.id }] },
    questions: {
      create: [
        {
          statement: "Quelle propriété CSS active le mode Flexbox ?",
          level_id: debutant.id,
          answers: {
            create: [
              { description: "display: flex", is_valid: true },
              { description: "position: flex", is_valid: false },
              { description: "flex: true", is_valid: false },
              { description: "layout: flex", is_valid: false },
            ],
          },
        },
        {
          statement: "Quelle propriété aligne les enfants sur l'axe transversal en Flexbox ?",
          level_id: intermediaire.id,
          answers: {
            create: [
              { description: "justify-content", is_valid: false },
              { description: "align-items", is_valid: true },
              { description: "flex-direction", is_valid: false },
              { description: "align-content", is_valid: false },
            ],
          },
        },
      ],
    },
  },
});

// ── Quiz Python ───────────────────────────────────────────────────────────────
const quizPython = await prisma.quiz.create({
  data: {
    title: "Python avancé",
    description: "Décorateurs, générateurs et programmation fonctionnelle en Python.",
    published_at: new Date(),
    author_id: charlie.id,
    tags: { create: [{ tag_id: tagPython.id }] },
    questions: {
      create: [
        {
          statement: "Qu'est-ce qu'un décorateur en Python ?",
          anecdote: "Les décorateurs sont massivement utilisés dans Flask (@app.route) et Django (@login_required).",
          level_id: expert.id,
          answers: {
            create: [
              { description: "Une fonction qui modifie une autre fonction", is_valid: true },
              { description: "Un type de variable spéciale", is_valid: false },
              { description: "Une classe abstraite", is_valid: false },
              { description: "Un module intégré", is_valid: false },
            ],
          },
        },
        {
          statement: "Quel mot-clé crée un générateur en Python ?",
          level_id: expert.id,
          answers: {
            create: [
              { description: "return", is_valid: false },
              { description: "yield", is_valid: true },
              { description: "generate", is_valid: false },
              { description: "async", is_valid: false },
            ],
          },
        },
      ],
    },
  },
});

// ── Tentatives ────────────────────────────────────────────────────────────────
await Promise.all([
  prisma.attempt.create({ data: { user_id: alice.id, quiz_id: quizJS.id, score: 2, score_max: 3 } }),
  prisma.attempt.create({ data: { user_id: alice.id, quiz_id: quizCSS.id, score: 2, score_max: 2 } }),
  prisma.attempt.create({ data: { user_id: bob.id, quiz_id: quizJS.id, score: 1, score_max: 3 } }),
  prisma.attempt.create({ data: { user_id: bob.id, quiz_id: quizCSS.id, score: 2, score_max: 2 } }),
  prisma.attempt.create({ data: { user_id: charlie.id, quiz_id: quizJS.id, score: 3, score_max: 3 } }),
  prisma.attempt.create({ data: { user_id: charlie.id, quiz_id: quizPython.id, score: 2, score_max: 2 } }),
]);

console.log(`📊 Seed complet : 3 quiz, 7 questions, 3 users, 6 tags, 6 tentatives.`);

await prisma.$disconnect();
