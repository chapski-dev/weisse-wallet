// Ensure polyfills are loaded first
import { Buffer } from 'buffer';

import { NETWORKS } from '@/constants/networks';
import { MasterWallet, Network, WalletAccount } from '@/types/wallet';
import { secureStorage } from '@/utils/secure-storage';
import * as bip39 from 'bip39';
import * as Crypto from 'expo-crypto';
import { createPublicClient, createWalletClient, formatEther, http, parseEther } from 'viem';
import { mnemonicToAccount, privateKeyToAccount } from 'viem/accounts';
import {
  arbitrum,
  arbitrumSepolia,
  avalanche,
  avalancheFuji,
  base,
  baseSepolia,
  bsc,
  bscTestnet,
  Chain,
  mainnet,
  optimism,
  optimismSepolia,
  polygon,
  polygonAmoy,
  sepolia,
} from 'viem/chains';

// Bitcoin
import * as ecc from '@bitcoinerlab/secp256k1';
import { BIP32Factory } from 'bip32';
import * as bitcoin from 'bitcoinjs-lib';

// Solana
// import { Keypair } from '@solana/web3.js';

// Stellar
// import { Keypair as StellarKeypair } from '@stellar/stellar-sdk';

// TRON
// import { TronWeb } from 'tronweb';
global.Buffer = global.Buffer || Buffer;

const MNEMONIC_KEY = 'wallet_mnemonic';
const WALLET_DATA_KEY = 'wallet_data';

class WalletService {
  private mnemonic: string | null = null;

  // Генерация новой seed фразы (12 или 24 слова)
  generateMnemonic(strength: 128 | 256 = 128): string {
    // Используем expo-crypto для генерации криптографически безопасных случайных байтов
    // strength 128 = 12 слов (16 байт), strength 256 = 24 слова (32 байта)
    const byteLength = strength / 8;
    const randomBytes = Crypto.getRandomBytes(byteLength);
    return bip39.entropyToMnemonic(Buffer.from(randomBytes));
  }

  // Проверка валидности seed фразы
  validateMnemonic(mnemonic: string): boolean {
    return bip39.validateMnemonic(mnemonic);
  }

  // Сохранение seed фразы в защищенное хранилище
  async saveMnemonic(mnemonic: string): Promise<void> {
    if (!this.validateMnemonic(mnemonic)) {
      throw new Error('Invalid mnemonic phrase');
    }
    await secureStorage.setItemAsync(MNEMONIC_KEY, mnemonic);
    this.mnemonic = mnemonic;
  }

  // Загрузка seed фразы из хранилища
  async loadMnemonic(): Promise<string | null> {
    if (this.mnemonic) return this.mnemonic;
    this.mnemonic = await secureStorage.getItemAsync(MNEMONIC_KEY);
    return this.mnemonic;
  }

  // Проверка наличия кошелька
  async hasWallet(): Promise<boolean> {
    const mnemonic = await secureStorage.getItemAsync(MNEMONIC_KEY);
    return mnemonic !== null;
  }

  // Удаление кошелька
  async deleteWallet(): Promise<void> {
    await secureStorage.deleteItemAsync(MNEMONIC_KEY);
    await secureStorage.deleteItemAsync(WALLET_DATA_KEY);
    this.mnemonic = null;
  }

  // Маппинг сетей на viem chains
  private getViemChain(network: Network): Chain {
    const chainMap: Partial<Record<Network, Chain>> = {
      // Mainnets
      [Network.ETHEREUM]: mainnet,
      [Network.POLYGON]: polygon,
      [Network.BSC]: bsc,
      [Network.ARBITRUM]: arbitrum,
      [Network.OPTIMISM]: optimism,
      [Network.AVALANCHE]: avalanche,
      [Network.BASE]: base,
      // Testnets
      [Network.ETHEREUM_SEPOLIA]: sepolia,
      [Network.POLYGON_AMOY]: polygonAmoy,
      [Network.BSC_TESTNET]: bscTestnet,
      [Network.ARBITRUM_SEPOLIA]: arbitrumSepolia,
      [Network.OPTIMISM_SEPOLIA]: optimismSepolia,
      [Network.AVALANCHE_FUJI]: avalancheFuji,
      [Network.BASE_SEPOLIA]: baseSepolia,
    };
    return chainMap[network] || mainnet;
  }

