# Routes in nodejs 

A `route` in nodejs is a combination of a `path` and a `controller`. It is used to handle requests to a specific path. 

The `path` is the part of the url that comes after the domain name. For example if we have a route `/users` and our domain name is `http://localhost:3000`, then the full API url is `http://localhost:3000/users` where: 

* `http://localhost:3000` is the domain name.
* `/users` is the path.

A route cannot exist without a controller. A controller is a function that is called when a route is requested. It is used to handle the request and send a response.

See the `controllers.md` section for more information on controllers.