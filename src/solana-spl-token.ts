import {
    createMint,
    getOrCreateAssociatedTokenAccount,
    mintToChecked,
} from "@solana/spl-token";
import { Connection, Keypair} from "@solana/web3.js";
import bs58 from "bs58";
import dotenv from "dotenv";
dotenv.config();

const connection = new Connection(
    process.env.RPC_ENDPOINT || "https://api.devnet.solana.com",
    "confirmed"
);

const feePayer = Keypair.fromSecretKey(bs58.decode(process.env.SECRET_KEY));

async function main() {
    try {
        const mint = await createMint(
            connection,
            feePayer,
            feePayer.publicKey,
            feePayer.publicKey,
            6,
        );
        console.log("Mint created:", mint.toBase58());

        const associatedTokenAccount = await getOrCreateAssociatedTokenAccount(
            connection,
            feePayer,
            mint,
            feePayer.publicKey,
        );
        console.log(
            "Associated token account created:",
            associatedTokenAccount.address.toBase58(),
        );

        const mintAmount = 21000000 * 10 ** 6; // 21
        const txSig = await mintToChecked(
            connection,
            feePayer,
            mint,
            associatedTokenAccount.address,
            feePayer.publicKey,
            mintAmount,
            6
        );
        console.log("Tokens minted:", txSig);
    }
    catch (error) {
        console.error("Error creating mint and associated token account:", error);
    }
}

main() 