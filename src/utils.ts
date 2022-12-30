import { readFile } from 'fs/promises';
import { parse } from 'yaml';
import axios, { AxiosRequestConfig } from 'axios';
import qs from 'qs';

export const retryRequest = async <T = any>(
  request: (retryCount?: number) => Promise<T>,
  onRetry?: () => void,
  retryCount = 0
): Promise<T> => {
  try {
    return await request(retryCount);
  } catch (error) {
    if (retryCount >= 5) {
      throw error;
    }
    if (onRetry) {
      onRetry();
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return await retryRequest(request, onRetry, retryCount + 1);
  }
};

export const post = async <T = any>(
  data: any,
  options: AxiosRequestConfig & {
    proxyToken?: string;
    proxyType?: 'premium_proxy' | 'stealth_proxy';
  } = {}
) => {
  return await axios.post<T>(
    options.proxyToken
      ? `https://app.scrapingbee.com/api/v1?${qs.stringify({
          url: 'https://api.ticketswap.com/graphql/public',
          api_key: options.proxyToken,
          [options.proxyType || 'proxy_type']: !!options.proxyType || undefined,
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
