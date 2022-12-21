import {
  createQR,
  encodeURL,
  findReference,
  FindReferenceError,
  TransactionRequestURLFields,
} from "@solana/pay"
import { clusterApiUrl, Connection, Keypair } from "@solana/web3.js"
import { useEffect, useRef, useState } from "react"

export default function Home() {
  const [reference, setReference] = useState(Keypair.generate().publicKey)
  const connection = new Connection(clusterApiUrl("devnet"))

  const qrRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // location contains information about the current URL of the webpage
    const { location } = window

    // Create URL Search Params
    const params = new URLSearchParams()

    // Append "reference" publickey, used to identify transaction for confirmation
    params.append("reference", reference.toString())
    console.log(reference.toString())

    // Custom Transaction Request API GetResponse
    // Included params to end of URL
    const apiUrl = `${location.protocol}//${
      location.host
    }/api/checkout?${params.toString()}`

    // Fields of a Solana Pay transaction request URL
    const urlFields: TransactionRequestURLFields = {
      link: new URL(apiUrl),
    }

    // Encode a Solana Pay URL
    const url = encodeURL(urlFields)

    // Create a QR code from a Solana Pay URL
    const qr = createQR(url, 400, "transparent")

    // Set the generated QR code on the QR ref element
    if (qrRef.current) {
      // Clear the inner HTML content of the element, removing any HTML code that was previously contained within it
      qrRef.current.innerHTML = ""
      // Appends the new qr code to the element
      qr.append(qrRef.current)
    }
  }, [reference])

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        // Check for transactions including the reference public key
        const confirmedSignatureInfo = await findReference(
          connection,
          reference,
          {
            finality: "confirmed",
          }
        )
        // Generate new reference public key once transaction confirmed
        setReference(Keypair.generate().publicKey)
        window.alert("Transaction Confirmed")
      } catch (e) {
        // If current reference not found, key checking
        if (e instanceof FindReferenceError) {
          console.log("Not Confirmed:", reference.toString())
          return
        }
        console.error("Unknown error", e)
      }
    }, 1500)
    return () => {
      clearInterval(interval)
    }
  }, [reference])

  return <div ref={qrRef} />
}
