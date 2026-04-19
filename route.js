import express from 'express';
import homeController from './src/controllers/homeController.js';
import servicosController from './src/controllers/servicosController.js';
import comoFuncionaController from './src/controllers/comoFuncionaController.js';
import avaliacaoController from './src/controllers/avaliacaoController.js';

const route = express.Router();

//Rota home
route.get('/', homeController.paginaInicial);
route.post('/', homeController.trataPost)

//Rota cadastro
route.get('/servicos', servicosController.servicos);
route.get('/como-funciona', comoFuncionaController.paginaInicial);
route.get('/avaliacoes', avaliacaoController.avaliacao);

export default route;