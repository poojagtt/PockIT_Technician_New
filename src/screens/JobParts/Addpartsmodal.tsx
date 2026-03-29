import React, { useCallback, useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  LayoutAnimation,
  Platform,
  UIManager,
  FlatList,
} from 'react-native';
import { useTheme, Size, fontFamily } from '../../modules/themes';
import { apiCall } from '../../modules';
import { Icon, Button } from '../../components';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ── Types ─────────────────────────────────────────────────────────────────────
interface RateCard {
  ID: number;
  ITEM_NAME: string;
  SELLING_PRICE: string;
  INVENTORY_CATEGORY_ID: number;
  INVENTORY_CATEGORY_NAME: string;
  BRAND_NAME: string;
  DESCRIPTION: string;
  SKU_CODE: string;
  TAX_PREFERENCE: string;
  TAX_NAME: string;
}

type CategoryGroup = {
  categoryId: number;
  categoryName: string;
  items: RateCard[];
};

export type SelectedPart = {
  ID: number;
  ITEM_NAME: string;
  SELLING_PRICE: string;
  BRAND_NAME: string;
  quantity: number;
};

// ── Props ─────────────────────────────────────────────────────────────────────
interface AddPartsModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (selectedParts: SelectedPart[]) => void;
  addLoading?: boolean;
}

