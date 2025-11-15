import { useState, useEffect } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { ethers } from 'ethers';
import { deriveKeyFromSignature, decryptLootCipher } from '@/lib/crypto';
import { getShadowBoxContract, getEligibilityEvents } from '@/lib/contracts';

interface DecryptionFlowProps {
  transactionHash?: string;
}

export default function DecryptionFlow({ transactionHash }: DecryptionFlowProps) {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  
  const [lootData, setLootData] = useState<any>(null);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lootCipher, setLootCipher] = useState<string | null>(null);

  useEffect(() => {
    if (transactionHash && address && walletClient) {
      loadLootCipher();
    }
  }, [transactionHash, address, walletClient]);

  const loadLootCipher = async () => {
    if (!address || !walletClient || !transactionHash) return;

    try {
      const provider = new ethers.BrowserProvider(walletClient as any);
      const contractAddress = process.env.NEXT_PUBLIC_SHADOWBOX_ADDRESS;
      
      if (!contractAddress) {
        throw new Error('Contract address not configured');
      }

      const contract = getShadowBoxContract(contractAddress, provider);
      const events = await getEligibilityEvents(contract, address);
      
      const event = events.find(e => e.transactionHash === transactionHash);
      
      if (event && event.lootCipher) {
        setLootCipher(event.lootCipher);
      } else {
        setError('Loot cipher not found for this transaction');
      }
    } catch (err: any) {
      console.error('Error loading loot cipher:', err);
      setError(err.message || 'Failed to load loot cipher');
    }
  };

  const handleDecrypt = async () => {
    if (!address || !walletClient || !lootCipher) {
      setError('Missing required data');
      return;
    }

    setIsDecrypting(true);
    setError(null);

    try {
      const provider = new ethers.BrowserProvider(walletClient as any);
      const signer = await provider.getSigner();
      
      const { key } = await deriveKeyFromSignature(signer, address);
      
      const decrypted = await decryptLootCipher(key, lootCipher);
      
      setLootData(decrypted);
    } catch (err: any) {
      console.error('Decryption error:', err);
      setError(err.message || 'Failed to decrypt loot');
    } finally {
      setIsDecrypting(false);
    }
  };

  const getTierName = (tier: number) => {
    const names = ['Bronze', 'Silver', 'Gold'];
    return names[tier] || 'Unknown';
  };

  const getTierColor = (tier: number) => {
    const colors = ['text-orange-400', 'text-gray-300', 'text-yellow-400'];
    return colors[tier] || 'text-gray-400';
  };

  if (!address) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-dark-800 rounded-lg p-8 border border-dark-700 text-center">
          <p className="text-dark-400">Please connect your wallet to decrypt your loot</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-dark-800 rounded-lg p-6 border border-dark-700">
        <h2 className="text-2xl font-bold text-white mb-6">Decrypt Your Loot Box</h2>
        
        {!lootData ? (
          <>
            {lootCipher && (
              <div className="mb-6 p-4 bg-dark-700/50 rounded-lg">
                <p className="text-dark-400 text-sm mb-2">Encrypted Loot Cipher:</p>
                <p className="text-dark-300 font-mono text-xs break-all">
                  {lootCipher.slice(0, 100)}...
                </p>
              </div>
            )}
            
            <button
              onClick={handleDecrypt}
              disabled={isDecrypting || !lootCipher}
              className="w-full px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-lg hover:from-primary-500 hover:to-primary-400 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              {isDecrypting ? 'Decrypting...' : 'Decrypt Loot Box'}
            </button>
            
            {error && (
              <div className="mt-4 p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}
            
            <div className="mt-6 p-4 bg-dark-700/50 rounded-lg">
              <p className="text-dark-400 text-sm">
                <strong>How it works:</strong> You'll sign a message to derive the same key used for encryption. 
                This key decrypts your loot box locally—no keys leave your browser.
              </p>
            </div>
          </>
        ) : (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-primary-900/20 to-primary-800/10 border border-primary-500/30 rounded-lg p-6">
              <div className="text-center mb-6">
                <div className="inline-block p-4 bg-primary-500/20 rounded-full mb-4">
                  <svg className="w-16 h-16 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">🎉 Loot Unlocked!</h3>
                <p className={`text-lg font-semibold ${getTierColor(lootData.tier)}`}>
                  {getTierName(lootData.tier)} Tier
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="bg-dark-800/50 rounded-lg p-4">
                  <p className="text-dark-400 text-sm mb-1">Reward Type</p>
                  <p className="text-white font-semibold capitalize">{lootData.rewardType}</p>
                </div>
                <div className="bg-dark-800/50 rounded-lg p-4">
                  <p className="text-dark-400 text-sm mb-1">Amount</p>
                  <p className="text-white font-semibold">{lootData.amount}</p>
                </div>
                <div className="bg-dark-800/50 rounded-lg p-4 col-span-2">
                  <p className="text-dark-400 text-sm mb-1">Loot Index</p>
                  <p className="text-white font-semibold">#{lootData.lootIndex}</p>
                </div>
              </div>
            </div>
            
            {lootData.voucherData && (
              <div className="bg-dark-700/50 rounded-lg p-4">
                <h4 className="text-white font-semibold mb-3">Voucher Details</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-dark-400">Amount:</span>
                    <span className="text-white font-mono">
                      {ethers.formatEther(lootData.voucherData.amount)} ETH
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-dark-400">Expires:</span>
                    <span className="text-white">
                      {new Date(lootData.voucherData.expiry * 1000).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-dark-400">Nonce:</span>
                    <span className="text-white font-mono">{lootData.voucherData.voucherNonce}</span>
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex space-x-4">
              <a
                href="/status"
                className="flex-1 px-6 py-3 bg-dark-700 text-white rounded-lg hover:bg-dark-600 transition text-center"
              >
                Back to Status
              </a>
              <a
                href="/redeem"
                className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-lg hover:from-green-500 hover:to-green-400 transition text-center font-semibold"
              >
                Redeem Voucher →
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
