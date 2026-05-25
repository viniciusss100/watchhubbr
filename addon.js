require('dotenv').config()
const express = require('express')
const axios = require('axios')

const TMDB_KEY = process.env.TMDB_KEY
const app = express()

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  next()
})

app.get('/manifest.json', (req, res) => {
  res.json({
    id: 'br.streaming.availability',
    version: '1.1.0',
    name: 'Onde Assistir BR',
    description: 'Mostra em qual streaming a mídia está disponível no Brasil',
    resources: ['stream'],
    types: ['movie', 'series'],
    idPrefixes: ['tt'],
    catalogs: []
  })
})

// Retorna { webUrl, appUri, name } para cada provider_id
function getProviderInfo(providerId, encodedTitle) {
  const p = {
    8: {    // Netflix
      name: 'Netflix',
      webUrl: `https://www.netflix.com/search?q=${encodedTitle}`,
      appUri: `nflx://www.netflix.com/search?q=${encodedTitle}`
    },
    1796: { // Netflix com anúncios
      name: 'Netflix',
      webUrl: `https://www.netflix.com/search?q=${encodedTitle}`,
      appUri: `nflx://www.netflix.com/search?q=${encodedTitle}`
    },
    337: {  // Disney+
      name: 'Disney+',
      webUrl: `https://www.disneyplus.com/search?q=${encodedTitle}`,
      appUri: `disneyplus://search?q=${encodedTitle}`
    },
    119: {  // Prime Video
      name: 'Prime Video',
      webUrl: `https://www.primevideo.com/search?phrase=${encodedTitle}`,
      appUri: `aiv://aiv/search?phrase=${encodedTitle}`
    },
    1899: { // Max
      name: 'Max',
      webUrl: `https://play.max.com/search?q=${encodedTitle}`,
      appUri: `max://search?q=${encodedTitle}`
    },
    1825: { // Max (canal Amazon)
      name: 'Max',
      webUrl: `https://play.max.com/search?q=${encodedTitle}`,
      appUri: `max://search?q=${encodedTitle}`
    },
    307: {  // Globoplay
      name: 'Globoplay',
      webUrl: `https://globoplay.globo.com/busca/?q=${encodedTitle}`,
      appUri: `globoplay://busca/?q=${encodedTitle}`
    },
    350: {  // Apple TV+
      name: 'Apple TV+',
      webUrl: `https://tv.apple.com/br/search?term=${encodedTitle}`,
      appUri: `videos://search?term=${encodedTitle}`
    },
    531: {  // Paramount+
      name: 'Paramount+',
      webUrl: `https://www.paramountplus.com/br/search/?q=${encodedTitle}`,
      appUri: `paramountplus://search?q=${encodedTitle}`
    },
    2: {    // Apple TV (compra/aluguel)
      name: 'Apple TV',
      webUrl: `https://tv.apple.com/br/search?term=${encodedTitle}`,
      appUri: `videos://search?term=${encodedTitle}`
    }
  }
  return p[providerId] || null
}

app.get('/stream/:type/:id.json', async (req, res) => {
  try {
    const { type, id } = req.params
    const imdbId = id.split(':')[0]

    const find = await axios.get(`https://api.themoviedb.org/3/find/${imdbId}`, {
      params: { api_key: TMDB_KEY, external_source: 'imdb_id', language: 'pt-BR' }
    })

    const results = type === 'movie' ? find.data.movie_results : find.data.tv_results
    if (!results.length) return res.json({ streams: [] })

    const tmdbId = results[0].id
    const title = results[0].title || results[0].name
    const endpoint = type === 'movie' ? 'movie' : 'tv'
    const encodedTitle = encodeURIComponent(title)

    const { data } = await axios.get(`https://api.themoviedb.org/3/${endpoint}/${tmdbId}/watch/providers`, {
      params: { api_key: TMDB_KEY }
    })

    const br = data.results?.BR
    if (!br) return res.json({ streams: [] })

    const seen = new Set()
    const streams = []

    for (const p of (br.flatrate || [])) {
      if (seen.has(p.provider_id)) continue
      seen.add(p.provider_id)

      const info = getProviderInfo(p.provider_id, encodedTitle)
      const providerName = info ? info.name : p.provider_name

      // Stream com URI do app (abre o app diretamente no mobile)
      if (info && info.appUri) {
        streams.push({
          name: providerName,
          description: `📱 Abrir no app`,
          externalUrl: info.appUri
        })
      }

      // Stream com URL web (fallback para desktop/browser)
      const webUrl = info ? info.webUrl : br.link
      streams.push({
        name: providerName,
        description: `🌐 Abrir no navegador`,
        externalUrl: webUrl
      })
    }

    res.json({ streams })
  } catch (e) {
    console.error(e.message)
    res.json({ streams: [] })
  }
})

const PORT = process.env.PORT || 7000
app.listen(PORT, () => console.log(`Addon rodando em http://localhost:${PORT}`))
