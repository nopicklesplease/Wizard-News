const pg = require('pg');
const client = new pg.Client(process.env.DATABASE_URL || 'postgres://localhost/wizard_news_db');

const express = require('express');
const app = express();

const port = process.env.PORT || 3000;

app.get('/', async(req, res, next) =>{
  try{
    const SQL = `
      SELECT users.id, users.name, posts.id AS "postId", posts.title AS "postTitle"
      FROM users
      LEFT JOIN posts
      ON posts."userId" = users.id
    `;

    const response = await client.query(SQL);
    const rows = response.rows;
    const data = {};
      rows.forEach(row =>{
        if(!data[row.id]){
          data[row.id] = { id: row.id, name: row.name, posts: []}
        }
        if(!row.postTitle){
          data[row.id].posts.push({ id: row.postId, title: row.postTitle })
        }
      });

      console.log(data);
      const users = Object.values(data);

    res.send(`
    <html>
    <head>
    <title>Wizard News</title>
    </head>
    <body>
      <h1>Wizard News</h1>
        <ul>
          ${
            users.map(user =>{
              return `
              <li>
              <a href="/users/${user.id}">${user.name}</a>
                <ul>
                  ${
                    user.posts
                  }
                </ul>
              </li>
              `
            }).join('')
          }
        </ul>
    </body>
    </html>
    
    
    `)
  } catch (ex){
    next(ex);
  }
})

app.listen(port, async()=> {
  try {
    console.log(`listening on port ${port}`);
    await client.connect();
    const SQL = `
      DROP TABLE IF EXISTS posts;
      DROP TABLE IF EXISTS users;

      CREATE TABLE users(
        id SERIAL PRIMARY KEY,
        name VARCHAR(100)
      );

      CREATE TABLE posts(
        id SERIAL PRIMARY KEY,
        title VARCHAR(100),
        content TEXT,
        "userId" INTEGER REFERENCES users(id)
      );
        INSERT INTO users(name) VALUES('moe');
        INSERT INTO users(name) VALUES('larry');
        INSERT INTO users(name) VALUES('lucy');

        INSERT INTO posts(title, content, "userId") VALUES ('I love SQL', 'I love SQL - Content', (
          SELECT id
          FROM users
          WHERE name = 'moe'
        ));

        INSERT INTO posts(title, content, "userId") VALUES ('I really love SQL', 'I really love SQL - Content', (
          SELECT id
          FROM users
          WHERE name = 'moe'
        ));

        INSERT INTO posts(title, content, "userId") VALUES ('I love joins!', 'I love joins! - Content', (
          SELECT id
          FROM users
          WHERE name = 'lucy'
        ));

        
    `
    await client.query(SQL);
  }
  catch(ex){
    console.log(ex);
  }
});
