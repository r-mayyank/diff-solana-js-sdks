import { createSolanaClient, generateKeyPairSigner, getExplorerLink, getSignatureFromTransaction, signTransactionMessageWithSigners } from "gill";
import { loadKeypairSignerFromFile } from "gill/node";
import { buildCreateTokenTransaction, buildMintTokensTransaction, TOKEN_PROGRAM_ADDRESS } from "gill/programs";

const { rpc, rpcSubscriptions, sendAndConfirmTransaction } = createSolanaClient({
    urlOrMoniker: "devnet",
});

const feePayer = await loadKeypairSignerFromFile("../mint-keys.json");

const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();

async function main() {
    try {
        const mintKeypair = await generateKeyPairSigner();
        const amount = 21000000 * 10 ** 6; // 21 million tokens with 6 decimals
        console.log(amount);
        

        const tx = await buildCreateTokenTransaction({
            feePayer,
            version: "legacy",
            metadata: {
                isMutable: true,
                name: "My Easy Token",
                symbol: "MAY",
                uri: "https://github.com/r-mayyank/solana-bootcamp-2024/blob/main/new-token/metadata.json"
            },
            mint: mintKeypair,
            decimals: 6,
            latestBlockhash,
            tokenProgram: TOKEN_PROGRAM_ADDRESS
        })

        const tx2 = await buildMintTokensTransaction({
            feePayer,
            version: "legacy",
            latestBlockhash,
            amount, 
            destination: feePayer.address,
            mint: mintKeypair.address,
            mintAuthority: feePayer,
        })

        const signedTx = await signTransactionMessageWithSigners(tx);
        const signedTx2 = await signTransactionMessageWithSigners(tx2);

        await sendAndConfirmTransaction(signedTx);
        await sendAndConfirmTransaction(signedTx2);

        console.log("Mint Address:", mintKeypair.address);
        console.log("Explorer link:", getExplorerLink({
            cluster: "devnet",
            transaction: getSignatureFromTransaction(signedTx)
        }))
    }
    catch (error) {
        console.error("Error creating mint and associated token account:", error);
    }
}

main()
