// Tool to convert a Solana secret key (solana-keygen new --outfile mint-keys.json) from a JSON file to a base58 encoded string
import fs from "fs";
import bs58 from "bs58";

// Path to your Solana keypair file
const filePath = "/home/user/";


// Step 1: Read the file
const secretKeyString = fs.readFileSync("./mint-keys.json", "utf8");

// Step 2: Parse the array of numbers
const secretKeyArray = JSON.parse(secretKeyString) as number[];

// Step 3: Convert to Uint8Array
const secretKey = Uint8Array.from(secretKeyArray);

// Step 4: Encode to base58
const base58Key = bs58.encode(secretKey);

console.log("Base58 Secret Key:", base58Key);