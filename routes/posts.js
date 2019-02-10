const express = require('express');
const router = express.Router();

const client = require('../db/index');
const postList = require('../views/postList');
const postDetails = require('../views/postDetails');
const addPost = require('../views/addPost');

const baseQuery = `
  SELECT 
      posts.*,
      users.name,
      CASE 
        WHEN (counting.upvotes > 0) THEN counting.upvotes
        ELSE 0
      END AS upvotes
  FROM posts
  INNER JOIN users
      ON posts.userid = users.id
  LEFT JOIN
      (SELECT
          postid,
          COUNT(*) AS upvotes
      FROM upvotes
      GROUP BY postid) AS counting
      ON posts.id = counting.postid\n
`;

router.post('/', (req, res, next) => {
  const { name, title, content } = req.body;

  // add user if he or she does not exist in the database
  client
    .query(`SELECT name FROM users`)
    .then(data => {
      let exist = data.rows.reduce((acc, user) => {
        if (user.name === name) return acc || true;
        else return acc;
      }, false);
      console.log(exist);
      if (!exist) {
        client.query(
          `
            INSERT INTO users (name)
            VALUES ('${name}');
          `
        );
      }
      // INSERT POST INTO DATABASE
      const sql = `
        INSERT INTO posts (userid, title, content)
        VALUES (
          (SELECT id FROM users WHERE name = '${name}'),
          '${title}',
          '${content}'
        );
      `;

      client
        .query(sql)
        .then(() => {
          return client.query(`
            SELECT * 
            FROM posts
            WHERE posts.userid = (SELECT users.id
            FROM users
            WHERE users.name = '${name}')
            ORDER BY posts.date DESC
            LIMIT 1;
          `);
        })
        .then(data => {
          let id = data.rows[0].id;
          res.redirect(`/posts/${id}`);
        })
        .catch(e => next(e));
    })
    .catch(e => next(e));
});

router.get('/', (req, res, next) => {
  client
    .query(baseQuery + `ORDER BY upvotes DESC`)
    .then(data => res.send(postList(data.rows)))
    .catch(e => next(e));
});

router.get('/add', (req, res) => {
  res.send(addPost());
});

router.get('/:id', (req, res, next) => {
  client
    .query(baseQuery + 'WHERE posts.id = $1', [req.params.id])
    .then(data => data.rows[0])
    .then(post => res.send(postDetails(post)))
    .catch(e => next(e));
});

module.exports = router;
