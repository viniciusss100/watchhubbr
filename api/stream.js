const axios = require('axios')
const TMDB_KEY = process.env.TMDB_KEY

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  try {
    const { type, id } = req.query
    const imdbId = id.split(':')[0]

    const find = await axios.get(`https://api.themoviedb.org/3/find/${imdbId}`, {
      params: { api_key: TMDB_KEY, external_source: 'imdb_id', language: 'pt-BR' }
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

    const getAppUris = (providerId, title) => {
      const encodedTitle = encodeURIComponent(title)
      const uris = {
        8:    [{ platform: 'android', uri: `nflx://www.netflix.com/search?q=${encodedTitle}` }, { platform: 'ios', uri: `nflx://www.netflix.com/search?q=${encodedTitle}` }],
        1796: [{ platform: 'android', uri: `nflx://www.netflix.com/search?q=${encodedTitle}` }, { platform: 'ios', uri: `nflx://www.netflix.com/search?q=${encodedTitle}` }],
        337:  [{ platform: 'android', uri: `disneyplus://search?q=${encodedTitle}` }, { platform: 'ios', uri: `disneyplus://search?q=${encodedTitle}` }],
        119:  [{ platform: 'android', uri: `primevideo://search?q=${encodedTitle}` }, { platform: 'ios', uri: `primevideo://search?q=${encodedTitle}` }],
        1899: [{ platform: 'android', uri: `wbdstreaming://search?q=${encodedTitle}` }, { platform: 'ios', uri: `wbdstreaming://search?q=${encodedTitle}` }],
        1825: [{ platform: 'android', uri: `wbdstreaming://search?q=${encodedTitle}` }, { platform: 'ios', uri: `wbdstreaming://search?q=${encodedTitle}` }],
        307:  [{ platform: 'android', uri: `globoplay://busca/?q=${encodedTitle}` }, { platform: 'ios', uri: `globoplay://busca/?q=${encodedTitle}` }],
        350:  [{ platform: 'android', uri: `atve://search?term=${encodedTitle}` }, { platform: 'ios', uri: `atve://search?term=${encodedTitle}` }],
        531:  [{ platform: 'android', uri: `pplus://search?q=${encodedTitle}` }, { platform: 'ios', uri: `pplus://search?q=${encodedTitle}` }],
      }
      return uris[providerId] || []
    }

    const seen = new Set()
    const streams = (br.flatrate || [])
      .filter(p => !seen.has(p.provider_id) && seen.add(p.provider_id))
      .map(p => ({
        name: 'Onde Assistir BR',
        type: 'other',
        title: `Assistir no ${p.provider_name}`,
        externalUrl: br.link,
        externalUris: getAppUris(p.provider_id, results[0].title || results[0].name)
      }))

    res.json({ streams })
  } catch (e) {
    res.json({ streams: [] })
  }
}
