module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.json({
    id: 'br.streaming.availability',
    version: '1.0.0',
    name: 'Onde Assistir BR',
    description: 'Mostra em qual streaming a mídia está disponível no Brasil',
    resources: ['stream'],
    types: ['movie', 'series'],
    idPrefixes: ['tt'],
    catalogs: []
  })
}