  // Получение EVM кошелька (Ethereum, Polygon, BSC и т.д.)
  async getEVMWallet(network: Network): Promise<{ address: string; privateKey: `0x${string}` }> {
    const mnemonic = await this.loadMnemonic();
    if (!mnemonic) {
      throw new Error('No mnemonic found');
    }

    const networkInfo = NETWORKS[network];
    if (!networkInfo.isEVM) {
      throw new Error('Not an EVM network');
    }

    // Создаем аккаунт из mnemonic с использованием viem
    const account = mnemonicToAccount(mnemonic, {
      path: networkInfo.derivationPath as `m/44'/60'/${string}`,
    });

    return {
      address: account.address,
      privateKey: account.getHdKey().privateKey ? `0x${Buffer.from(account.getHdKey().privateKey!).toString('hex')}` as `0x${string}` : '0x' as `0x${string}`,
    };
  }

  // Получение Solana кошелька
  // async getSolanaWallet(): Promise<{ address: string; publicKey: string }> {
  //   const mnemonic = await this.loadMnemonic();
  //   if (!mnemonic) {
  //     throw new Error('No mnemonic found');
  //   }

  //   // Solana использует ed25519 с derivation path m/44'/501'/0'/0'
  //   const seed = await bip39.mnemonicToSeed(mnemonic);
  //   const derivationPath = "m/44'/501'/0'/0'";
    
  //   // Используем ed25519-hd-key для derivation
  //   const derived = derivePath(derivationPath, seed.toString('hex'));
  //   const keypair = Keypair.fromSeed(derived.key);
    
  //   return {
  //     address: keypair.publicKey.toBase58(),
  //     publicKey: keypair.publicKey.toBase58(),
  //   };
  // }

  // Получение Bitcoin адреса (Native SegWit - bc1q)
  async getBitcoinWallet(): Promise<{ address: string }> {
    const mnemonic = await this.loadMnemonic();
    if (!mnemonic) {
      throw new Error('No mnemonic found');
    }

    // Инициализируем bip32 с secp256k1
    const bip32 = BIP32Factory(ecc);
    
    // Получаем seed из mnemonic
    const seed = await bip39.mnemonicToSeed(mnemonic);
    
    // Создаем master key и derive по BIP84 path (Native SegWit)
    const root = bip32.fromSeed(seed);
    const child = root.derivePath("m/84'/0'/0'/0/0");
    
    // Создаем Native SegWit (bech32) адрес
    const { address } = bitcoin.payments.p2wpkh({
      pubkey: Buffer.from(child.publicKey),
      network: bitcoin.networks.bitcoin,
    });
    
    if (!address) {
      throw new Error('Failed to generate Bitcoin address');
    }
    
    return { address };
  }

  // Получение TRON кошелька
  // async getTronWallet(): Promise<{ address: string }> {
  //   const mnemonic = await this.loadMnemonic();
  //   if (!mnemonic) {
  //     throw new Error('No mnemonic found');
  //   }

  //   // TRON использует тот же secp256k1 что и Ethereum
  //   // Но с другим derivation path и Base58Check кодировкой
  //   const hdNode = HDNodeWallet.fromPhrase(mnemonic, undefined, "m/44'/195'/0'/0/0");
    
  //   // Получаем приватный ключ без 0x
  //   const privateKey = hdNode.privateKey.slice(2);
    
  //   // TronWeb конвертирует приватный ключ в TRON адрес
  //   const address = TronWeb.address.fromPrivateKey(privateKey);
    
  //   if (!address) {
  //     throw new Error('Failed to generate TRON address');
  //   }
    
  //   return { address };
  // }

  // Получение Stellar кошелька
  // async getStellarWallet(): Promise<{ address: string; publicKey: string }> {
  //   const mnemonic = await this.loadMnemonic();
  //   if (!mnemonic) {
  //     throw new Error('No mnemonic found');
  //   }

  //   // Stellar использует ed25519 с derivation path m/44'/148'/0'
  //   const seed = await bip39.mnemonicToSeed(mnemonic);
  //   const derivationPath = "m/44'/148'/0'";
    
