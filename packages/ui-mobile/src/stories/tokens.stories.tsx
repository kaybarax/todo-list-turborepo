// @ts-nocheck
import { type Meta, type StoryObj } from '@storybook/react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';

import { withUIKitten } from './decorators/UIKittenProvider';
import { lightColors } from '../../lib/tokens/colors';
import { spacing } from '../../lib/tokens/spacing';
import { fontSizes, fontWeights, lineHeights } from '../../lib/tokens/typography';

const meta = {
  title: 'Design System/Tokens',
  component: View,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Design tokens are the visual design atoms of the design system — specifically, they are named entities that store visual design attributes. We use them in place of hard-coded values (such as hex values for color or pixel values for spacing) in order to maintain a scalable and consistent visual system.',
      },
    },
  },
  decorators: [withUIKitten],
} satisfies Meta<typeof View>;

export default meta;
type Story = StoryObj<typeof meta>;

const ColorSwatch = ({ name, value }: { name: string; value: string }) => (
  <View style={styles.colorSwatch}>
    <View style={[styles.colorBox, { backgroundColor: value }]} />
    <Text style={styles.colorName}>{name}</Text>
    <Text style={styles.colorValue}>{value}</Text>
  </View>
);

const SpacingSwatch = ({ name, value }: { name: string; value: number }) => (
  <View style={styles.spacingSwatch}>
    <View style={[styles.spacingBox, { width: value, height: value }]} />
    <Text style={styles.spacingName}>{name}</Text>
    <Text style={styles.spacingValue}>{value}px</Text>
  </View>
);

const TypographyExample = ({ size, weight, lineHeight }: { size: number; weight: string; lineHeight: number }) => (
  <View style={styles.typographyExample}>
    <Text style={[styles.typographyText, { fontSize: size, fontWeight: weight, lineHeight }]}>
      The quick brown fox jumps over the lazy dog
    </Text>
    <Text style={styles.typographyMeta}>
      Size: {size}px, Weight: {weight}, Line Height: {lineHeight}
    </Text>
  </View>
);

const TokensStory = () => (
  <ScrollView style={styles.container}>
    <Text style={styles.title}>Design Tokens</Text>

    <Text style={styles.sectionTitle}>Colors - Light Theme</Text>
    <View style={styles.colorGrid}>
      {Object.entries(lightColors).map(([category, colors]) => (
        <View key={category} style={styles.colorCategory}>
          <Text style={styles.categoryTitle}>{category}</Text>
          <View style={styles.colorRow}>
            {typeof colors === 'object' && colors !== null ? (
              Object.entries(colors).map(([shade, value]) => (
                <ColorSwatch key={`${category}-${shade}`} name={`${category}.${shade}`} value={value as string} />
              ))
            ) : (
              <ColorSwatch name={category} value={colors as string} />
            )}
          </View>
        </View>
      ))}
    </View>

    <Text style={styles.sectionTitle}>Spacing</Text>
    <View style={styles.spacingGrid}>
      {Object.entries(spacing).map(([name, value]) => (
        <SpacingSwatch key={name} name={name} value={value} />
      ))}
    </View>

    <Text style={styles.sectionTitle}>Typography</Text>
    <View style={styles.typographySection}>
      {Object.entries(fontSizes).map(([sizeName, sizeValue]) => (
        <TypographyExample
          key={sizeName}
          size={sizeValue}
          weight={fontWeights.regular}
          lineHeight={lineHeights.normal}
        />
      ))}
    </View>
  </ScrollView>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 30,
    marginBottom: 15,
  },
  colorGrid: {
    gap: 15,
  },
  colorCategory: {
    marginBottom: 20,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  colorSwatch: {
    alignItems: 'center',
    margin: 5,
  },
  colorBox: {
    width: 60,
    height: 60,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  colorName: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 5,
  },
  colorValue: {
    fontSize: 10,
    color: '#666',
  },
  spacingGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
  },
  spacingSwatch: {
    alignItems: 'center',
    margin: 5,
  },
  spacingBox: {
    backgroundColor: '#007AFF',
    borderRadius: 4,
  },
  spacingName: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 5,
  },
  spacingValue: {
    fontSize: 10,
    color: '#666',
  },
  typographySection: {
    gap: 15,
  },
  typographyExample: {
    marginBottom: 15,
  },
  typographyText: {
    color: '#000',
  },
  typographyMeta: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
});

export const Tokens: Story = {
  render: () => <TokensStory />,
};
