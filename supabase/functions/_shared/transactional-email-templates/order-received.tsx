import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Hr, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Velour Walls'

interface OrderReceivedProps {
  customerName?: string
  paintingTitle?: string
  finish?: string
  size?: string
  amountFormatted?: string
  orderId?: string
}

const OrderReceivedEmail = ({
  customerName,
  paintingTitle,
  finish,
  size,
  amountFormatted,
  orderId,
}: OrderReceivedProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your {SITE_NAME} order is confirmed — we're excited for your art journey</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={brand}>VELOUR WALLS</Heading>
        <Hr style={rule} />
        <Heading style={h1}>
          {customerName ? `Thank you, ${customerName}.` : 'Thank you for your order.'}
        </Heading>
        <Text style={text}>
          We're so excited for your art journey and look forward to helping you turn your home
          into a beautiful art gallery. Your order is confirmed — our studio is getting it
          started in the back, ready to be shipped out to you.
        </Text>

        <Section style={card}>
          {paintingTitle && <Text style={cardLine}><strong>Piece:</strong> {paintingTitle}</Text>}
          {finish && <Text style={cardLine}><strong>Finish:</strong> {finish}</Text>}
          {size && <Text style={cardLine}><strong>Size:</strong> {size}</Text>}
          {amountFormatted && <Text style={cardLine}><strong>Authorized:</strong> {amountFormatted}</Text>}
          {orderId && <Text style={cardLineMuted}>Order ref: {orderId}</Text>}
        </Section>

        <Text style={text}>
          You'll receive another note from us when your piece ships, with tracking details so you
          can follow it all the way to your wall. Thank you for letting us be part of your story.
        </Text>

        <Hr style={rule} />
        <Text style={footer}>The {SITE_NAME} Atelier · velourwalls.art</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: OrderReceivedEmail,
  subject: 'Your Velour Walls order is confirmed — welcome to your art journey',
  displayName: 'Order received (customer)',
  previewData: {
    customerName: 'Jordan',
    paintingTitle: 'Gilded Reverie',
    finish: 'High-Gloss Acrylic',
    size: '24×36"',
    amountFormatted: '$420.00',
    orderId: 'a1b2c3',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Georgia, "Times New Roman", serif', color: '#14110f' }
const container = { padding: '32px 28px', maxWidth: '560px', margin: '0 auto' }
const brand = { fontSize: '14px', letterSpacing: '0.32em', fontWeight: 700, color: '#a8801f', margin: '0 0 12px', fontFamily: 'Arial, sans-serif' }
const rule = { borderColor: '#e6dfd2', margin: '12px 0 24px' }
const h1 = { fontSize: '24px', fontWeight: 400, color: '#14110f', margin: '0 0 18px', lineHeight: 1.3 }
const text = { fontSize: '15px', color: '#3a342d', lineHeight: 1.65, margin: '0 0 18px' }
const card = { backgroundColor: '#faf6ee', border: '1px solid #e6dfd2', padding: '18px 20px', margin: '20px 0', borderRadius: '4px' }
const cardLine = { fontSize: '14px', color: '#14110f', margin: '4px 0', fontFamily: 'Arial, sans-serif' }
const cardLineMuted = { fontSize: '12px', color: '#8a7f6f', margin: '10px 0 0', fontFamily: 'Arial, sans-serif' }
const footer = { fontSize: '12px', color: '#8a7f6f', margin: '20px 0 0', textAlign: 'center' as const, letterSpacing: '0.08em' }
