import 'dotenv/config';
import inquirer from 'inquirer';
import inquirerPrompt from 'inquirer-autocomplete-prompt';
import {
  getEventTicketTypes,
  searchEvent,
  watchTickets,
} from './ticketswap-api';

async function cli() {
  inquirer.registerPrompt('autocomplete', inquirerPrompt);
  try {
    const answers = await inquirer.prompt([
      {
        type: 'autocomplete',
        name: 'eventId',
        message: 'Search for an event',
        source: (_: any, input?: string) => searchEvent(input),
      } as any,
      {
        type: 'checkbox',
        name: 'ticketTypes',
        message: 'Select ticket type(s)',
        choices: async ({ eventId }: { eventId: string }) =>
          (
            await getEventTicketTypes(eventId)
          ).map((ticket) => ({ ...ticket, value: ticket.value.id })),
      },
      {
        type: 'number',
        name: 'maxPrice',
        message: 'Max price (leave blank for no limit)',
        default: undefined,
      },
    ]);
    await watchTickets(answers.eventId, answers.ticketTypes, answers.maxPrice);
  } catch (error) {
    console.log(error);
  }
}

cli();
