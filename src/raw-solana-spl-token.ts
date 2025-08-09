import { ASSOCIATED_TOKEN_PROGRAM_ID, createAssociatedTokenAccountInstruction, createInitializeMint2Instruction, createMintToCheckedInstruction, getAssociatedTokenAddressSync, getMinimumBalanceForRentExemptMint, MINT_SIZE, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { Connection, Keypair, sendAndConfirmTransaction, SystemProgram, Transaction } from "@solana/web3.js";
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
        const mintKeypair = Keypair.generate();
        const mintRent = await getMinimumBalanceForRentExemptMint(connection);

        const createAccountIx = SystemProgram.createAccount({
            fromPubkey: feePayer.publicKey,
            newAccountPubkey: mintKeypair.publicKey,
            space: MINT_SIZE, // 82 bytes for a mint account
            lamports: mintRent,
            programId: TOKEN_PROGRAM_ID
        })

        const initializeMintIx = createInitializeMint2Instruction(
            mintKeypair.publicKey,
            6,
            feePayer.publicKey,
            null,
            TOKEN_PROGRAM_ID
        );

        const associatedTokenAccount = getAssociatedTokenAddressSync(
            mintKeypair.publicKey,
            feePayer.publicKey
        )

        const createAssociatedTokenAccountIx = createAssociatedTokenAccountInstruction(
            feePayer.publicKey,
            associatedTokenAccount,
            feePayer.publicKey,
            mintKeypair.publicKey,
            TOKEN_PROGRAM_ID,
            ASSOCIATED_TOKEN_PROGRAM_ID
        )

        const mintAmount = BigInt(21000000 * 10 ** 6); // 21 million tokens with 6 decimals
        const mintToCheckedIx = createMintToCheckedInstruction(
            mintKeypair.publicKey,
            associatedTokenAccount,
            feePayer.publicKey,
            mintAmount,
            6
        )

        const recentBlockhash = await connection.getLatestBlockhash();

        const transaction = new Transaction({
            feePayer: feePayer.publicKey,
            blockhash: recentBlockhash.blockhash,
            lastValidBlockHeight: recentBlockhash.lastValidBlockHeight
        }).add(
            createAccountIx,
            initializeMintIx,
            createAssociatedTokenAccountIx,
            mintToCheckedIx
        );

        const transactionSignature = await sendAndConfirmTransaction(
            connection,
            transaction,
            [feePayer, mintKeypair]  // feePayer signs as fee payer and mint authority, mintKeypair signs for new account creation
        );

        console.log("Mint Address:", mintKeypair.publicKey.toBase58());
        console.log("Transaction Signature:", transactionSignature);
    }
    catch (error) {
        console.error("Error creating mint and associated token account:", error);
    }
}

main() 