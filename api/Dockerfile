
# Définir l'image de base depuis laquelle on crée notre image, pour que notre API tourne, on va utilise node
FROM node:22-alpine

# Définir un espace de travail (le répertoire qu'on va utiliser)
# Par convention on choisit généralement un dossier qu'on va appeler /app
WORKDIR /app

# On copie le fichier package.json dans le futur container (si on veut copier le fichier package.json et le package-lock, on utilise le symbole * afin de copier tous les fichier qui commencent par "package", et qui finissent par ".json") - ensuite on spécifie où le copier, ici on veut le copier à la racine du container
COPY package*.json ./

RUN npm install

COPY ./ ./

# Génère le client prisma qui va se connecter à la BDD
# RUN est une commande exécutée PENDANT le build de notre container

RUN npm run db:generate

# Compile le TypeScript
RUN npm run build

CMD ["npm", "run", "docker:start"]