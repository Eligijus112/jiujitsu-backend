# Authentification

Authentification is a process of verifying the identity of a user. In order to do this we will `JWT` - `Json Web Tokens`. 

From a practical perspective, in order to create a JWT token we need: 

* The token secret
* The piece of data to hash in the token
* The token expiration time

The first and third values are set in the `.env` file.  

Once the token is verified, it is used in all subsequent requests to the API. The token is stored in the `Authorization` header of the request. 