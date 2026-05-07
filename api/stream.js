const axios = require('axios')

const TMDB_KEY = process.env.TMDB_KEY

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  try {
    const { type, id } = req.query
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

    const seen = new Set()
    const streams = (br.flatrate || [])
      .filter(p => !seen.has(p.provider_id) && seen.add(p.provider_id))
      .map(p => ({
        name: p.provider_name,
        type: 'other',
        title: `Disponível em: ${p.provider_name}`,
        externalUrl: br.link
      }))

    res.json({ streams })
  } catch (e) {
    res.json({ streams: [] })
  }
}
