import { NextApiRequest, NextApiResponse } from "next"
import {
  clusterApiUrl,
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js"

// Public key of wallet scanning QR code
type InputData = {
  account: string
}

type GetResponse = {
  label: string
  icon: string
}

export type PostResponse = {
  transaction: string
  message: string
}

export type PostError = {
  error: string
}

// API endpoint
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<GetResponse | PostResponse | PostError>
) {
  if (req.method === "GET") {
    return get(res)
  } else if (req.method === "POST") {
    return await post(req, res)
  } else {
    return res.status(405).json({ error: "Method not allowed" })
  }
}

// "res" is Text and Image that displays when wallet first scans
function get(res: NextApiResponse<GetResponse>) {
  res.status(200).json({
    label: "Store Name",
    icon: "https://solana.com/src/img/branding/solanaLogoMark.svg",
  })
}

// "req" is public key of wallet scanning QR code
// "res" is transaction built for wallet to approve, along with a message
async function post(
  req: NextApiRequest,
  res: NextApiResponse<PostResponse | PostError>
) {
  const { account } = req.body as InputData
  if (!account) {
    res.status(400).json({ error: "No account provided" })
    return
  }

  const { reference } = req.query
  if (!reference) {
    res.status(400).json({ error: "No reference provided" })
    return
  }
  console.log(reference)

  try {
    const postResponse = await buildTransaction(
      new PublicKey(account),
      new PublicKey(reference)
    )
    res.status(200).json(postResponse)
    return
  } catch (error) {
    res.status(500).json({ error: "error creating transaction" })
    return
  }
}

// build the transaction
async function buildTransaction(
  account: PublicKey,
  reference: PublicKey
): Promise<PostResponse> {
  const connection = new Connection(clusterApiUrl("devnet"))

  const { blockhash } = await connection.getLatestBlockhash()

  const transaction = new Transaction({
    recentBlockhash: blockhash,
    feePayer: account,
  })

  const instruction = SystemProgram.transfer({
    fromPubkey: account,
    toPubkey: Keypair.generate().publicKey,
    lamports: 0.001 * LAMPORTS_PER_SOL,
  })

  instruction.keys.push({
    pubkey: reference,
    isSigner: false,
    isWritable: false,
  })

  transaction.add(instruction)

  const serializedTransaction = transaction.serialize({
    requireAllSignatures: false,
  })
  const base64 = serializedTransaction.toString("base64")

  const message = "Message To User Before Approving Transaction Here"

  return {
    transaction: base64,
    message,
  }
}
