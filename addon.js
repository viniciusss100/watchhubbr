const express = require('express')
const axios = require('axios')

const TMDB_KEY = '7ab8a2e339d7f3644d075128951597b0'
const app = express()

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  next()
})

app.get('/manifest.json', (req, res) => {
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
})

app.get('/stream/:type/:id.json', async (req, res) => {
  try {
    const { type, id } = req.params
    const imdbId = id.split(':')[0]

    const find = await axios.get(`https://api.themoviedb.org/3/find/${imdbId}`, {
      params: { api_key: TMDB_KEY, external_source: 'imdb_id' }
    })

    const results = type === 'movie' ? find.data.movie_results : find.data.tv_results
    if (!results.length) return res.json({ streams: [] })

    const tmdbId = results[0].id
    const endpoint = type === 'movie' ? 'movie' : 'tv'

    const { data } = await axios.get(`https://api.themoviedb.org/3/${endpoint}/${tmdbId}/watch/providers`, {
      params: { api_key: TMDB_KEY }
    })

    const br = data.results?.BR
    if (!br) return res.json({ streams: [] })

    const all = [...(br.flatrate || [])]
    const seen = new Set()
    const streams = all
      .filter(p => !seen.has(p.provider_id) && seen.add(p.provider_id))
      .map(p => ({
        name: p.provider_name,
        type: 'other',
        title: `Disponível em: ${p.provider_name}`,
        externalUrl: br.link
      }))

    res.json({ streams })
  } catch (e) {
    console.error(e.message)
    res.json({ streams: [] })
  }
})

app.listen(7000, () => console.log('Addon rodando em http://localhost:7000'))
