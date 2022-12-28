import { readFile } from 'fs/promises';
import { parse } from 'yaml';
import axios, { AxiosRequestConfig } from 'axios';
import qs from 'qs';

export const post = async <T = any>(
  data: any,
  options: AxiosRequestConfig & { proxyToken?: string } = {}
) => {
  return await axios.post<T>(
    options.proxyToken
      ? `https://app.scrapingbee.com/api/v1?${qs.stringify({
          url: 'https://api.ticketswap.com/graphql/public',
          api_key: options.proxyToken,
        })}`
      : 'https://api.ticketswap.com/graphql/public',
    data,
    {
      headers: {
        accept: '*/*',
        'accept-encoding': 'gzip, deflate, br',
        'accept-language': 'en',
        'content-type': 'application/json',
        dnt: 1,
        origin: 'https://www.ticketswap.com',
        referer: 'https://www.ticketswap.com/',
        'sec-ch-ua':
          '"Not?A_Brand";v="8", "Chromium";v="108", "Google Chrome";v="108"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': 'macOS',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-site',
        'user-agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
        ...options.headers,
      },
    }
  );
};

export const getScrapingBeeTokens = async (
  filePath: string
): Promise<string[]> => {
  return (parse(await readFile(filePath, 'utf8'))?.tokens as string[]) ?? [];
};
