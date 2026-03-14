import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Modal,
  ScrollView,
  TextInput,
} from 'react-native';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  fetchTransactions,
  setFilter,
  selectTransaction,
  clearError,
} from '../store/slices/transactionSlice';
import { Transaction, TransactionFilter } from '../types/transaction';
import { useTheme } from '../hooks/useTheme';

const TransactionScreen: React.FC = () => {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const { transactions, isLoading, error, filter, selectedTransaction } =
    useAppSelector(state => state.transactions);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    dispatch(fetchTransactions(filter));
  }, [dispatch, filter]);

  const filteredAndSearchedTransactions = transactions
    .filter(transaction => {
      // Apply filters
      if (filter.type !== 'all' && transaction.type !== filter.type) return false;
      if (filter.status !== 'all' && transaction.status !== filter.status) return false;
      if (filter.network !== 'all' && transaction.network !== filter.network) return false;
      
      // Apply time range filter
      if (filter.timeRange !== 'all') {
        const now = Date.now();
        const transactionTime = transaction.timestamp;
        const timeDiff = now - transactionTime;
        
        switch (filter.timeRange) {
          case '24h':
            if (timeDiff > 24 * 60 * 60 * 1000) return false;
            break;
          case '7d':
            if (timeDiff > 7 * 24 * 60 * 60 * 1000) return false;
            break;
          case '30d':
            if (timeDiff > 30 * 24 * 60 * 60 * 1000) return false;
            break;
          case '90d':
            if (timeDiff > 90 * 24 * 60 * 60 * 1000) return false;
            break;
        }
      }
      
      return true;
    })
    .filter(transaction => {
      // Apply search filter
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        transaction.description.toLowerCase().includes(query) ||
        transaction.hash.toLowerCase().includes(query) ||
        transaction.tokenSymbol.toLowerCase().includes(query)
      );
    });

  const onRefresh = () => {
    dispatch(fetchTransactions(filter));
  };

  const formatHash = (hash: string): string => {
    return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
  };

  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays <= 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
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

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'confirmed':
        return '#00D632';
      case 'pending':
        return '#FFA500';
      case 'failed':
        return '#FF3838';
      case 'cancelled':
        return '#666';
      default:
        return '#666';
    }
  };

  const getTypeIcon = (type: string): string => {
    switch (type) {
      case 'swap':
        return '🔄';
      case 'send':
        return '📤';
      case 'receive':
        return '📥';
      case 'stake':
        return '🏦';
      case 'unstake':
        return '🏧';
      case 'defi':
        return '🌾';
      case 'nft':
        return '🖼️';
      default:
        return '💰';
    }
  };

  const getNetworkIcon = (network: string): string => {
    switch (network) {
      case 'solana':
        return '🪐';
      case 'ethereum':
        return '⬢';
      default:
        return '🔗';
    }
  };

  const renderTransaction = ({ item }: { item: Transaction }) => (
    <TouchableOpacity
      style={[styles.transactionItem, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
      onPress={() => {
        dispatch(selectTransaction(item));
        setShowDetailsModal(true);
      }}
    >
      <View style={styles.transactionLeft}>
        <View style={styles.transactionIconContainer}>
          <Text style={styles.transactionTypeIcon}>
            {getTypeIcon(item.type)}
          </Text>
          <Text style={styles.transactionNetworkIcon}>
            {getNetworkIcon(item.network)}
          </Text>
        </View>

        <View style={styles.transactionInfo}>
          <Text style={[styles.transactionDescription, { color: theme.colors.text }]}>
            {item.description}
          </Text>
          <View style={styles.transactionMeta}>
            <Text style={[styles.transactionHash, { color: theme.colors.textSecondary }]}>
              {formatHash(item.hash)}
            </Text>
            <Text style={[styles.transactionTime, { color: theme.colors.textSecondary }]}>
              • {formatDate(item.timestamp)}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.transactionRight}>
        <Text style={[styles.transactionAmount, { color: theme.colors.text }]}>
          {item.type === 'receive' ? '+' : '-'}{item.amount} {item.tokenSymbol}
        </Text>
        <View style={styles.transactionStatusContainer}>
          <Text style={[styles.transactionUsd, { color: theme.colors.textTertiary }]}>
            {formatCurrency(item.usdValue)}
          </Text>
          <View
            style={[
              styles.transactionStatus,
              { backgroundColor: getStatusColor(item.status) },
            ]}
          >
            <Text style={styles.transactionStatusText}>
              {item.status.toUpperCase()}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

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
    filterButton: {
      backgroundColor: theme.colors.surface,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    filterButtonText: { color: theme.colors.text, fontSize: 14, fontWeight: '600' },
    searchContainer: { paddingHorizontal: 20, marginBottom: 10 },
    searchInput: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      color: theme.colors.text,
      fontSize: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    activeFilters: { paddingHorizontal: 20, marginBottom: 10 },
    activeFilter: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      marginRight: 8,
    },
    activeFilterText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' },
    transactionsList: { flex: 1, paddingHorizontal: 20 },
    transactionItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 16,
      paddingHorizontal: 16,
      borderRadius: 12,
      marginBottom: 12,
      borderWidth: 1,
    },
    transactionLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    transactionIconContainer: { position: 'relative', marginRight: 12 },
    transactionTypeIcon: { fontSize: 24 },
    transactionNetworkIcon: {
      position: 'absolute',
      bottom: -2,
      right: -2,
      fontSize: 12,
    },
    transactionInfo: { flex: 1 },
    transactionDescription: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 4,
    },
    transactionMeta: { flexDirection: 'row', alignItems: 'center' },
    transactionHash: { fontSize: 12, fontFamily: 'monospace' },
    transactionTime: { fontSize: 12, marginLeft: 4 },
    transactionRight: { alignItems: 'flex-end' },
    transactionAmount: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 4,
    },
    transactionStatusContainer: { flexDirection: 'row', alignItems: 'center' },
    transactionUsd: { fontSize: 12, marginRight: 8 },
    transactionStatus: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
    },
    transactionStatusText: { fontSize: 10, fontWeight: 'bold', color: '#FFFFFF' },
    emptyContainer: { alignItems: 'center', paddingVertical: 60 },
    emptyIcon: { fontSize: 48, marginBottom: 16 },
    emptyText: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 8,
    },
    emptySubtext: { fontSize: 14, color: theme.colors.textSecondary, textAlign: 'center' },
    modalOverlay: {
      flex: 1,
      backgroundColor: theme.colors.modalOverlay,
      justifyContent: 'flex-end',
    },
    modalContainer: {
      backgroundColor: theme.colors.modalBackground,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: '80%',
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
    filterContent: { padding: 20 },
    filterSection: { marginBottom: 24 },
    filterSectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 12,
    },
    filterOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    filterOption: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: 8,
    },
    filterOptionSelected: { backgroundColor: theme.colors.primary },
    filterOptionText: { fontSize: 14, color: theme.colors.text },
    filterOptionTextSelected: { color: '#FFFFFF' },
    detailsContent: { flex: 1 },
    detailsHeader: { alignItems: 'center', marginBottom: 24 },
    detailsTypeIcon: { fontSize: 40, marginBottom: 8 },
    detailsDescription: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 8,
      textAlign: 'center',
    },
    detailsStatus: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
    detailsStatusText: { fontSize: 12, fontWeight: 'bold', color: '#FFFFFF' },
    detailsSection: { marginBottom: 24 },
    detailsSectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 12,
    },
    detailsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 8,
    },
    detailsLabel: { fontSize: 14, color: theme.colors.textSecondary, flex: 1 },
    detailsValue: {
      fontSize: 14,
      color: theme.colors.text,
      flex: 2,
      textAlign: 'right',
      fontFamily: 'monospace',
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
    },
    errorText: {
      color: theme.colors.error,
      fontSize: 16,
      marginBottom: 20,
      textAlign: 'center',
    },
    retryButton: {
      backgroundColor: theme.colors.buttonSecondary,
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 8,
    },
    retryText: { color: theme.colors.text, fontSize: 16 },
  });

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => dispatch(clearError())}
        >
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>History</Text>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilterModal(true)}
        >
          <Text style={styles.filterButtonText}>🔍 Filter</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search transactions..."
          placeholderTextColor={theme.colors.inputPlaceholder}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Active Filters */}
      {(filter.type !== 'all' ||
        filter.status !== 'all' ||
        filter.network !== 'all' ||
        filter.timeRange !== 'all') && (
        <View style={styles.activeFilters}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {filter.type !== 'all' && (
              <View style={styles.activeFilter}>
                <Text style={styles.activeFilterText}>
                  {getTypeIcon(filter.type)} {filter.type}
                </Text>
              </View>
            )}
            {filter.status !== 'all' && (
              <View style={styles.activeFilter}>
                <Text style={styles.activeFilterText}>{filter.status}</Text>
              </View>
            )}
            {filter.network !== 'all' && (
              <View style={styles.activeFilter}>
                <Text style={styles.activeFilterText}>
                  {getNetworkIcon(filter.network)} {filter.network}
                </Text>
              </View>
            )}
            {filter.timeRange !== 'all' && (
              <View style={styles.activeFilter}>
                <Text style={styles.activeFilterText}>{filter.timeRange}</Text>
              </View>
            )}
          </ScrollView>
        </View>
      )}

      {/* Transactions List */}
      <FlatList
        style={styles.transactionsList}
        data={filteredAndSearchedTransactions}
        renderItem={renderTransaction}
        keyExtractor={item => item.id}
        refreshControl={
          <RefreshControl 
            refreshing={isLoading} 
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyText}>No transactions found</Text>
            <Text style={styles.emptySubtext}>
              Your transaction history will appear here
            </Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />

      {/* Filter Modal */}
      <Modal visible={showFilterModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter Transactions</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.filterContent}>
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Transaction Type</Text>
                <View style={styles.filterOptions}>
                  {[
                    'all',
                    'swap',
                    'send',
                    'receive',
                    'stake',
                    'unstake',
                    'defi',
                    'nft',
                  ].map(type => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.filterOption,
                        filter.type === type && styles.filterOptionSelected,
                      ]}
                      onPress={() => dispatch(setFilter({ type: type as any }))}
                    >
                      <Text
                        style={[
                          styles.filterOptionText,
                          filter.type === type && styles.filterOptionTextSelected,
                        ]}
                      >
                        {type === 'all'
                          ? 'All Types'
                          : `${getTypeIcon(type)} ${
                              type.charAt(0).toUpperCase() + type.slice(1)
                            }`}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Status</Text>
                <View style={styles.filterOptions}>
                  {['all', 'confirmed', 'pending', 'failed', 'cancelled'].map(
                    status => (
                      <TouchableOpacity
                        key={status}
                        style={[
                          styles.filterOption,
                          filter.status === status && styles.filterOptionSelected,
                        ]}
                        onPress={() =>
                          dispatch(setFilter({ status: status as any }))
                        }
                      >
                        <Text
                          style={[
                            styles.filterOptionText,
                            filter.status === status &&
                              styles.filterOptionTextSelected,
                          ]}
                        >
                          {status === 'all'
                            ? 'All Status'
                            : status.charAt(0).toUpperCase() + status.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    ),
                  )}
                </View>
              </View>

              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Network</Text>
                <View style={styles.filterOptions}>
                  {['all', 'solana', 'ethereum'].map(network => (
                    <TouchableOpacity
                      key={network}
                      style={[
                        styles.filterOption,
                        filter.network === network && styles.filterOptionSelected,
                      ]}
                      onPress={() =>
                        dispatch(setFilter({ network: network as any }))
                      }
                    >
                      <Text
                        style={[
                          styles.filterOptionText,
                          filter.network === network &&
                            styles.filterOptionTextSelected,
                        ]}
                      >
                        {network === 'all'
                          ? 'All Networks'
                          : `${getNetworkIcon(network)} ${
                              network.charAt(0).toUpperCase() + network.slice(1)
                            }`}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Time Range</Text>
                <View style={styles.filterOptions}>
                  {['all', '24h', '7d', '30d', '90d'].map(range => (
                    <TouchableOpacity
                      key={range}
                      style={[
                        styles.filterOption,
                        filter.timeRange === range && styles.filterOptionSelected,
                      ]}
                      onPress={() =>
                        dispatch(setFilter({ timeRange: range as any }))
                      }
                    >
                      <Text
                        style={[
                          styles.filterOptionText,
                          filter.timeRange === range &&
                            styles.filterOptionTextSelected,
                        ]}
                      >
                        {range === 'all' ? 'All Time' : range.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Transaction Details Modal */}
      {selectedTransaction && (
        <Modal visible={showDetailsModal} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Transaction Details</Text>
                <TouchableOpacity onPress={() => setShowDetailsModal(false)}>
                  <Text style={styles.modalClose}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.detailsContent}>
                <View style={styles.detailsHeader}>
                  <Text style={styles.detailsTypeIcon}>
                    {getTypeIcon(selectedTransaction.type)}
                  </Text>
                  <Text style={styles.detailsDescription}>
                    {selectedTransaction.description}
                  </Text>
                  <View
                    style={[
                      styles.detailsStatus,
                      {
                        backgroundColor: getStatusColor(
                          selectedTransaction.status,
                        ),
                      },
                    ]}
                  >
                    <Text style={styles.detailsStatusText}>
                      {selectedTransaction.status.toUpperCase()}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailsSection}>
                  <Text style={styles.detailsSectionTitle}>Blockchain Info</Text>
                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsLabel}>Hash</Text>
                    <Text style={styles.detailsValue}>
                      {selectedTransaction.hash}
                    </Text>
                  </View>
                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsLabel}>Network</Text>
                    <Text style={styles.detailsValue}>
                      {getNetworkIcon(selectedTransaction.network)}{' '}
                      {selectedTransaction.network.charAt(0).toUpperCase() +
                        selectedTransaction.network.slice(1)}
                    </Text>
                  </View>
                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsLabel}>Date & Time</Text>
                    <Text style={styles.detailsValue}>
                      {new Date(selectedTransaction.timestamp).toLocaleString()}
                    </Text>
                  </View>
                  {selectedTransaction.blockNumber && (
                    <View style={styles.detailsRow}>
                      <Text style={styles.detailsLabel}>Block</Text>
                      <Text style={styles.detailsValue}>
                        {selectedTransaction.blockNumber.toLocaleString()}
                      </Text>
                    </View>
                  )}
                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsLabel}>Confirmations</Text>
                    <Text style={styles.detailsValue}>
                      {selectedTransaction.confirmations}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailsSection}>
                  <Text style={styles.detailsSectionTitle}>Financial Details</Text>
                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsLabel}>Amount</Text>
                    <Text style={styles.detailsValue}>
                      {selectedTransaction.amount}{' '}
                      {selectedTransaction.tokenSymbol}
                    </Text>
                  </View>
                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsLabel}>USD Value</Text>
                    <Text style={styles.detailsValue}>
                      {formatCurrency(selectedTransaction.usdValue)}
                    </Text>
                  </View>
                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsLabel}>Network Fee</Text>
                    <Text style={styles.detailsValue}>
                      {selectedTransaction.fee} {selectedTransaction.feeSymbol}
                    </Text>
                  </View>
                </View>

                {/* Swap Details */}
                {selectedTransaction.type === 'swap' &&
                  selectedTransaction.metadata?.swapDetails && (
                    <View style={styles.detailsSection}>
                      <Text style={styles.detailsSectionTitle}>Swap Details</Text>
                      <View style={styles.detailsRow}>
                        <Text style={styles.detailsLabel}>Protocol</Text>
                        <Text style={styles.detailsValue}>
                          {selectedTransaction.metadata.swapDetails.protocol}
                        </Text>
                      </View>
                      <View style={styles.detailsRow}>
                        <Text style={styles.detailsLabel}>From</Text>
                        <Text style={styles.detailsValue}>
                          {selectedTransaction.metadata.swapDetails.fromAmount}{' '}
                          {selectedTransaction.metadata.swapDetails.fromToken}
                        </Text>
                      </View>
                      <View style={styles.detailsRow}>
                        <Text style={styles.detailsLabel}>To</Text>
                        <Text style={styles.detailsValue}>
                          {selectedTransaction.metadata.swapDetails.toAmount}{' '}
                          {selectedTransaction.metadata.swapDetails.toToken}
                        </Text>
                      </View>
                      <View style={styles.detailsRow}>
                        <Text style={styles.detailsLabel}>Slippage</Text>
                        <Text style={styles.detailsValue}>
                          {selectedTransaction.metadata.swapDetails.slippage}%
                        </Text>
                      </View>
                      <View style={styles.detailsRow}>
                        <Text style={styles.detailsLabel}>Price Impact</Text>
                        <Text
                          style={[
                            styles.detailsValue,
                            { color: getStatusColor('pending') },
                          ]}
                        >
                          {selectedTransaction.metadata.swapDetails.priceImpact}%
                        </Text>
                      </View>
                    </View>
                  )}

                {/* DeFi Details */}
                {selectedTransaction.type === 'defi' &&
                  selectedTransaction.metadata?.defiDetails && (
                    <View style={styles.detailsSection}>
                      <Text style={styles.detailsSectionTitle}>DeFi Details</Text>
                      <View style={styles.detailsRow}>
                        <Text style={styles.detailsLabel}>Protocol</Text>
                        <Text style={styles.detailsValue}>
                          {selectedTransaction.metadata.defiDetails.protocol}
                        </Text>
                      </View>
                      <View style={styles.detailsRow}>
                        <Text style={styles.detailsLabel}>Action</Text>
                        <Text style={styles.detailsValue}>
                          {selectedTransaction.metadata.defiDetails.action.replace(
                            '_',
                            ' ',
                          )}
                        </Text>
                      </View>
                      {selectedTransaction.metadata.defiDetails.apr && (
                        <View style={styles.detailsRow}>
                          <Text style={styles.detailsLabel}>APR</Text>
                          <Text style={styles.detailsValue}>
                            {selectedTransaction.metadata.defiDetails.apr}%
                          </Text>
                        </View>
                      )}
                    </View>
                  )}
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

export default TransactionScreen;
