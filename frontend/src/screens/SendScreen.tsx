import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Modal,
  FlatList,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { createTransaction } from '../store/slices/transactionSlice';
import { Token } from '../types/portfolio';
import { useTheme } from '../hooks/useTheme';

const SOLANA_TOKENS: Token[] = [
  {
    address: 'So11111111111111111111111111111111111111112',
    symbol: 'SOL',
    name: 'Solana',
    decimals: 9,
    balance: '12.5456',
    usdValue: 2180.5,
    price: 173.8,
    change24h: 5.2,
  },
  {
    address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    balance: '399.75',
    usdValue: 399.75,
    price: 1.0,
    change24h: 0.0,
  },
  {
    address: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
    symbol: 'USDT',
    name: 'Tether USD',
    decimals: 6,
    balance: '150.25',
    usdValue: 150.25,
    price: 1.0,
    change24h: 0.01,
  },
];

const ETHEREUM_TOKENS: Token[] = [
  {
    address: '0x0000000000000000000000000000000000000000',
    symbol: 'ETH',
    name: 'Ethereum',
    decimals: 18,
    balance: '5.2341',
    usdValue: 12840.25,
    price: 2452.3,
    change24h: -2.1,
  },
  {
    address: '0xA0b86a33E6441C5871EF3f14A0bf96E5a0b91A4F',
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    balance: '399.75',
    usdValue: 399.75,
    price: 1.0,
    change24h: 0.0,
  },
  {
    address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    symbol: 'USDT',
    name: 'Tether USD',
    decimals: 6,
    balance: '150.25',
    usdValue: 150.25,
    price: 1.0,
    change24h: 0.01,
  },
];