// ── Category Card with checkable item rows ────────────────────────────────────
const CategoryCard = ({
  group,
  isExpanded,
  onToggle,
  selectedIds,
  onToggleItem,
}: {
  group: CategoryGroup;
  isExpanded: boolean;
  onToggle: () => void;
  selectedIds: Set<number>;
  onToggleItem: (item: RateCard) => void;
}) => {
  const colors = useTheme();

  const selectedCount = group.items.filter((i) => selectedIds.has(i.ID)).length;
  const allSelected = selectedCount === group.items.length;
  const someSelected = selectedCount > 0 && !allSelected;

  const toggleAll = () => {
    // If all selected → deselect all, else select all
    group.items.forEach((item) => {
      const isSelected = selectedIds.has(item.ID);
      if (allSelected ? isSelected : !isSelected) {
        onToggleItem(item);
      }
    });
  };

  return (
    <View
      style={[
        styles.categoryCard,
        { backgroundColor: colors.white,  },
      ]}>
      {/* ── Header ── */}
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onToggle}
        style={[
          styles.categoryHeader,
          isExpanded && { borderBottomWidth: 0.5, borderBottomColor: colors.disable },
        ]}>
        <View style={[styles.accentBar, { backgroundColor: colors.primary }]} />

        <View style={styles.categoryHeaderInner}>
          {/* Select-all checkbox */}
          <TouchableOpacity
            onPress={toggleAll}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={[
              styles.checkbox,
              {
                borderColor: someSelected || allSelected ? colors.primary : colors.primary2,
                backgroundColor: allSelected ? colors.primary : 'transparent',
              },
            ]}>
            {allSelected && (
              <Icon name="check" type="AntDesign" size={12} color="#fff" />
            )}
            {someSelected && (
              <View style={[styles.indeterminate, { backgroundColor: colors.primary }]} />
            )}
          </TouchableOpacity>

          <View style={styles.categoryLeft}>
            <Text style={[styles.categoryName, { color: colors.heading }]} numberOfLines={1}>
              {group.categoryName}
            </Text>
            {/* <View style={[styles.countBadge, { backgroundColor: colors.primary + '18' }]}>
              <Text style={[styles.countText, { color: colors.primary }]}>
                {selectedCount > 0 ? `${selectedCount}/` : ''}{group.items.length}
              </Text>
            </View> */}
          </View>

          <View style={[styles.chevronWrap, { backgroundColor: colors.primary + '12' }]}>
            <Icon
              name={isExpanded ? 'chevron-up' : 'chevron-down'}
              type="MaterialCommunityIcons"
              size={18}
              color={colors.primary}
            />
          </View>
        </View>
      </TouchableOpacity>

      {/* ── Item rows ── */}
      {isExpanded &&
        group.items.map((item, index) => {
          const isChecked = selectedIds.has(item.ID);
          const isLast = index === group.items.length - 1;
          const price = parseFloat(item.SELLING_PRICE).toLocaleString('en-IN', {
            minimumFractionDigits: 2,
          });

          return (
            <TouchableOpacity
              key={String(item.ID)}
              activeOpacity={0.6}
              onPress={() => onToggleItem(item)}
              style={[
                styles.itemRow,
                isChecked && { backgroundColor: colors.primary + '08' },
                !isLast && { borderBottomWidth: 0.5, borderBottomColor: colors.disable },
              ]}>
              {/* Checkbox */}
              <View
                style={[
                  styles.checkbox,
                  {
                    borderColor: isChecked ? colors.primary : colors.primary2,
                    backgroundColor: isChecked ? colors.primary : 'transparent',
                  },
                ]}>
                {isChecked && (
                  <Icon name="check" type="AntDesign" size={12} color="#fff" />
                )}
              </View>

              {/* Name + Brand */}
              <View style={styles.itemInfo}>
                <Text
                  style={[
                    styles.itemName,
                    { color: isChecked ? colors.primary : colors.heading },
                  ]}
                  numberOfLines={1}>
                  {item.ITEM_NAME}
                </Text>
                {item.BRAND_NAME ? (
                  <Text style={[styles.brandName, { color: colors.textColor }]} numberOfLines={1}>
                    {item.BRAND_NAME}
                  </Text>
                ) : null}
              </View>

              {/* Price */}
              <View
                style={[
                  styles.priceBox,
                  { backgroundColor: isChecked ? colors.primary + '15' : colors.secondary + '12' },
                ]}>
                <Text style={[styles.priceSymbol, { color: isChecked ? colors.primary : colors.secondary }]}>
                  ₹
                </Text>
                <Text style={[styles.priceAmount, { color: isChecked ? colors.primary : colors.secondary }]}>
                  {price}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
    </View>
  );
};

// ── Modal ─────────────────────────────────────────────────────────────────────
export default function AddPartsModal({
  visible,
  onClose,
  onConfirm,
  addLoading = false,
}: AddPartsModalProps) {
  const colors = useTheme();
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [rateCardData, setRateCardData] = useState<RateCard[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [selectedItems, setSelectedItems] = useState<Map<number, RateCard>>(new Map());

  useEffect(() => {
    if (visible) {
      fetchRateCards();
      setSelectedIds(new Set());
      setSelectedItems(new Map());
      setSearch('');
    }
  }, [visible]);

  const fetchRateCards = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiCall.post('api/staticInventory/get', {});
      if (response.data.code === 200) {
        const data: RateCard[] = response.data.data;
        setRateCardData(data);
        setExpandedCategories(
          new Set<number>(data.map((item) => item.INVENTORY_CATEGORY_ID)),
        );
      }
    } catch (error) {
      console.error('Error fetching inventory:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const groupedData = useMemo<CategoryGroup[]>(() => {
    const trimmed = search.trim().toLowerCase();
    const filtered = trimmed
      ? rateCardData.filter(
          (i) =>
            i.ITEM_NAME.toLowerCase().includes(trimmed) ||
            i.INVENTORY_CATEGORY_NAME.toLowerCase().includes(trimmed) ||
            i.BRAND_NAME.toLowerCase().includes(trimmed),
        )
      : rateCardData;

    const map = new Map<number, CategoryGroup>();
    filtered.forEach((item) => {
      const existing = map.get(item.INVENTORY_CATEGORY_ID);
      if (existing) {
        existing.items.push(item);
      } else {
        map.set(item.INVENTORY_CATEGORY_ID, {
          categoryId: item.INVENTORY_CATEGORY_ID,
          categoryName: item.INVENTORY_CATEGORY_NAME,
          items: [item],
        });
      }
    });
    return Array.from(map.values()).sort((a, b) =>
      a.categoryName.localeCompare(b.categoryName),
    );
  }, [rateCardData, search]);

  const toggleCategory = useCallback((categoryId: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      next.has(categoryId) ? next.delete(categoryId) : next.add(categoryId);
      return next;
    });
  }, []);

  const toggleItem = useCallback((item: RateCard) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(item.ID) ? next.delete(item.ID) : next.add(item.ID);
      return next;
    });
    setSelectedItems((prev) => {
      const next = new Map(prev);
      next.has(item.ID) ? next.delete(item.ID) : next.set(item.ID, item);
      return next;
    });
  }, []);

  const handleConfirm = () => {
    const parts: SelectedPart[] = Array.from(selectedItems.values()).map((item) => ({
      ID: item.ID,
      ITEM_NAME: item.ITEM_NAME,
      SELLING_PRICE: item.SELLING_PRICE,
      BRAND_NAME: item.BRAND_NAME,
      quantity: 1,
    }));
    onConfirm(parts);
  };

  const selectedCount = selectedIds.size;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}>
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.primary }]}>
        <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

        {/* ── Header ── */}
        <View style={[styles.header, { backgroundColor: colors.primary }]}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Icon
                name="keyboard-backspace"
                type="MaterialCommunityIcons"
                size={24}
                color="#fff"
              />
            </TouchableOpacity>
            <View style={{ marginLeft: 8 }}>
              <Text style={styles.headerTitle}>Select Parts</Text>
              <Text style={styles.headerSub}>
                {rateCardData.length} items · {groupedData.length} categories
              </Text>
            </View>
          </View>

          {/* Selected count badge */}
          {selectedCount > 0 && (
            <View style={[styles.selectedBadge, { backgroundColor: colors.white }]}>
              <Text style={[styles.selectedBadgeText, { color: colors.primary }]}>
                {selectedCount} selected
              </Text>
            </View>
          )}
        </View>

        {/* ── Search ── */}
        <View style={[styles.searchWrap, { backgroundColor: colors.primary }]}>
          <View style={[styles.searchBox, { backgroundColor: colors.white }]}>
           <Icon name="search" type="Feather" size={24} color={colors.subHeading} style={{ marginRight: 6 }} />
            {/* <Text style={[styles.searchIcon, { color: colors.textColor }]}>🔍</Text> */}
            <TextInput
              style={[styles.searchInput, { color: colors.heading, fontFamily }]}
              placeholder="Search items, brand, category…"
              placeholderTextColor={colors.subHeading}
              value={search}
              onChangeText={setSearch}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Text style={{ color: colors.textColor, fontSize: 18, paddingRight: 8 }}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* ── Content ── */}
        {loading ? (
          <View style={{ backgroundColor: colors.background, flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            data={groupedData}
            keyExtractor={(item) => String(item.categoryId)}
            contentContainerStyle={[
              styles.listContent,
              { backgroundColor: colors.background },
            ]}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={[styles.emptyText, { color: colors.textColor }]}>
                  {search ? `No results for "${search}"` : 'No items found'}
                </Text>
              </View>
            }
            ListFooterComponent={<View style={{ height: 100 }} />}
            renderItem={({ item: group }) => (
              <CategoryCard
                group={group}
                isExpanded={expandedCategories.has(group.categoryId)}
                onToggle={() => toggleCategory(group.categoryId)}
                selectedIds={selectedIds}
                onToggleItem={toggleItem}
              />
            )}
          />
        )}

        {/* ── Sticky footer ── */}
        <View
          style={[
            styles.footer,
            {
              backgroundColor: colors.white,
              borderTopColor: colors.border,
            },
          ]}>
          {selectedCount > 0 && (
            <View style={[styles.selectionSummary, { backgroundColor: colors.primary + '10' }]}>
              <Text style={[styles.selectionSummaryText, { color: colors.primary }]} numberOfLines={1}>
                {Array.from(selectedItems.values())
                  .map((i) => i.ITEM_NAME)
                  .join(', ')}
              </Text>
            </View>
          )}

          <View style={styles.footerButtons}>
            <Button
              label="Cancel"
              primary={false}
              style={{ flex: 1 }}
              onPress={onClose}
            />
            <Button
              loading={addLoading}
              label={selectedCount > 0 ? `Request ${selectedCount} Part${selectedCount > 1 ? 's' : ''}` : 'Request Parts'}
              style={{ flex: 2 }}
              disabled={selectedCount === 0}
              onPress={handleConfirm}
            />
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Size.containerPadding,
    paddingTop: 14,
    paddingBottom: 12,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  headerTitle: {
    fontSize: Size['2xl'],
    fontFamily: 'SF-Pro-Text-Bold',
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.3,
  },
  headerSub: {
    fontSize: Size.sm,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2,
    fontFamily,
  },
  selectedBadge: {
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  selectedBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily,
  },

  searchWrap: { paddingHorizontal: Size.containerPadding, paddingBottom: 16 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: Size.paddingX,
    height: 44,
  },
  searchIcon: { fontSize: 14, marginRight: 6 },
  searchInput: { flex: 1, fontSize: 14, height: '100%' },

  listContent: {
    paddingHorizontal: Size.containerPadding,
    paddingTop: 12,
    flexGrow: 1,
  },

  // ── Category card ──
  categoryCard: {
    borderRadius: Size.radius,
    // borderWidth: 1,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  accentBar: { width: 4 },
  categoryHeaderInner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 10,
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  categoryName: {
    fontSize: Size.md,
    fontFamily: 'SF-Pro-Text-Bold',
    fontWeight: '700',
    flex: 1,
  },
  countBadge: {
    borderRadius: 20,
    minWidth: 28,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  countText: { fontSize: 12, fontWeight: '700', fontFamily },
  chevronWrap: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Checkbox ──
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1,
   
    alignItems: 'center',
    justifyContent: 'center',
  },
  indeterminate: {
    width: 10,
    height: 2,
    borderRadius: 1,
  },

  // ── Item row ──
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 11,
    gap: 10,
  },
  itemInfo: { flex: 1 },
  itemName: {
    fontSize: Size.sm,
    fontFamily: 'SF-Pro-Text-Bold',
    fontWeight: '700',
  },
  brandName: { fontSize: 11, fontFamily, marginTop: 1 },
  priceBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  priceSymbol: { fontSize: 11, fontWeight: '700', fontFamily, marginRight: 1, marginTop: 1 },
  priceAmount: { fontSize: 14, fontFamily: 'SF-Pro-Text-Bold', fontWeight: '800' },

  // ── Footer ──
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    paddingHorizontal: Size.containerPadding,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 28 : 16,
    gap: 10,
  },
  selectionSummary: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  selectionSummaryText: {
    fontSize: 12,
    fontFamily,
    fontWeight: '600',
  },
  footerButtons: {
    flexDirection: 'row',
    gap: 10,
  },

  empty: { flex: 1, alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: Size.md, fontFamily },
});