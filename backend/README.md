## Utilisation 

Pour la connection à MongoDB:  
Creez un fichier .env, entrez votre uri comme dans le fichier.env.template   
### `DATABASE_URL=mongodb+srv://<id>:<password><cluster-name>.5zfyfee.mongodb.net/?retryWrites=true&w=majority&appName=<cluster-name>`  

Pour l'authentification:  
Dans le fichier fichier .env, entrez votre token comme dans le fichier.env.template      
### `secretToken = "NLnBJDCVXyX4zYCvVVU0tkA4baZHz3ltajDBf9wOpShdgS9EKy//ndW4KDNKQgoeB"`    

### `cd backend`
### `yarn` ou `npm install`
### `nodemon`

Possible ajustement nécéssaire:  
### `npm install --include=optional sharp` ou `yarn add sharp --ignore-engines`