/**
 * PDF Generation Service
 *
 * Uses @react-pdf/renderer for generating PDFs from React components.
 * This is a placeholder showing the pattern - implement specific PDFs as needed.
 */

// Note: @react-pdf/renderer is imported dynamically to avoid SSR issues
// import { renderToStream, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

export interface PDFOptions {
  title?: string
  author?: string
  subject?: string
  creator?: string
}

/**
 * Generate a PDF buffer from a React PDF component
 * @example
 * const buffer = await generatePDF(<InvoicePDF data={invoiceData} />)
 */
export async function generatePDFBuffer(
  component: React.ReactElement,
  _options?: PDFOptions
): Promise<Buffer> {
  // Dynamic import to avoid SSR issues
  const { renderToBuffer } = await import('@react-pdf/renderer')

  const buffer = await renderToBuffer(component)
  return Buffer.from(buffer)
}

/**
 * Generate a PDF stream for streaming responses
 */
export async function generatePDFStream(
  component: React.ReactElement
): Promise<NodeJS.ReadableStream> {
  const { renderToStream } = await import('@react-pdf/renderer')
  return await renderToStream(component)
}

// Example PDF document template
// Uncomment and customize when needed:
/*
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 40,
  },
  header: {
    fontSize: 24,
    marginBottom: 20,
    fontWeight: 'bold',
  },
  section: {
    margin: 10,
    padding: 10,
  },
  text: {
    fontSize: 12,
    marginBottom: 5,
  },
})

interface InvoiceData {
  invoiceNumber: string
  date: string
  customerName: string
  items: Array<{
    description: string
    quantity: number
    price: number
  }>
  total: number
}

export function InvoicePDF({ data }: { data: InvoiceData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.section}>
          <Text style={styles.header}>Invoice #{data.invoiceNumber}</Text>
          <Text style={styles.text}>Date: {data.date}</Text>
          <Text style={styles.text}>Customer: {data.customerName}</Text>
        </View>
        <View style={styles.section}>
          {data.items.map((item, index) => (
            <Text key={index} style={styles.text}>
              {item.description} x {item.quantity} = ${item.price * item.quantity}
            </Text>
          ))}
        </View>
        <View style={styles.section}>
          <Text style={styles.header}>Total: ${data.total}</Text>
        </View>
      </Page>
    </Document>
  )
}
*/
