const express = require("express");
var bodyParser = require("body-parser");
var cookieParser = require("cookie-parser");
var session = require("express-session");

const todoService = require("./services/todo.service");

const app = express();
const port = 3000;
const VIEW_DIR = `${__dirname}/views`;

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(
  session({
    secret: 'puki muki',
    resave: true,
    saveUninitialized: true,
    cookie: {
      secure: false,
      maxAge: 60 * 60 * 1000
    }
  })
);

app.get("/", (req, res) => {
  var visitCount = req.cookies.visitCount || 0;
  visitCount++;
  res.cookie("visitCount", visitCount);

  const data = {
    captcha: todoService.makeCaptcha()
  }

  req.session.captchaSum = data.captcha.num1 + data.captcha.num2;
  res.render(`${VIEW_DIR}/index.ejs`, data);
});

app.get('/todo', (req, res) => {
  const nickname = req.session.nickname;
  todoService.query(nickname).then(todos => {
    const data = {
      title: nickname + ' Todos:',
      todos
    };
    res.render(`${VIEW_DIR}/todos.ejs`, data);
  });
});

app.get('/todo/edit/:todoId?', (req, res) => {
  const todoId = req.params.todoId;
  if (todoId) {
    todoService.getById(todoId).then(todo => {
      res.render(`${VIEW_DIR}/todo-edit.ejs`, { todo });
    });
  } else {
    res.render(`${VIEW_DIR}/todo-edit.ejs`, { todo: {} });
  }
});

app.post('/todo/delete', (req, res) => {
  const { todoId } = req.body;

  todoService.remove(todoId).then(() => {
    res.redirect('/todo');
  });
});
app.post('/todo/add', (req, res) => {
  const todo = req.body;
  todo.name = req.session.nickname;
  todoService
    .add(todo)
    .then(todo => {
      res.redirect('/todo');
    })
    .catch(err => {
      console.log('ERRRRROR');
    });
});

app.post('/todo/update', (req, res) => {
  const todo = req.body;
  todoService
    .update(todo)
    .then(todo => {
      res.redirect('/todo');
    })
    .catch(err => {
      console.log('ERRRRROR');
    });
});

app.get('/todo/:todoId', (req, res) => {
  const todoId = req.params.todoId;
  todoService
    .getById(todoId)
    .then(todo => {
      res.render(`${VIEW_DIR}/todo.ejs`, { todo });
    })
    .catch(err => {
      // res.send(err);
    });
});

app.post('/setUser', (req, res) => {
  req.session.nickname = req.body.nickname;

  if (!(+req.body.userAnswer === req.session.captchaSum) || !req.session.nickname) {
    res.redirect('/');
  } else {
    res.redirect('/todo');
  }
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`));
