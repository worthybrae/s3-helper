import BlobBackground from './components/BlobBackground'
import './globals.css'
import { getServerSession } from "next-auth/next"
import { authOptions } from './api/auth/[...nextauth]/route'
import ClientSessionProvider from './components/ClientSessionProvider'

export default async function RootLayout({ children }) {
  const session = await getServerSession(authOptions)

  return (
    <html lang="en">
      <body>
        <ClientSessionProvider session={session}>
          <BlobBackground />
          {children}
        </ClientSessionProvider>
      </body>
    </html>
  )
}