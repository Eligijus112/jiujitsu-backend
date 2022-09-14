# Controlles in nodejs 

A controller in nodejs is a function that is called when a route is requested. It is used to handle the request and send a response. 

For example if we have a route `/users` and we want to send a response of `Hello World` when the route is requested, we can do it like this: 

```js
// App initiation somewhere above 
// ...

app.get('/users', (req, res) => {
    res.send('Hello World')
})
```

The arrow function 

```
(req, res) => {res.send('Hello World')}
``` 
is the controller.