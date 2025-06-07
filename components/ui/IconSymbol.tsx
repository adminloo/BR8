// Fallback for using MaterialIcons on Android and web.

import { SymbolWeight } from 'expo-symbols';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';
import { SFSymbol } from "react-native-sfsymbols";

type IconMapping = {
  'house.fill': string;
  'paperplane.fill': string;
  'chevron.left.forwardslash.chevron.right': string;
  'chevron.right': string;
  'figure.roll': string;
  'figure.and.child.holdinghands': string;
  'toilet.fill': string;
};

const MAPPING = {
  'house.fill': 'home',
  'paperplane.fill': 'send',
  'chevron.left.forwardslash.chevron.right': 'code',
  'chevron.right': 'chevron-right',
  'figure.roll': 'accessible',
  'figure.and.child.holdinghands': 'family-restroom',
  'toilet.fill': 'toilet',
} as IconMapping;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: keyof IconMapping;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return (
    <SFSymbol
      name={name}
      size={size}
      color={color}
      resizeMode="center"
      multicolor={false}
    />
  );
}
