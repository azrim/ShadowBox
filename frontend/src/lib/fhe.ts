import { ethers } from "ethers";

let fheInstance: any = null;

export const getFheInstance = async () => {
  if (fheInstance) return fheInstance;
  if (typeof window === "undefined") throw new Error("FHE must run in browser");

  const { createInstance, SepoliaConfig, initSDK } = await import(
    "@zama-fhe/relayer-sdk/web"
  );

  await initSDK();

  const overrideRelayerUrl = process.env.NEXT_PUBLIC_ZAMA_RELAYER_URL;

  const browserProvider = (window as any).ethereum;
  if (!browserProvider) {
    throw new Error(
      "No injected wallet provider found (window.ethereum is undefined)"
    );
  }

  const ethersProvider = new ethers.BrowserProvider(browserProvider);
  const network = await ethersProvider.getNetwork();
  if (network.chainId !== 11155111n) {
    throw new Error(
      `Wallet must be connected to Sepolia (chainId 11155111), but got chainId ${network.chainId.toString()}`
    );
  }

  const rpcUrl = `${window.location.origin}/api/fhe-rpc`;

  const config = {
    ...SepoliaConfig,
    ...(overrideRelayerUrl ? { relayerUrl: overrideRelayerUrl } : {}),
    network: rpcUrl,
  };

  fheInstance = await createInstance(config);
  return fheInstance;
};

export const getToken = async (
  contractAddress: string,
  provider: ethers.BrowserProvider
): Promise<{
  publicKey: string;
  privateKey: string;
  signature: string;
  startTimestamp: string;
  durationDays: string;
}> => {
  const fhe = await getFheInstance();

  // 1) Generate keypair from the FHE instance
  const keypair = fhe.generateKeypair();

  // 2) Build EIP712 payload for user decryption
  const startTimestamp = Math.floor(Date.now() / 1000).toString();
  const durationDays = "30"; // days of validity
  const contracts = [contractAddress];

  const eip712 = fhe.createEIP712(
    keypair.publicKey,
    contracts,
    startTimestamp,
    durationDays
  );

  // 3) Ask the connected wallet to sign the typed data
  const signer = await provider.getSigner();
  const signatureResult = await signer.signTypedData(
    eip712.domain,
    {
      UserDecryptRequestVerification:
        eip712.types.UserDecryptRequestVerification,
    },
    eip712.message
  );

  const signature = signatureResult.replace("0x", "");

  return {
    publicKey: keypair.publicKey,
    privateKey: keypair.privateKey,
    signature,
    startTimestamp,
    durationDays,
  };
};
