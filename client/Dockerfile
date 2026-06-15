# === ETAPE 1 ===
# On définit l'image d'origine qu'on va utiliser : ici le client utilise node
# On nomme l'étape 1 "builder" afin que tout le process concernant l'image node soit nommé, pour qu'on puisse se servir du résultat dans l'étape 2
FROM node:22-alpine AS builder

# Définition de l'espace de travail (où ça va se passer dans le container docker)
WORKDIR /app

# On copie à la racine de notre container les fichiers package.json
COPY package*.json ./

# Maintenant qu'on a les package.json et node d'installé, on va pouvoir, installer les packages
# RUN est une commande exécutée PENDANT le build de notre container
RUN npm install

# Les modules installés sont copiés dans notre container
COPY ./ ./

# ARG est une valeur qu'on va pouvoir utiliser PENDANT le build
ARG VITE_API_BASE_URL

# ENV contrairement à ARG est utilisable une fois que le build est créé, pendant le runtime (pendant que le container client tourne)
# Dans notre dockerfile, le $ situé ici permet de dire qu'on utilise une variable, donc VITE_API_BASE_URL à gauche, va recevoir la valeur de la variable VITE_API_BASE_URL définie une ligne au dessus
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL


# On a tout ce qu'il faut pour lancer le build :
RUN npm run build

# === ETAPE 2 ===
# 2ème étape de l'installation : maintenant que nos fichiers ont été build, on a plus besoin de node ou de vite, on va utiliser les fichiers construits présents dans "dist", pour les servir avec nginx

# On récupère l'image nginx
FROM nginx:alpine

# On supprime les fichiers statiques par défaut de nginx, pour les remplacer par la suite par nos fichiers contenus dans "dist"
RUN rm -rf /usr/share/nginx/html/*

# On copie app/dist qui contient le résultat de notre build pour le mettre dans /usr/share/nginx/html qui est l'endroit où nginx s'attend à recevoir le contenu qu'il servira 
COPY --from=builder /app/dist /usr/share/nginx/html

# On expose le port 80
EXPOSE 80

# On rajoute à la commande nginx "-g daemon off" qui permet de désactiver le démarrage de nginx en tache de fond, qui pour docker, l'amènerait à fermer le processus
CMD ["nginx", "-g", "daemon off;"]
