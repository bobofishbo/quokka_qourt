import { StyleSheet, TextInput, type TextInputProps } from 'react-native';
import { useThemeColor } from '@/hooks/use-theme-color';

export type ThemedTextInputProps = TextInputProps & {
  lightColor?: string;
  darkColor?: string;
  lightBorderColor?: string;
  darkBorderColor?: string;
};

export function ThemedTextInput({
  style,
  lightColor,
  darkColor,
  lightBorderColor,
  darkBorderColor,
  ...rest
}: ThemedTextInputProps) {
  const textColor = useThemeColor({ light: lightColor, dark: darkColor }, 'text');
  const borderColor = useThemeColor(
    { light: lightBorderColor, dark: darkBorderColor },
    'icon'
  );

  return (
    <TextInput
      style={[
        styles.input,
        { color: textColor, borderColor },
        style,
      ]}
      placeholderTextColor={borderColor}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 48,
  },
});
