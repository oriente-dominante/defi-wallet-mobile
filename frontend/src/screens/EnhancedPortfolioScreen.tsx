import React, { useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  setSelectedAddress,
  setSelectedNetwork,
} from '../store/slices/portfolioSlice';
import {
  connectPhantomWallet,
  disconnectWallet,
  clearError,
} from '../store/slices/walletSlice';
import {
  useGetPortfolioQuery,
  useRefreshPortfolioMutation,
} from '../store/api/portfolioApi';
import { useGetTokenPricesQuery } from '../store/api/pricesApi';
import { Token } from '../types/portfolio';
import { useTheme } from '../hooks/useTheme';

const EnhancedPortfolioScreen: React.FC = () => {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const { selectedNetwork, portfolio: reduxPortfolio } = useAppSelector(state => state.portfolio);
  const {
    isConnected,
    address,
    isConnecting,
    error: walletError,
  } = useAppSelector(state => state.wallet);

  // Use connected wallet address or fallback to mock address
  const walletAddress =
    address ||
    (selectedNetwork === 'solana'
      ? '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM'
      : '0x742d35Cc6339C4532CE58B7bdCF4777df3A747Ec');

  // Real API calls with RTK Query
  const {
    data: apiPortfolio,
    isLoading: portfolioLoading,
    error: portfolioError,
    refetch: refetchPortfolio,
  } = useGetPortfolioQuery(
    { address: walletAddress, network: selectedNetwork },
    {
      skip: !walletAddress,
      pollingInterval: 30000, // Poll every 30 seconds for live data
    },
  );

  // Use API data if available, otherwise fall back to Redux state mock data
  const portfolio = apiPortfolio || reduxPortfolio;

  // Get real-time price data
  const { data: pricesData, isLoading: pricesLoading } = useGetTokenPricesQuery(
    ['bitcoin', 'ethereum', 'solana', 'usd-coin'],
    { pollingInterval: 30000 },
  );

  const [refreshPortfolio] = useRefreshPortfolioMutation();

  useEffect(() => {
    if (walletAddress) {
      dispatch(setSelectedAddress(walletAddress));
    }
  }, [dispatch, walletAddress]);

  const onRefresh = async () => {
    try {
      if (walletAddress) {
        await refreshPortfolio({
          address: walletAddress,
          network: selectedNetwork,
        }).unwrap();
      }
      await refetchPortfolio();
    } catch (error) {
      console.error('Refresh failed:', error);
    }
  };

  const handleConnectWallet = async () => {
    if (isConnected) {
      Alert.alert(
        'Disconnect Wallet',
        'Are you sure you want to disconnect your wallet?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Disconnect',
            style: 'destructive',
            onPress: () => dispatch(disconnectWallet()),
          },
        ],
      );
    } else {
      if (selectedNetwork === 'solana') {
        dispatch(connectPhantomWallet());
      } else {
        Alert.alert(
          'MetaMask Integration',
          'MetaMask integration coming soon!',
        );
      }
    }
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatPercentage = (value: number): string => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  };

  const formatAddress = (addr: string): string => {
    if (!addr) return '';
    return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
  };

  const toggleNetwork = () => {
    if (isConnected) {
      Alert.alert(
        'Switch Network',
        'Please disconnect your wallet before switching networks.',
        [{ text: 'OK' }],
      );
      return;
    }
    const newNetwork = selectedNetwork === 'solana' ? 'ethereum' : 'solana';
    dispatch(setSelectedNetwork(newNetwork));
  };

  const renderTokenItem = ({ item }: { item: Token }) => {
    // Get real-time price from API
    const tokenPrice = pricesData?.[item.symbol.toLowerCase()];
    const displayChange = tokenPrice?.changePercent24h ?? item.change24h;

    return (
      <TouchableOpacity
        style={[
          styles.tokenItem,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
          },
        ]}
        activeOpacity={0.7}
      >
        <View style={styles.tokenInfo}>
          <View
            style={[
              styles.tokenIcon,
              { backgroundColor: theme.colors.surfaceVariant },
            ]}
          >
            <Text style={[styles.tokenSymbol, { color: theme.colors.text }]}>
              {item.symbol[0]}
            </Text>
          </View>
          <View style={styles.tokenDetails}>
            <Text style={[styles.tokenName, { color: theme.colors.text }]}>
              {item.symbol}
            </Text>
            <Text
              style={[
                styles.tokenFullName,
                { color: theme.colors.textSecondary },
              ]}
            >
              {item.name}
            </Text>
            {tokenPrice && (
              <Text style={[styles.livePrice, { color: theme.colors.primary }]}>
                Live: {formatCurrency(tokenPrice.price)}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.tokenValues}>
          <Text style={[styles.tokenBalance, { color: theme.colors.text }]}>
            {parseFloat(item.balance).toFixed(4)}
          </Text>
          <View style={styles.tokenPriceContainer}>
            <Text
              style={[
                styles.tokenUsdValue,
                { color: theme.colors.textSecondary },
              ]}
            >
              {formatCurrency(item.usdValue)}
            </Text>
            <Text
              style={[
                styles.tokenChange,
                {
                  color:
                    displayChange >= 0
                      ? theme.colors.success
                      : theme.colors.error,
                },
              ]}
            >
              {formatPercentage(displayChange)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const portfolioChangeColor = useMemo(() => {
    if (!portfolio) return theme.colors.textTertiary;
    return portfolio.totalChangePercent24h >= 0
      ? theme.colors.success
      : theme.colors.error;
  }, [portfolio?.totalChangePercent24h, theme]);

  const isLoading = portfolioLoading || pricesLoading;
  const error = portfolioError || walletError;

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
    headerButtons: { flexDirection: 'row', alignItems: 'center' },
    networkButton: {
      backgroundColor: theme.colors.surface,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    networkText: { color: theme.colors.text, fontSize: 14, fontWeight: '600' },
    liveIndicator: {
      backgroundColor: theme.colors.success,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      marginLeft: 8,
    },
    liveText: { color: '#FFFFFF', fontSize: 10, fontWeight: '600' },
    walletContainer: { paddingHorizontal: 20, marginBottom: 10 },
    connectButton: {
      backgroundColor: theme.colors.primary,
      paddingVertical: 16,
      paddingHorizontal: 24,
      borderRadius: 12,
      alignItems: 'center',
    },
    connectingButton: { backgroundColor: theme.colors.primaryVariant },
    connectText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
    connectedWallet: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.success,
    },
    walletInfo: { flex: 1 },
    connectedLabel: {
      color: theme.colors.success,
      fontSize: 14,
      fontWeight: '600',
    },
    walletAddress: {
      color: theme.colors.textSecondary,
      fontSize: 12,
      marginTop: 2,
    },
    disconnectButton: {
      backgroundColor: theme.colors.surfaceVariant,
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 8,
    },
    disconnectText: { color: theme.colors.text, fontSize: 14 },
    summaryContainer: {
      paddingHorizontal: 20,
      paddingVertical: 20,
      alignItems: 'center',
    },
    totalValueLabel: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      marginBottom: 8,
    },
    totalValue: {
      fontSize: 36,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 12,
    },
    changeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    totalChange: { fontSize: 18, fontWeight: '600', marginRight: 8 },
    totalChangePercent: { fontSize: 18, fontWeight: '600' },
    lastUpdated: { fontSize: 12, color: theme.colors.textTertiary },
    demoNote: {
      fontSize: 12,
      color: theme.colors.primary,
      marginTop: 8,
      textAlign: 'center',
    },
    liveDataNote: {
      fontSize: 12,
      color: theme.colors.success,
      marginTop: 8,
      textAlign: 'center',
    },
    tokensContainer: { flex: 1, paddingHorizontal: 20 },
    tokensTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 16,
    },
    tokensList: { flex: 1 },
    tokenItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 16,
      paddingHorizontal: 16,
      borderRadius: 12,
      marginBottom: 12,
      borderWidth: 1,
    },
    tokenInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    tokenIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    tokenSymbol: { fontSize: 16, fontWeight: 'bold' },
    tokenDetails: { flex: 1 },
    tokenName: { fontSize: 16, fontWeight: '600' },
    tokenFullName: { fontSize: 14 },
    livePrice: { fontSize: 12, fontWeight: '600', marginTop: 2 },
    tokenValues: { alignItems: 'flex-end' },
    tokenBalance: { fontSize: 16, fontWeight: '600' },
    tokenPriceContainer: { flexDirection: 'row', alignItems: 'center' },
    tokenUsdValue: { fontSize: 14, marginRight: 8 },
    tokenChange: { fontSize: 14, fontWeight: '600' },
    errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    errorText: { fontSize: 16, marginBottom: 20, textAlign: 'center' },
    retryButton: {
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 8,
    },
    retryText: { fontSize: 16 },
  });

  if (error && !(error as any).fallback && !portfolio) {
    return (
      <View
        style={[
          styles.errorContainer,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <Text style={[styles.errorText, { color: theme.colors.error }]}>
          {typeof error === 'string' ? error : 'Failed to load portfolio data'}
        </Text>
        <TouchableOpacity
          style={[
            styles.retryButton,
            { backgroundColor: theme.colors.buttonSecondary },
          ]}
          onPress={() => {
            if (walletError) dispatch(clearError());
            onRefresh();
          }}
        >
          <Text style={[styles.retryText, { color: theme.colors.text }]}>
            Retry
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Portfolio</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.networkButton}
            onPress={toggleNetwork}
          >
            <Text style={styles.networkText}>
              {selectedNetwork === 'solana' ? '◉ Solana' : '⬢ Ethereum'}
            </Text>
          </TouchableOpacity>
          {pricesData && (
            <View style={styles.liveIndicator}>
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          )}
        </View>
      </View>

      {/* Wallet Connection */}
      <View style={styles.walletContainer}>
        {isConnected ? (
          <View style={styles.connectedWallet}>
            <View style={styles.walletInfo}>
              <Text style={styles.connectedLabel}>👻 Phantom Connected</Text>
              <Text style={styles.walletAddress}>
                {formatAddress(address!)}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.disconnectButton}
              onPress={handleConnectWallet}
            >
              <Text style={styles.disconnectText}>Disconnect</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={[
              styles.connectButton,
              isConnecting && styles.connectingButton,
            ]}
            onPress={handleConnectWallet}
            disabled={isConnecting}
          >
            <Text style={styles.connectText}>
              {isConnecting ? 'Connecting...' : '👻 Connect Phantom Wallet'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Portfolio Summary */}
      <View style={styles.summaryContainer}>
        <Text style={styles.totalValueLabel}>Total Portfolio Value</Text>
        <Text style={styles.totalValue}>
          {portfolio ? formatCurrency(portfolio.totalValue) : '$0.00'}
        </Text>

        {portfolio && (
          <View style={styles.changeContainer}>
            <Text style={[styles.totalChange, { color: portfolioChangeColor }]}>
              {portfolio.totalChange24h >= 0 ? '+' : ''}
              {formatCurrency(portfolio.totalChange24h)}
            </Text>
            <Text
              style={[
                styles.totalChangePercent,
                { color: portfolioChangeColor },
              ]}
            >
              ({formatPercentage(portfolio.totalChangePercent24h)})
            </Text>
          </View>
        )}

        {portfolio && (
          <Text style={styles.lastUpdated}>
            Last updated: {new Date(portfolio.lastUpdated).toLocaleTimeString()}
          </Text>
        )}

        {pricesData ? (
          <Text style={styles.liveDataNote}>
            📡 Live market data - Updates every 30 seconds
          </Text>
        ) : !isConnected ? (
          <Text style={styles.demoNote}>
            📝 Demo data shown - Connect wallet for real balances
          </Text>
        ) : null}
      </View>

      {/* Tokens List */}
      <View style={styles.tokensContainer}>
        <Text style={styles.tokensTitle}>Assets</Text>
        <FlatList
          data={portfolio?.tokens || []}
          renderItem={renderTokenItem}
          keyExtractor={item => item.address}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
          style={styles.tokensList}
        />
      </View>
    </View>
  );
};

export default EnhancedPortfolioScreen;
