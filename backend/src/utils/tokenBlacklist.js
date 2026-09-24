const pool = require("../database/db");


const addToBlacklist = async(
    token,
    expiresAt
)=>{


await pool.query(

`
INSERT INTO token_blacklist
(
token,
expires_at
)

VALUES($1,$2)

ON CONFLICT DO NOTHING

`,
[
token,
expiresAt
]

);


};



const isBlacklisted = async(token)=>{


const result =
await pool.query(

`
SELECT id
FROM token_blacklist
WHERE token=$1
`,
[token]

);


return result.rows.length>0;


};



module.exports={
    addToBlacklist,
    isBlacklisted
};