const SendScreen: React.FC = () => {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const { selectedNetwork } = useAppSelector(state => state.portfolio);
  const { isConnected, address } = useAppSelector(state => state.wallet);

  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [amount, setAmount] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const availableTokens = useMemo(() => {
    return selectedNetwork === 'solana' ? SOLANA_TOKENS : ETHEREUM_TOKENS;
  }, [selectedNetwork]);

  const usdValue = useMemo(() => {
    if (!selectedToken || !amount || parseFloat(amount) <= 0) return 0;
    return parseFloat(amount) * selectedToken.price;
  }, [selectedToken, amount]);

  const networkFee = useMemo(() => {
    if (selectedNetwork === 'solana') {
      return { amount: '0.000005', symbol: 'SOL', usd: '$0.001' };
    }
    return { amount: '0.0021', symbol: 'ETH', usd: '$5.15' };
  }, [selectedNetwork]);

  const isValidAddress = useMemo(() => {
    if (!recipientAddress) return null;
    if (selectedNetwork === 'solana') {
      return recipientAddress.length >= 32 && recipientAddress.length <= 44;
    }
    return /^0x[a-fA-F0-9]{40}$/.test(recipientAddress);
  }, [recipientAddress, selectedNetwork]);

  const canSend = useMemo(() => {
    return (
      isConnected &&
      selectedToken &&
      amount &&
      parseFloat(amount) > 0 &&
      parseFloat(amount) <= parseFloat(selectedToken.balance) &&
      recipientAddress &&
      isValidAddress
    );
  }, [isConnected, selectedToken, amount, recipientAddress, isValidAddress]);

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatTokenAmount = (bal: string, decimals: number = 6): string => {
    const num = parseFloat(bal);
    return num.toFixed(Math.min(decimals, 6));
  };

  const handleMaxAmount = () => {
    if (selectedToken) {
      setAmount(selectedToken.balance);
    }
  };

  const handleSend = () => {
    if (!canSend || !selectedToken) return;

    Alert.alert(
      'Confirm Send',
      `Send ${amount} ${selectedToken.symbol} to ${recipientAddress.slice(0, 8)}...${recipientAddress.slice(-6)}?\n\nNetwork Fee: ${networkFee.amount} ${networkFee.symbol}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            setIsSending(true);
            try {
              await dispatch(
                createTransaction({
                  type: 'send',
                  network: selectedNetwork,
                  fromAddress: address || '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
                  toAddress: recipientAddress,
                  amount: amount,
                  tokenSymbol: selectedToken.symbol,
                  tokenAddress: selectedToken.address,
                }),
              ).unwrap();
              Alert.alert('Success', 'Transaction submitted successfully! (Demo)');
              setAmount('');
              setRecipientAddress('');
            } catch {
              Alert.alert('Error', 'Transaction failed. Please try again.');
            } finally {
              setIsSending(false);
            }
          },
        },
      ],
    );
  };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: 60,
      paddingBottom: 20,
    },
    headerTitle: { fontSize: 28, fontWeight: 'bold', color: theme.colors.text },
    networkChip: {
      backgroundColor: theme.colors.surface,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    networkText: { color: theme.colors.text, fontSize: 14, fontWeight: '600' },
    card: {
      marginHorizontal: 20,
      marginBottom: 12,
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: 20,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    cardLabel: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      fontWeight: '600',
    },
    maxButton: { fontSize: 12, color: theme.colors.primary, fontWeight: '600' },
    tokenSelector: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 14,
    },
    tokenSelectorButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: 12,
      flex: 1,
    },
    tokenIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    tokenIconText: { color: '#FFFFFF', fontSize: 14, fontWeight: 'bold' },
    tokenInfo: { flex: 1 },
    tokenSymbol: { fontSize: 16, fontWeight: '600', color: theme.colors.text },
    tokenBalance: { fontSize: 12, color: theme.colors.textSecondary },
    tokenArrow: { fontSize: 12, color: theme.colors.textTertiary },
    selectTokenText: {
      fontSize: 16,
      color: theme.colors.textTertiary,
      paddingVertical: 12,
      paddingHorizontal: 16,
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: 12,
      flex: 1,
      textAlign: 'center',
    },
    amountRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      paddingTop: 14,
    },
    amountInput: {
      fontSize: 28,
      fontWeight: 'bold',
      color: theme.colors.text,
      flex: 1,
    },
    amountUsd: { fontSize: 13, color: theme.colors.textSecondary },
    recipientInput: {
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
      color: theme.colors.text,
      fontSize: 14,
      fontFamily: 'monospace',
    },
    addressStatus: { fontSize: 11, marginTop: 8 },
    addressValid: { color: theme.colors.success },
    addressInvalid: { color: theme.colors.error },
    feeRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    feeLabel: { fontSize: 13, color: theme.colors.textSecondary },
    feeValue: { fontSize: 13, fontWeight: '600', color: theme.colors.text },
    feeValueHighlight: { color: theme.colors.success },
    sendButton: {
      marginHorizontal: 20,
      marginBottom: 40,
      backgroundColor: theme.colors.primary,
      paddingVertical: 18,
      borderRadius: 16,
      alignItems: 'center',
    },
    sendButtonDisabled: {
      backgroundColor: theme.colors.buttonDisabled,
      opacity: 0.5,
    },
    sendButtonText: { fontSize: 18, fontWeight: 'bold', color: '#FFFFFF' },
    securityNote: {
      fontSize: 12,
      color: theme.colors.textTertiary,
      textAlign: 'center',
      paddingHorizontal: 20,
      marginBottom: 20,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: theme.colors.modalOverlay,
      justifyContent: 'flex-end',
    },
    modalContainer: {
      backgroundColor: theme.colors.modalBackground,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: '70%',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    modalTitle: { fontSize: 18, fontWeight: 'bold', color: theme.colors.text },
    modalClose: { fontSize: 20, color: theme.colors.textTertiary },
    tokenOption: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    tokenOptionInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    tokenOptionIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.surfaceVariant,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    tokenOptionSymbolText: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.colors.text,
    },
    tokenOptionName: { fontSize: 16, fontWeight: '600', color: theme.colors.text },
    tokenOptionFullName: { fontSize: 14, color: theme.colors.textSecondary },
    tokenOptionBalance: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.primary,
    },
  });

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Send</Text>
        <TouchableOpacity style={styles.networkChip}>
          <Text style={styles.networkText}>
            {selectedNetwork === 'solana' ? '\u25C9 Solana' : '\u2B22 Ethereum'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Token Selection & Amount */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardLabel}>Token</Text>
          {selectedToken?.balance && (
            <TouchableOpacity onPress={handleMaxAmount}>
              <Text style={styles.maxButton}>
                MAX: {formatTokenAmount(selectedToken.balance, selectedToken.decimals)}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.tokenSelector}>
          <TouchableOpacity
            style={styles.tokenSelectorButton}
            onPress={() => setShowTokenModal(true)}
          >
            {selectedToken ? (
              <>
                <View style={styles.tokenIcon}>
                  <Text style={styles.tokenIconText}>
                    {selectedToken.symbol[0]}
                  </Text>
                </View>
                <View style={styles.tokenInfo}>
                  <Text style={styles.tokenSymbol}>{selectedToken.symbol}</Text>
                  <Text style={styles.tokenBalance}>
                    Balance: {formatTokenAmount(selectedToken.balance, selectedToken.decimals)}
                  </Text>
                </View>
                <Text style={styles.tokenArrow}>{'\u25BC'}</Text>
              </>
            ) : (
              <Text style={styles.selectTokenText}>Select Token {'\u25BC'}</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.amountRow}>
          <TextInput
            style={styles.amountInput}
            value={amount}
            onChangeText={setAmount}
            placeholder="0.0"
            placeholderTextColor={theme.colors.inputPlaceholder}
            keyboardType="numeric"
          />
          {usdValue > 0 && (
            <Text style={styles.amountUsd}>{'\u2248'} {formatCurrency(usdValue)}</Text>
          )}
        </View>
      </View>

      {/* Recipient Address */}
      <View style={styles.card}>
        <Text style={[styles.cardLabel, { marginBottom: 12 }]}>
          Recipient Address
        </Text>
        <TextInput
          style={styles.recipientInput}
          value={recipientAddress}
          onChangeText={setRecipientAddress}
          placeholder={
            selectedNetwork === 'solana'
              ? 'Enter Solana address...'
              : 'Enter Ethereum address (0x...)'
          }
          placeholderTextColor={theme.colors.inputPlaceholder}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {isValidAddress !== null && (
          <Text
            style={[
              styles.addressStatus,
              isValidAddress ? styles.addressValid : styles.addressInvalid,
            ]}
          >
            {isValidAddress
              ? `\u2714 Valid ${selectedNetwork === 'solana' ? 'Solana' : 'Ethereum'} address`
              : `\u2718 Invalid ${selectedNetwork === 'solana' ? 'Solana' : 'Ethereum'} address`}
          </Text>
        )}
      </View>

      {/* Fee Details */}
      <View style={styles.card}>
        <View style={styles.feeRow}>
          <Text style={styles.feeLabel}>Network Fee</Text>
          <Text style={styles.feeValue}>
            ~{networkFee.amount} {networkFee.symbol}
          </Text>
        </View>
        <View style={styles.feeRow}>
          <Text style={styles.feeLabel}>Estimated Time</Text>
          <Text style={[styles.feeValue, styles.feeValueHighlight]}>
            {selectedNetwork === 'solana' ? '< 1 second' : '~15 seconds'}
          </Text>
        </View>
        {selectedToken && amount && parseFloat(amount) > 0 && (
          <View style={[styles.feeRow, { marginBottom: 0 }]}>
            <Text style={styles.feeLabel}>Total Cost</Text>
            <Text style={styles.feeValue}>
              {amount} {selectedToken.symbol} + fee
            </Text>
          </View>
        )}
      </View>

      {/* Send Button */}
      <TouchableOpacity
        style={[styles.sendButton, !canSend && styles.sendButtonDisabled]}
        disabled={!canSend || isSending}
        onPress={handleSend}
      >
        {isSending ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.sendButtonText}>
            {!isConnected
              ? 'Connect Wallet to Send'
              : !selectedToken
                ? 'Select Token'
                : !amount || parseFloat(amount) <= 0
                  ? 'Enter Amount'
                  : !recipientAddress
                    ? 'Enter Recipient'
                    : `Send ${amount} ${selectedToken.symbol}`}
          </Text>
        )}
      </TouchableOpacity>

      <Text style={styles.securityNote}>
        Transaction will require wallet confirmation
      </Text>

      {/* Token Selection Modal */}
      <Modal visible={showTokenModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Token to Send</Text>
              <TouchableOpacity onPress={() => setShowTokenModal(false)}>
                <Text style={styles.modalClose}>{'\u2715'}</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={availableTokens}
              keyExtractor={item => item.address}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.tokenOption}
                  onPress={() => {
                    setSelectedToken(item);
                    setShowTokenModal(false);
                  }}
                >
                  <View style={styles.tokenOptionInfo}>
                    <View style={styles.tokenOptionIcon}>
                      <Text style={styles.tokenOptionSymbolText}>
                        {item.symbol[0]}
                      </Text>
                    </View>
                    <View>
                      <Text style={styles.tokenOptionName}>{item.symbol}</Text>
                      <Text style={styles.tokenOptionFullName}>{item.name}</Text>
                    </View>
                  </View>
                  <Text style={styles.tokenOptionBalance}>
                    {formatTokenAmount(item.balance, item.decimals)}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

export default SendScreen;
