const express = require('express')
const app = express()
const pg = require('pg')
const client = new pg.Client(process.env.DATABASE_URL || 'postgres://localhost/acme_notes_categories_db')
const port = process.env.PORT || 3000

app.use(express.json())
app.use(require('morgan')('dev'))

app.get('/api/employees', async (req, res, next) => {
    try {
        const SQL = `
            SELECT * FROM employees
        `
        const response = await client.query(SQL)
        res.send(response.rows)
    } catch (ex) {
        next(ex)
    }
})

app.get('/api/departments', async (req, res, next) => {
    try {
        const SQL = `
            SELECT * FROM departments
        `
        const response = await client.query(SQL)
        res.send(response.rows)
    } catch (ex) {
        next(ex)
    }
})

app.post('/api/employees', async (req, res, next) => {
    try {
        const SQL = `
        INSERT INTO employees(name, title, department_id)
        VALUES($1, $2, $3)
        RETURNING *
      `
        const response = await client.query(SQL, [req.body.name, req.body.title, req.body.department_id])
        res.send(response.rows[0])
    } catch (ex) {
        next(ex)
    }
})

app.put('/api/employees/:id', async (req, res, next) => {
    try {
        const SQL = `
        UPDATE employees
        SET name=$1, title=$2, department_id=$3, updated_at= now()
        WHERE id=$4 RETURNING *
      `
        const response = await client.query(SQL, [
            req.body.name,
            req.body.title,
            req.body.department_id,
            req.params.id
        ])
        res.send(response.rows[0])
    } catch (ex) {
        next(ex)
    }
})

app.delete('/api/employees/:id', async (req, res, next) => {
    try {
        const SQL = `
        DELETE from employees
        WHERE id = $1
      `
        const response = await client.query(SQL, [req.params.id])
        res.sendStatus(204)
    } catch (ex) {
        next(ex)
    }
})


const init = async () => {
    try {
        await client.connect();
        console.log('connected to database');
        let SQL = `
            DROP TABLE IF EXISTS employees;
            DROP TABLE IF EXISTS departments;
            CREATE TABLE departments(
                id SERIAL PRIMARY KEY,
                name VARCHAR(100)
            );
            CREATE TABLE employees(
                id SERIAL PRIMARY KEY,
                created_at TIMESTAMP DEFAULT now(),
                updated_at TIMESTAMP DEFAULT now(),
                name VARCHAR(100) NOT NULL,
                title VARCHAR(50) NOT NULL,
                department_id INTEGER REFERENCES departments(id) NOT NULL
            );
        `;
        await client.query(SQL);
        console.log('tables created');
        SQL = `
            INSERT INTO departments(name) VALUES('Lab'), ('Medical'), ('Admin');
            INSERT INTO employees(name, title, department_id) VALUES('Bob Yohnka', 'Software Engineer', 1), ('John Doe', 'Doctor', 2), ('Jane Doe', 'Accountant', 3);   
        `;
        await client.query(SQL);
        console.log('data seeded');

        app.listen(port, () => console.log(`listening on port ${port}`));
    } catch (err) {
        console.error('Error seeding data', err);
    }
};

init();