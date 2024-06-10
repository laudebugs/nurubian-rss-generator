import fetch from 'node-fetch';
import xml2js from 'xml2js';
import fs from 'fs';
import metascraper from 'metascraper'
import metascraperDate from 'metascraper-date'
import metascraperDescription from 'metascraper-description'
import metascraperImage from 'metascraper-image'
import metascraperLogo from 'metascraper-logo'
import metascraperPublisher from 'metascraper-publisher'
import metascraperTitle from 'metascraper-title'
import metascraperUrl from 'metascraper-url'

import {RSSFeed, FeedAuthor, FeedItem, FeedItemImage}
 from 'feed-core'

const scraper = metascraper([
    metascraperDate(),
    metascraperDescription(),
    metascraperImage(),
    metascraperLogo(),
    metascraperPublisher(),
    metascraperTitle(),
    metascraperUrl()
])

const nurubianUrl = 'https://nurubian.com/sitemap.xml'

const getSiteMap = () => fetch(nurubianUrl)
type TPath = {
    loc: Array<string>
}
const urlsToFilter = [
    "https://nurubian.com/team",
    "https://nurubian.com/about",
    "https://nurubian.com/index",
    "https://nurubian.com/404",
    "https://nurubian.com/home",
    "https://nurubian.com/home-2",
    "https://nurubian.com/home-2-1",
    "https://nurubian.com/new-page-2",
    "https://nurubian.com/bio-page",
    "https://nurubian.com/join-us"
]

async function run() {
    const siteMap = await getSiteMap()

    const siteMapText = await siteMap.text()

    const parser = new xml2js.Parser()

    const feed = new RSSFeed(
        'Nurubian',
        'https://nurubian.com',
        'As the world of the African diaspora undergoes a rapid evolution, rather than celebrating, promoting, critiquing, and documenting our progress in silos, we wanted to create a space to do it as one. We created The Nurubian to stay up to date with the happenings of our diaspora, and to take control of the narrative of our new story. '
    )
    const feedAuthor = new FeedAuthor('Nurubian', 'admin@nuruba.org', 'https://www.nuruba.institute/')
    feed.author = (feedAuthor)
    feed.updatedAt = new Date()
    feed.feedImage = 'https://images.squarespace-cdn.com/content/v1/635e9774cac71a07377df098/2a87b4ee-6804-4059-b928-1e73f6707130/Artboard+100+copy%402x.png?format=1500w'


    parser.parseString(siteMapText, async (err, result) => {
        if (err) {
            console.error(err)
            return
        }
        
        const links: Array<TPath> = result.urlset.url
            .filter((url: TPath) => !urlsToFilter.includes(url.loc[0]))
        const feedItems: Array<FeedItem> = []
        for await (const url of links) {
            const loc = url.loc[0]
            const response = await fetch(loc)
            const html = await response.text()
            const metadata = await scraper({ html, url: loc })

            const feedItem = new FeedItem(
                metadata.title ?? '',
                loc,
                metadata.description ?? '',
                metadata.description ?? '',
                new Date(metadata.date ?? new Date()),
                new FeedItemImage(metadata.image ?? '',1500,1500),
                [feed.author],
            )
            feedItems.push(feedItem)
        }
        feed.items = feedItems
        const rssFeed = feed.generateRSS()
        // make dir called data
        if (!fs.existsSync('data')) {
            fs.mkdirSync('data')
        }
        fs.writeFileSync('data/feed.xml', rssFeed)
    })
}


run()