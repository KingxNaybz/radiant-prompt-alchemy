import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Hr, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface NewOrderAlertProps {
  customerName?: string
  customerEmail?: string
  paintingTitle?: string
  finish?: string
  size?: string
  amountFormatted?: string
  paymentMethod?: string
  paymentStatus?: string
  shippingAddress?: string
  notes?: string
  orderId?: string
}

const NewOrderAlertEmail = ({
  customerName,
  customerEmail,
  paintingTitle,
  finish,
  size,
  amountFormatted,
  paymentMethod,
  paymentStatus,
  shippingAddress,
  notes,
  orderId,
}: NewOrderAlertProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>New order: {paintingTitle ?? 'Untitled'} — {amountFormatted ?? ''}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={brand}>VELOUR WALLS · STUDIO ALERT</Heading>
        <Hr style={rule} />
        <Heading style={h1}>New order received</Heading>

        <Section style={card}>
          {paintingTitle && <Text style={line}><strong>Piece:</strong> {paintingTitle}</Text>}
          {finish && <Text style={line}><strong>Finish:</strong> {finish}</Text>}
          {size && <Text style={line}><strong>Size:</strong> {size}</Text>}
          {amountFormatted && <Text style={line}><strong>Amount:</strong> {amountFormatted}</Text>}
          {paymentMethod && <Text style={line}><strong>Method:</strong> {paymentMethod}</Text>}
          {paymentStatus && <Text style={line}><strong>Status:</strong> {paymentStatus}</Text>}
        </Section>

        <Heading style={h2}>Customer</Heading>
        <Section style={card}>
          {customerName && <Text style={line}><strong>Name:</strong> {customerName}</Text>}
          {customerEmail && <Text style={line}><strong>Email:</strong> {customerEmail}</Text>}
          {shippingAddress && <Text style={line}><strong>Ship to:</strong> {shippingAddress}</Text>}
          {notes && <Text style={line}><strong>Notes:</strong> {notes}</Text>}
        </Section>

        {orderId && <Text style={muted}>Order ID: {orderId}</Text>}
        <Text style={muted}>Open the studio back office to review and capture payment.</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: NewOrderAlertEmail,
  subject: (d: Record<string, any>) =>
    `🖼️ New order: ${d.paintingTitle ?? 'Untitled'}${d.amountFormatted ? ` — ${d.amountFormatted}` : ''}`,
  displayName: 'New order alert (studio)',
  previewData: {
    customerName: 'Jordan Pierce',
    customerEmail: 'jordan@example.com',
    paintingTitle: 'Gilded Reverie',
    finish: 'High-Gloss Acrylic',
    size: '24×36"',
    amountFormatted: '$420.00',
    paymentMethod: 'card',
    paymentStatus: 'authorized',
    shippingAddress: '123 Studio Ln, Brooklyn NY 11201',
    notes: 'Please pack flat.',
    orderId: 'a1b2c3',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif', color: '#14110f' }
const container = { padding: '28px 24px', maxWidth: '560px', margin: '0 auto' }
const brand = { fontSize: '12px', letterSpacing: '0.3em', fontWeight: 700, color: '#a8801f', margin: '0 0 10px' }
const rule = { borderColor: '#e6dfd2', margin: '10px 0 20px' }
const h1 = { fontSize: '22px', fontWeight: 600, color: '#14110f', margin: '0 0 18px' }
const h2 = { fontSize: '14px', fontWeight: 700, color: '#14110f', margin: '20px 0 8px', letterSpacing: '0.05em' }
const card = { backgroundColor: '#faf6ee', border: '1px solid #e6dfd2', padding: '14px 16px', borderRadius: '4px' }
const line = { fontSize: '14px', color: '#14110f', margin: '4px 0', lineHeight: 1.5 }
const muted = { fontSize: '12px', color: '#8a7f6f', margin: '14px 0 0' }
