import dayjs from 'dayjs';
import ora from 'ora';
import { join } from 'path';
import { getScrapingBeeTokens, post, retryRequest } from './utils';

const SEARCH_EVENTS_QUERY = `
query getSearchResults($query: String!, $first: Int!, $after: String, $type: SearchType) {
  search(query: $query, first: $first, after: $after, type: $type) {
    pageInfo {
      hasNextPage
      endCursor
    }
    edges {
      node {
        ... on EventResult {
          ...eventResult
        }
      }
    }
  }
}

fragment eventResult on EventResult {
  id
  name
  startDate
  endDate
}
`;

type TEventTypeQuery = {
  data: {
    node: {
      types: {
        edges: {
          node: {
            title: string;
            id: string;
            availableListings: {
              edges: {
                node: {
                  id: string;
                  hash: string;
                  price: {
                    totalPriceWithTransactionFee: {
                      amount: number;
                    };
                  };
                };
              }[];
            };
          };
        }[];
      };
    };
  };
};

const EVENT_TYPES_QUERY = `
query getEventStructuredData($id: ID!) {
  node(id: $id) {
    ... on Event {
      types(first: 99) {
        edges {
          node {
            id
            title
            availableListings: listings(filter: {listingStatus: AVAILABLE}) {
              edges {
                node {
                  id
                  hash
                  price {
                    totalPriceWithTransactionFee {
                      amount
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}
`;

const ADD_TO_CART_MUTATION = `
mutation addTicketsToCart($input: AddTicketsToCartInput!) {
  addTicketsToCart(input: $input) {
    errors {
      code
      message
    }
  }
}
`;

export const searchEvent = async (input?: string) => {
  if (!input) return [];
  const { data } = await post({
    operationName: 'getSearchResults',
    query: SEARCH_EVENTS_QUERY,
    variables: { query: input, first: 5, type: 'EVENT' },
  });
  return data.data.search.edges.map((edge: any) => ({
    name: `${edge.node.name} | ${dayjs(edge.node.startDate).format(
      'YYYY.MM.DD'
    )}${
      edge.node.endDate
        ? ' - ' + dayjs(edge.node.startDate).format('YYYY.MM.DD')
        : ''
    }`,
    value: edge.node.id,
    short: edge.node.name,
  }));
};

export const getEventTicketTypes = async (id: string) => {
  const { data } = await post<TEventTypeQuery>({
    operationName: 'getEventStructuredData',
    query: EVENT_TYPES_QUERY,
    variables: { id },
  });
  return data.data.node.types.edges.map(({ node }) => ({
    name: node.title,
    short: node.title,
    value: {
      id: node.id,
      availableListings: node.availableListings.edges.map((edge) => edge.node),
    },
  }));
};

export const watchTickets = async (
  id: string,
  ticketIds: string[],
  maxPrice?: number
) => {
  let ticketsToBuy: string[][] = [];
  const spinner = ora({ text: 'Searching for tickets' }).start();
  let i = 0;
  const tokens = await getScrapingBeeTokens(join(__dirname, '../tokens.yml'));
  while (!ticketsToBuy.length) {
    const { data } = await retryRequest(
      (retryCount = 0) =>
        post<TEventTypeQuery>(
          {
            operationName: 'getEventStructuredData',
            query: EVENT_TYPES_QUERY,
            variables: { id },
          },
          {
            proxyToken: tokens[Math.floor(Math.random() * tokens.length)],
            proxyType:
              retryCount < 2
                ? undefined
                : retryCount < 4
                ? 'premium_proxy'
                : 'stealth_proxy',
          }
        ),
      () => {
        i++;
      }
    );
    spinner.text = `Searching for tickets (${++i} tries)`;
    ticketsToBuy = data.data.node.types.edges
      .filter(
        ({ node: { id, availableListings } }) =>
          ticketIds.includes(id) &&
          availableListings.edges.some(
            ({
              node: {
                price: {
                  totalPriceWithTransactionFee: { amount },
                },
              },
            }) => !maxPrice || amount / 100 <= maxPrice
          )
      )
      .flatMap(
        ({
          node: {
            availableListings: { edges },
          },
        }) => edges.map(({ node }) => [node.id, node.hash])
      );
  }
  spinner.stop();
  await post(
    {
      operationName: 'addTicketsToCart',
      query: ADD_TO_CART_MUTATION,
      variables: {
        input: {
          listingId: ticketsToBuy[0][0],
          listingHash: ticketsToBuy[0][1],
          amountOfTickets: 1,
        },
      },
    },
    {
      headers: {
        authorization: `Bearer ${process.env.TICKETSWAP_TOKEN}`,
      },
    }
  );
  console.log('Ticket added to cart!');
};
