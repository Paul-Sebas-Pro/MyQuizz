
// axios est un package nous permettant de faire des requêtes http
import axios from "axios";


// on crée notre URL de base
// puis on l'exporte
export const apiBaseUrl = `http://localhost:${process.env.PORT}/api`;

// on crée un requeteur axios
// cette requête axios sera exportée pour être utilisée dans les tests
export const requester = axios.create({
  baseURL: apiBaseUrl,
  validateStatus: () => true // on veut récupérer toutes les requêtes, même si il y a une erreur (afin de les voir dans le test), et pour cela, on utilise le paramètre validateStatus: () => pour que chaque requête renvoie "true"
});