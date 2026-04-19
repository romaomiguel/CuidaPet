export default {
    paginaInicial: (req, res) => {
        res.render("index")
        return;
    },
    trataPost: (req, res) => {
        res.send(req.body)
        return;
    }
}