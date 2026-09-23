const fs = require("fs");
const path = require("path");

const pool = require("./db");


// Migration folders

const MIGRATION_UP_DIR = path.join(
    __dirname,
    "migrations/up"
);


const MIGRATION_DOWN_DIR = path.join(
    __dirname,
    "migrations/down"
);



async function createMigrationTable() {

    await pool.query(`
        CREATE TABLE IF NOT EXISTS schema_migrations (

            version VARCHAR(255) PRIMARY KEY,

            applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

        );
    `);

}



async function getMigrationFiles(directory) {

    if (!fs.existsSync(directory)) {

        throw new Error(
            `Migration directory not found: ${directory}`
        );

    }


    return fs
        .readdirSync(directory)
        .filter(file => file.endsWith(".sql"))
        .sort();

}



async function getAppliedMigrations() {

    const result = await pool.query(
        `
        SELECT version
        FROM schema_migrations
        `
    );


    return new Set(
        result.rows.map(
            row => row.version
        )
    );

}



async function executeMigration(
    file,
    directory
) {


    const filePath = path.join(
        directory,
        file
    );


    const sql = fs.readFileSync(
        filePath,
        "utf-8"
    );


    const client = await pool.connect();


    try {

        await client.query("BEGIN");


        await client.query(sql);


        await client.query(
            `
            INSERT INTO schema_migrations(version)
            VALUES($1)
            `,
            [file]
        );


        await client.query("COMMIT");


        console.log(
            `✓ Applied ${file}`
        );


    } catch(error){


        await client.query("ROLLBACK");

        throw error;


    } finally {


        client.release();

    }

}



async function migrateUp(){

    console.log(
        "Running UP migrations..."
    );


    await createMigrationTable();


    const files =
        await getMigrationFiles(
            MIGRATION_UP_DIR
        );


    const applied =
        await getAppliedMigrations();



    for(const file of files){


        if(applied.has(file)){

            console.log(
                `Skipping ${file}`
            );

            continue;

        }


        await executeMigration(
            file,
            MIGRATION_UP_DIR
        );

    }


    console.log(
        "UP migration completed"
    );

}



async function migrateDown(){

    console.log(
        "Running DOWN migration..."
    );


    await createMigrationTable();



    const result =
        await pool.query(
            `
            SELECT version
            FROM schema_migrations
            ORDER BY applied_at DESC
            LIMIT 1
            `
        );


    if(result.rows.length===0){

        console.log(
            "No migration available"
        );

        return;

    }



    const latest =
        result.rows[0].version;



    const downFile =
        latest.replace(
            ".sql",
            "_down.sql"
        );



    const downPath =
        path.join(
            MIGRATION_DOWN_DIR,
            downFile
        );



    if(!fs.existsSync(downPath)){

        throw new Error(
            `Missing rollback file: ${downFile}`
        );

    }



    const sql =
        fs.readFileSync(
            downPath,
            "utf-8"
        );



    const client =
        await pool.connect();



    try{


        await client.query("BEGIN");


        await client.query(sql);



        await client.query(
            `
            DELETE FROM schema_migrations
            WHERE version=$1
            `,
            [latest]
        );



        await client.query("COMMIT");


        console.log(
            `✓ Rolled back ${latest}`
        );



    }catch(error){


        await client.query("ROLLBACK");

        throw error;


    }finally{

        client.release();

    }

}




async function main(){


    const command =
        process.argv[2];


    try{


        if(command==="down"){

            await migrateDown();

        }
        else{

            await migrateUp();

        }


    }catch(error){


        console.error(
            "Migration error:",
            error.message
        );


        process.exitCode=1;


    }finally{


        await pool.end();


    }

}


main();