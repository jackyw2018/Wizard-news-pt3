-- write a query that returns the latest post of a given user
-- input: username
-- 1) return the userid base on the username
-- 2) use the username to return his or her posts
-- 3) limit 1 order by desc 

-- SELECT users.id
-- FROM users
-- WHERE users.name = 'Hetty';

-- SELECT * 
-- FROM posts
-- WHERE posts.userid = (SELECT users.id
-- FROM users
-- WHERE users.name = 'Hetty')
-- ORDER BY posts.date DESC
-- LIMIT 1;


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
    ORDER BY upvotes DESC;
