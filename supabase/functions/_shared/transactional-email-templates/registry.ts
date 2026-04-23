/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'

export interface TemplateEntry {
  component: React.ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  to?: string
  displayName?: string
  previewData?: Record<string, any>
}

import { template as orderReceived } from './order-received.tsx'
import { template as newOrderAlert } from './new-order-alert.tsx'

export const TEMPLATES: Record<string, TemplateEntry> = {
  'order-received': orderReceived,
  'new-order-alert': newOrderAlert,
}
