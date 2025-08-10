import { createSolanaClient, createTransaction, generateKeyPairSigner, getExplorerLink, getMinimumBalanceForRentExemption, getSignatureFromTransaction, signTransactionMessageWithSigners } from "gill";
import { loadKeypairSignerFromFile } from "gill/node";
import { getAssociatedTokenAccountAddress, getCreateAccountInstruction, getCreateAssociatedTokenIdempotentInstruction, getCreateMetadataAccountV3Instruction, getInitializeMintInstruction, getMintSize, getMintToInstruction, getTokenMetadataAddress, TOKEN_PROGRAM_ADDRESS } from "gill/programs";

const { rpc, rpcSubscriptions, sendAndConfirmTransaction } = createSolanaClient({
    urlOrMoniker: "devnet",
});

const feePayer = await loadKeypairSignerFromFile("../mint-keys.json");

const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();

async function main() {
    try {
        const mintKeypair = await generateKeyPairSigner();

        const space = getMintSize();

        const metadata = await getTokenMetadataAddress(mintKeypair);

        const ata = await getAssociatedTokenAccountAddress(mintKeypair.address, feePayer.address)

        const tx = createTransaction({
            feePayer,
            version: "legacy",
            instructions: [
                getCreateAccountInstruction({
                    space,
                    lamports: getMinimumBalanceForRentExemption(space),
                    newAccount: mintKeypair,
                    payer: feePayer,
                    programAddress: TOKEN_PROGRAM_ADDRESS,
                }),
                getInitializeMintInstruction({
                    mint: mintKeypair.address,
                    decimals: 6,
                    mintAuthority: feePayer.address,
                    freezeAuthority: feePayer.address,
                }, {
                    programAddress: TOKEN_PROGRAM_ADDRESS,
                }),
                getCreateMetadataAccountV3Instruction({
                    collectionDetails: null,
                    isMutable: true,
                    updateAuthority: feePayer,
                    mint: mintKeypair.address,
                    metadata,
                    mintAuthority: feePayer,
                    payer: feePayer,
                    data: {
                        sellerFeeBasisPoints: 0,
                        collection: null,
                        creators: null,
                        uses: null,
                        name: "My Token",
                        symbol: "MAY",
                        uri: "https://github.com/r-mayyank/solana-bootcamp-2024/blob/main/new-token/metadata.json",
                    }
                }),
                 getCreateAssociatedTokenIdempotentInstruction({
                    mint: mintKeypair.address,
                    owner: feePayer.address,
                    payer: feePayer,
                    tokenProgram: TOKEN_PROGRAM_ADDRESS,
                    ata: ata
                }),
                getMintToInstruction({
                    mint: mintKeypair.address,
                    mintAuthority: feePayer,
                    token: ata,
                    amount: BigInt(21000000 * 10 ** 6),
                }, {
                    programAddress: TOKEN_PROGRAM_ADDRESS,
                }) 
            ],
            latestBlockhash
        })

        const signedTx = await signTransactionMessageWithSigners(tx);

        await sendAndConfirmTransaction(signedTx);

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
