# Ticketswap Bot

If you ever tried to buy tickets on Ticketswap, you know how hard it is to get tickets for popular events. Push notifications are not reliable and you have to be fast to buy tickets. This bot can help you get tickets for popular events.

> I do not support using bots for buying tickets, escpecially for reselling. Ticketswap is actively trying to prevent using bots which I support completely. Basically everything is against TOS, this project is only for educational purposes, use it at your own risk.

You can set the desired ticket type and price range that you want to buy. The bot will then search for tickets and add the cheapest one to your cart. You can then checkout manually on the website.

The bot is written in TypeScript and interacts with Ticketswap's GraphQL API. The API rate limits requests pretty hard, so ScapingBee is used to proxy the search requests to get around this.

## Configuration

You need to create a `.env` file in the root directory of the project with the `TICKETSWAP_TOKEN` variable that can be obtained by logging in to Ticketswap and inspecting the `authorization` header.

You also need to create a `tokens.yml` file in the root directory to store the ScrapingBee token(s).

```yaml
tokens:
  - SCRAPINGBEE_TOKEN_1
  - SCRAPINGBEE_TOKEN_2
  - SCRAPINGBEE_TOKEN_n
```

> You can get a free ScrapingBee token [here](https://app.scrapingbee.com/). The free plan allows 1000 requests which should be enough for an hour or so or searching. You can provide multiple tokens to the bot to rotate through them. Again, this is against TOS, so use at your own risk. The bot will work without a ScrapingBee token, but the rate limit will be hit pretty quickly. You can alternatively use a VPN and change the region manually once the rate limit is hit.

If the API returns an error, the bot will retry the request with a different ScrapingBee token after a delay. If multiple retries fail, it will try a different proxy method (`premium` then `stealth`).

## Usage

You need `node` installed (and `yarn` is recommended)

```bash
yarn install
yarn start
```
