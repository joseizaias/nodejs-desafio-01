const express = require('express');
const cors = require('cors');

const { v4: uuidv4 } = require('uuid');

const app = express();

app.use(cors());
app.use(express.json());

const users = [];

function checksExistsUserAccount(request, response, next) {
  const { username } = request.headers;

  const userAccount = users.find( user => user.username === username );

  if ( !userAccount ) {
    return response.status(404).json({
      error: `The username (${ username }) does not exist!`
    });
  }

  request.userAccount = userAccount;
  next();
}

app.post('/users', (request, response) => {
  const { name, username } = request.body;

  const usernameAlreadyExists = users.some( 
    user => user.username === username
  );

  if ( usernameAlreadyExists ) {
    return response.status(400).json({
      error: "username already exists!"
    });
  }

  const user = {
    id: uuidv4(),
    name,
    username,
    todos: []
  }

  users.push( user );

  return response.status(201).json(
    user
  );
});

app.get('/todos', checksExistsUserAccount, (request, response) => {
  const { userAccount } = request;
  
  return response.status(200).json(
    userAccount.todos
  ); 
});

app.post('/todos', checksExistsUserAccount, (request, response) => {
  const { title, deadline } = request.body;
  const { userAccount } = request;

  const todo = {
    id: uuidv4(),
    title,
    done: false,
    deadline: new Date(deadline),
    created_at: new Date()
  }

  userAccount.todos.push( todo );

  return response.status(201).json(
    todo
  );
});

app.put('/todos/:id', checksExistsUserAccount, (request, response) => {
  const { title, deadline } = request.body;
  const { userAccount } = request;
  const { id } = request.params;

  const todoPosition = userAccount.todos.findIndex( todo => todo.id === id );
  
  if ( todoPosition === -1 ) {
    return response.status(404).json({
      error: `The todo with this id: ${ id } does not exist for this user: ${ userAccount.username }`
    });
  }

  userAccount.todos[ todoPosition ].title = title;
  userAccount.todos[ todoPosition ].deadline = new Date(deadline);
  
  return response.status(200).json(
    userAccount.todos[ todoPosition ]
  );
});

app.patch('/todos/:id/done', checksExistsUserAccount, (request, response) => {
  const { userAccount } = request;
  const { id } = request.params;

  const todoPosition = userAccount.todos.findIndex( todo => todo.id === id );

  if ( todoPosition === -1 ) {
    return response.status(404).json({
      error: `The todo with this id: ${ id } does not exist for this user: ${ userAccount.username }`
    });
  }

  userAccount.todos[ todoPosition ].done = true;
  
  return response.status(200).json(
    userAccount.todos[ todoPosition ]
  );
});

app.delete('/todos/:id', checksExistsUserAccount, (request, response) => {
  const { userAccount } = request;
  const { id } = request.params;

  const todoPosition = userAccount.todos.findIndex( todo => todo.id === id );

  if ( todoPosition === -1 ) {
    return response.status(404).json({
      error: `The todo with this id: ${ id } does not exist for this user: ${ userAccount.username }`
    });
  }
  
  userAccount.todos.splice( todoPosition, 1 );

  return response.status(204).json();
});

module.exports = app;
