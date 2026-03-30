import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

export type GuideItemType = 'action' | 'indicator' | 'chart' | 'data' | 'warning';

export interface GuideItem {
  icon: string;
  title: string;
  description: string;
  type?: GuideItemType;
  example?: string; // "e.g. ..." shown in a small chip
}

const TYPE_COLORS: Record<GuideItemType, string> = {
  action:    '#00e5ff',
  indicator: '#00ff88',
  chart:     '#da4bff',
  data:      '#ffab00',
  warning:   '#ff1744',
};

const TYPE_LABELS: Record<GuideItemType, string> = {
  action:    'CLICKABLE',
  indicator: 'INDICATOR',
  chart:     'VISUAL',
  data:      'DATA',
  warning:   'ALERT',
};

interface Props {
  screenTitle: string;
  items: GuideItem[];
}

export function DemoGuideButton({ screenTitle, items }: Props) {
  const [visible, setVisible] = useState(false);
  const { colors } = useTheme();

  return (
    <>
      <TouchableOpacity
        style={[styles.helpBtn, { borderColor: colors.cyan + '55', backgroundColor: colors.bgSurface2 }]}
        onPress={() => setVisible(true)}
        activeOpacity={0.7}
      >
        <Text style={[styles.helpBtnText, { color: colors.cyan }]}>?</Text>
      </TouchableOpacity>

      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={() => setVisible(false)}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={() => setVisible(false)}
        />
        <View style={[styles.sheet, { backgroundColor: colors.bgSurface }]}>
          {/* Header */}
          <View style={[styles.sheetHeader, { borderBottomColor: colors.border }]}>
            <View style={styles.sheetTitleRow}>
              <Ionicons name="information-circle-outline" size={18} color={colors.cyan} />
              <Text style={[styles.sheetTitle, { color: colors.cyan }]}>
                HOW TO USE — {screenTitle.toUpperCase()}
              </Text>
            </View>
            <TouchableOpacity onPress={() => setVisible(false)} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.sheetBody} showsVerticalScrollIndicator={false}>
            <Text style={[styles.introText, { color: colors.textSecondary }]}>
              Tap any item below to learn what it does. Items marked{' '}
              <Text style={{ color: TYPE_COLORS.action, fontWeight: '700' }}>CLICKABLE</Text>
              {' '}are interactive buttons you can press.
            </Text>

            {items.map((item, i) => {
              const typeKey = (item.type ?? 'data') as GuideItemType;
              const accent  = TYPE_COLORS[typeKey];
              const label   = TYPE_LABELS[typeKey];
              return (
                <View
                  key={i}
                  style={[styles.guideItem, { borderLeftColor: accent, backgroundColor: colors.bg }]}
                >
                  <View style={styles.guideItemTop}>
                    <View style={[styles.iconCircle, { backgroundColor: accent + '20' }]}>
                      <Ionicons name={item.icon as any} size={16} color={accent} />
                    </View>
                    <View style={styles.guideItemText}>
                      <View style={styles.guideItemTitleRow}>
                        <Text style={[styles.guideItemTitle, { color: colors.textPrimary }]}>
                          {item.title}
                        </Text>
                        <View style={[styles.typePill, { backgroundColor: accent + '20' }]}>
                          <Text style={[styles.typePillText, { color: accent }]}>{label}</Text>
                        </View>
                      </View>
                      <Text style={[styles.guideItemDesc, { color: colors.textSecondary }]}>
                        {item.description}
                      </Text>
                      {item.example ? (
                        <Text style={[styles.guideItemExample, { color: colors.textMuted, borderColor: colors.border }]}>
                          {item.example}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                </View>
              );
            })}

            <View style={[styles.tipBox, { backgroundColor: colors.cyan + '10', borderColor: colors.cyan + '30' }]}>
              <Ionicons name="bulb-outline" size={14} color={colors.cyan} />
              <Text style={[styles.tipText, { color: colors.textSecondary }]}>
                <Text style={{ color: colors.cyan, fontWeight: '700' }}>TIP: </Text>
                Pull down (swipe from top) on any screen to manually refresh all sensor data from the backend.
              </Text>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  helpBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpBtnText: {
    fontFamily: 'monospace',
    fontSize: 13,
    fontWeight: '900',
    lineHeight: 16,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheet: {
    maxHeight: '85%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
    ...(Platform.OS === 'web' ? {
      maxWidth: 640,
      alignSelf: 'center',
      width: '100%',
      borderRadius: 16,
      marginHorizontal: 16,
      marginBottom: 20,
    } : {}),
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  sheetTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  sheetTitle: {
    fontFamily: 'monospace',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  closeBtn: {
    padding: 4,
  },
  sheetBody: {
    padding: 16,
    paddingBottom: 32,
    gap: 10,
  },
  introText: {
    fontFamily: 'monospace',
    fontSize: 10,
    lineHeight: 16,
    marginBottom: 6,
  },
  guideItem: {
    borderLeftWidth: 3,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  guideItemTop: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  guideItemText: {
    flex: 1,
    gap: 4,
  },
  guideItemTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  guideItemTitle: {
    fontFamily: 'monospace',
    fontSize: 11,
    fontWeight: '700',
    flex: 1,
  },
  typePill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  typePillText: {
    fontFamily: 'monospace',
    fontSize: 7,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  guideItemDesc: {
    fontFamily: 'monospace',
    fontSize: 10,
    lineHeight: 15,
  },
  guideItemExample: {
    fontFamily: 'monospace',
    fontSize: 9,
    lineHeight: 14,
    marginTop: 4,
    padding: 6,
    borderWidth: 1,
    borderRadius: 6,
    fontStyle: 'italic',
  },
  tipBox: {
    flexDirection: 'row',
    gap: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'flex-start',
    marginTop: 4,
  },
  tipText: {
    fontFamily: 'monospace',
    fontSize: 10,
    lineHeight: 15,
    flex: 1,
  },
});
