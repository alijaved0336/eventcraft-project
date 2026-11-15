import React from 'react';
import { render } from '@react-email/render';
import {
  Html, Body, Container, Heading,
  Text, Section, Row, Column, Hr, Img
} from '@react-email/components';
import QRCode from 'qrcode';
import { TicketConfirmationJobData } from '../jobs/email.job';

/**
 * Renders the ticket confirmation email to a HTML string.
 */
export async function renderTicketConfirmationEmail(
  data: TicketConfirmationJobData
): Promise<string> {
  // Generate QR codes as base64 data URIs so they render
  // even when email clients block external images
  const ticketsWithQR = await Promise.all(
    data.tickets.map(async (ticket) => ({
      ...ticket,
      qrDataUrl: await QRCode.toDataURL(ticket.qrToken, { width: 400, margin: 2 }),
    }))
  );

  const formattedDate = new Date(data.eventDate).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  const formattedTotal = (data.totalPaid / 100).toFixed(2);

  const html = await render(
    <Html lang="en">
      <Body style={{ fontFamily: 'sans-serif', background: '#f9fafb', margin: 0 }}>
        <Container style={{ maxWidth: 600, margin: '0 auto', background: '#fff', padding: 32, borderRadius: 8 }}>

          {/* Header */}
          <Heading style={{ color: '#111827', fontSize: 24, marginBottom: 16 }}>
            You're going to {data.eventTitle}! 🎉
          </Heading>
          <Text style={{ color: '#6b7280', fontSize: 16 }}>
            Hi {data.attendeeName}, your booking is confirmed. Here are your tickets.
          </Text>

          <Hr style={{ margin: '24px 0' }} />

          {/* Event Details */}
          <Section>
            <Text style={{ margin: '4px 0' }}><strong>📅 Date:</strong> {formattedDate}</Text>
            <Text style={{ margin: '4px 0' }}><strong>📍 Location:</strong> {data.eventLocation}</Text>
            <Text style={{ margin: '4px 0' }}><strong>🧾 Order ID:</strong> #{data.orderId}</Text>
          </Section>

          <Hr style={{ margin: '24px 0' }} />

          {/* One block per ticket */}
          {ticketsWithQR.map((ticket, index) => (
            <Section
              key={ticket.issuanceId}
              style={{ background: '#f3f4f6', borderRadius: 12, padding: 20, marginBottom: 16 }}
            >
              <Row>
                <Column style={{ verticalAlign: 'middle' }}>
                  <Text style={{ fontWeight: 'bold', fontSize: 18, margin: 0 }}>
                    Ticket {index + 1}
                  </Text>
                  <Text style={{ color: '#111827', fontWeight: 'bold', margin: '4px 0' }}>
                    {ticket.ticketTierName}
                  </Text>
                  {ticket.seatInfo && (
                    <Text style={{ color: '#6b7280', margin: '4px 0' }}>
                      Seat: {ticket.seatInfo}
                    </Text>
                  )}
                  <Text style={{ color: '#9ca3af', fontSize: 12, margin: '8px 0 0' }}>
                    ID: {ticket.issuanceId}
                  </Text>
                </Column>
                <Column align="right" style={{ verticalAlign: 'middle' }}>
                  <Img
                    src={ticket.qrDataUrl}
                    width={110}
                    height={110}
                    alt={`QR code for ticket ${index + 1}`}
                    style={{ borderRadius: 8 }}
                  />
                </Column>
              </Row>
            </Section>
          ))}

          <Hr style={{ margin: '24px 0' }} />

          {/* Footer */}
          <Text style={{ color: '#9ca3af', fontSize: 12, textAlign: 'center' }}>
            Total paid: {formattedTotal} {data.currency.toUpperCase()} · 
            Powered by EventCraft
          </Text>

        </Container>
      </Body>
    </Html>
  );

  return html;
}
