import { getSlackClient } from './client';

const HUB_CHANNEL = process.env.SLACK_DEFAULT_CHANNEL || '#nerra-hub';
const ALERTS_CHANNEL = '#nerra-alerts';

export async function notifyNewCustomer(companyName: string, companyId: string, submitterName: string) {
  const slack = getSlackClient();
  await slack.chat.postMessage({
    channel: HUB_CHANNEL,
    text: `Ny kunde registrert: ${companyName}`,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Ny kunde registrert*\n*Firma:* ${companyName}\n*Kontakt:* ${submitterName}\n<https://nerra-hub.vercel.app/customers/${companyId}|Se kundeprofil>`,
        },
      },
    ],
  });
}

export async function notifyProposalCreated(title: string, agentName: string, companyName: string | null) {
  const slack = getSlackClient();
  const companyText = companyName ? `\n*Kunde:* ${companyName}` : '';
  await slack.chat.postMessage({
    channel: HUB_CHANNEL,
    text: `Nytt forslag: ${title}`,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Nytt forslag fra agent*\n*Tittel:* ${title}\n*Agent:* ${agentName}${companyText}\n<https://nerra-hub.vercel.app/dashboard|Gå til godkjenningskøen>`,
        },
      },
    ],
  });
}

export async function notifyProposalDecided(title: string, decision: 'approved' | 'rejected', decidedBy: string) {
  const slack = getSlackClient();
  const statusText = decision === 'approved' ? 'godkjent' : 'avvist';
  await slack.chat.postMessage({
    channel: HUB_CHANNEL,
    text: `Forslag ${statusText}: ${title}`,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Forslag ${statusText}*\n*Tittel:* ${title}\n*Besluttet av:* ${decidedBy}`,
        },
      },
    ],
  });
}

export async function notifyResearchComplete(companyName: string, companyId: string) {
  const slack = getSlackClient();
  await slack.chat.postMessage({
    channel: HUB_CHANNEL,
    text: `Research ferdig: ${companyName}`,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Research-rapport ferdig*\n*Kunde:* ${companyName}\n<https://nerra-hub.vercel.app/customers/${companyId}|Se kundeprofil>`,
        },
      },
    ],
  });
}

export async function sendAlert(message: string, severity: 'info' | 'warning' | 'critical') {
  const slack = getSlackClient();
  const prefix = severity === 'critical' ? '[KRITISK]' : severity === 'warning' ? '[ADVARSEL]' : '[INFO]';
  await slack.chat.postMessage({
    channel: ALERTS_CHANNEL,
    text: `${prefix} ${message}`,
  });
}
