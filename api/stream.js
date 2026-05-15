const axios = require('axios')

const TMDB_KEY = process.env.TMDB_KEY || '7ab8a2e339d7f3644d075128951597b0'

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
    const title = results[0].title || results[0].name
    const endpoint = type === 'movie' ? 'movie' : 'tv'

    const { data } = await axios.get(`https://api.themoviedb.org/3/${endpoint}/${tmdbId}/watch/providers`, {
      params: { api_key: TMDB_KEY }
    })

    const br = data.results?.BR
    if (!br) return res.json({ streams: [] })

    const getProviderData = (providerId, title) => {
      const encodedTitle = encodeURIComponent(title)
      const providers = {
        8: { // Netflix
          url: `https://www.netflix.com/search?q=${encodedTitle}`,
          uris: [
            { platform: 'android', uri: `nflx://www.netflix.com/search?q=${encodedTitle}` },
            { platform: 'ios', uri: `nflx://www.netflix.com/search?q=${encodedTitle}` }
          ]
        },
        1796: { // Netflix Ads
          url: `https://www.netflix.com/search?q=${encodedTitle}`,
          uris: [
            { platform: 'android', uri: `nflx://www.netflix.com/search?q=${encodedTitle}` },
            { platform: 'ios', uri: `nflx://www.netflix.com/search?q=${encodedTitle}` }
          ]
        },
        337: { // Disney+
          url: `https://www.disneyplus.com/search?q=${encodedTitle}`,
          uris: [
            { platform: 'android', uri: `disneyplus://search?q=${encodedTitle}` },
            { platform: 'ios', uri: `disneyplus://search?q=${encodedTitle}` }
          ]
        },
        119: { // Prime Video
          url: `https://www.amazon.com.br/s?k=${encodedTitle}&i=instant-video`,
          uris: [
            { platform: 'android', uri: `aiv://aiv/search/?query=${encodedTitle}` },
            { platform: 'ios', uri: `aiv://aiv/search/?query=${encodedTitle}` }
          ]
        },
        1899: { // Max
          url: `https://www.max.com/search/${encodedTitle}/`,
          uris: [
            { platform: 'android', uri: `wbdstreaming://search?q=${encodedTitle}` },
            { platform: 'ios', uri: `wbdstreaming://search?q=${encodedTitle}` }
          ]
        },
        1825: { // Max Amazon Channel
          url: `https://www.max.com/search/${encodedTitle}/`,
          uris: [
            { platform: 'android', uri: `wbdstreaming://search?q=${encodedTitle}` },
            { platform: 'ios', uri: `wbdstreaming://search?q=${encodedTitle}` }
          ]
        },
        307: { // Globoplay
          url: `https://globoplay.globo.com/busca/?q=${encodedTitle}`,
          uris: [
            { platform: 'android', uri: `globoplay://busca/?q=${encodedTitle}` },
            { platform: 'ios', uri: `globoplay://busca/?q=${encodedTitle}` }
          ]
        },
        350: { // Apple TV+
          url: `https://tv.apple.com/br/search?term=${encodedTitle}`,
          uris: [
            { platform: 'android', uri: `atve://search?term=${encodedTitle}` },
            { platform: 'ios', uri: `atve://search?term=${encodedTitle}` }
          ]
        },
        531: { // Paramount+
          url: `https://www.paramountplus.com/br/search/?q=${encodedTitle}`,
          uris: [
            { platform: 'android', uri: `pplus://search?q=${encodedTitle}` },
            { platform: 'ios', uri: `pplus://search?q=${encodedTitle}` }
          ]
        }
      }
      return providers[providerId] || { url: br.link, uris: [] }
    }

    const seen = new Set()
    const streams = (br.flatrate || [])
      .filter(p => !seen.has(p.provider_id) && seen.add(p.provider_id))
      .map(p => {
        const providerData = getProviderData(p.provider_id, title)
        return {
          name: 'Onde Assistir BR',
          type: 'other',
          title: `Assistir no ${p.provider_name}`,
          externalUrl: providerData.url,
          externalUris: providerData.uris
        }
      })

    res.json({ streams })
  } catch (e) {
    res.json({ streams: [] })
  }
}
