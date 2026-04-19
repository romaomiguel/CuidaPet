import express from 'express';
import routes from './route.js';
import Path from 'path';

const app = express();




app.use(express.urlencoded({ extended: true }));
app.use(express.static(Path.resolve('./public')))
app.set('views', Path.resolve('./src/views'))
app.set('view engine', 'ejs')

app.use(routes)

app.listen(3000, () => {
console.log("Acessar: http://localhost:3000")
console.log("Servidor executando na porta: 3000")})