  //   // Используем ed25519-hd-key для derivation
  //   const derived = derivePath(derivationPath, seed.toString('hex'));
    
  //   // Создаем Stellar keypair из raw seed
  //   const keypair = StellarKeypair.fromRawEd25519Seed(Buffer.from(derived.key));
    
  //   return {
  //     address: keypair.publicKey(),
  //     publicKey: keypair.publicKey(),
  //   };
  // }

  // Создание аккаунтов во всех сетях
  async createAccountsForAllNetworks(): Promise<WalletAccount[]> {
    const accounts: WalletAccount[] = [];

    // EVM сети (один адрес для всех)
    const evmWallet = await this.getEVMWallet(Network.ETHEREUM);
    
    for (const network of Object.values(NETWORKS)) {
      if (network.isEVM) {
        accounts.push({
          network: network.id,
          address: evmWallet.address,
          balance: '0',
        });
      }
    }

    // Solana
    // try {
    //   const solanaWallet = await this.getSolanaWallet();
    //   accounts.push({
    //     network: Network.SOLANA,
    //     address: solanaWallet.address,
    //     balance: '0',
    //     publicKey: solanaWallet.publicKey,
    //   });
    // } catch (e) {
    //   console.warn('Solana wallet creation failed:', e);
    // }

    // Bitcoin
    // try {
    //   const btcWallet = await this.getBitcoinWallet();
    //   accounts.push({
    //     network: Network.BITCOIN,
    //     address: btcWallet.address,
    //     balance: '0',
    //   });
    // } catch (e) {
    //   console.warn('Bitcoin wallet creation failed:', e);
    // }

    // TRON
    // try {
    //   const tronWallet = await this.getTronWallet();
    //   accounts.push({
    //     network: Network.TRON,
    //     address: tronWallet.address,
    //     balance: '0',
    //   });
    // } catch (e) {
    //   console.warn('TRON wallet creation failed:', e);
    // }

    // Stellar
    // try {
    //   const stellarWallet = await this.getStellarWallet();
    //   accounts.push({
    //     network: Network.STELLAR,
    //     address: stellarWallet.address,
    //     balance: '0',
    //     publicKey: stellarWallet.publicKey,
    //   });
    // } catch (e) {
    //   console.warn('Stellar wallet creation failed:', e);
    // }

    return accounts;
  }

  // Получение баланса для EVM сетей
  async getEVMBalance(network: Network, address: string): Promise<string> {
    const networkInfo = NETWORKS[network];
    if (!networkInfo.isEVM) {
      throw new Error('Not an EVM network');
    }

    try {
      const chain = this.getViemChain(network);
      const client = createPublicClient({
        chain,
        transport: http(networkInfo.rpcUrl),
      });
      const balance = await client.getBalance({ address: address as `0x${string}` });
      return formatEther(balance);
    } catch (error) {
      console.error(`Failed to get balance for ${network}:`, error);
      return '0';
    }
  }

  // Отправка транзакции в EVM сети
  async sendEVMTransaction(
    network: Network,
    to: string,
    amount: string
  ): Promise<string> {
    const networkInfo = NETWORKS[network];
    if (!networkInfo.isEVM) {
      throw new Error('Not an EVM network');
    }

    const { privateKey } = await this.getEVMWallet(network);
    const chain = this.getViemChain(network);
    const account = privateKeyToAccount(privateKey);
    
    const walletClient = createWalletClient({
      account,
      chain,
      transport: http(networkInfo.rpcUrl.trim()),
    });

    const hash = await walletClient.sendTransaction({
      to: to as `0x${string}`,
      value: parseEther(amount),
    });

    return hash;
  }

  // Сохранение данных кошелька
  async saveWalletData(wallet: MasterWallet): Promise<void> {
    await secureStorage.setItemAsync(WALLET_DATA_KEY, JSON.stringify(wallet));
  }

  // Загрузка данных кошелька
  async loadWalletData(): Promise<MasterWallet | null> {
    const data = await secureStorage.getItemAsync(WALLET_DATA_KEY);
    if (!data) return null;
    return JSON.parse(data);
  }
}

export const walletService = new WalletService();
