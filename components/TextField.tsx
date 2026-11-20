import React from "react";
import { StyleSheet, Text, TextInput, TextInputProps, View } from "react-native";
import { colors, radius, spacing, typography } from "@constants/theme";

interface TextFieldProps extends TextInputProps {
  label: string;
  error?: string;
  rightAccessory?: React.ReactNode;
}

/** Standard labeled text input used across Login and other forms. */
export function TextField({ label, error, style, rightAccessory, ...rest }: TextFieldProps) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={[
            styles.input,
            error && styles.inputError,
            rightAccessory ? styles.inputWithAccessory : null,
            style,
          ]}
          placeholderTextColor={colors.textMuted}
          accessibilityLabel={label}
          {...rest}
        />
        {rightAccessory ? (
          <View style={styles.accessoryWrap}>{rightAccessory}</View>
        ) : null}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  inputContainer: {
    position: "relative",
    justifyContent: "center",
    width: "100%",
  },
  input: {
    height: 52,
    borderRadius: radius.button,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.warmOffWhite,
    paddingHorizontal: spacing.md,
    fontSize: typography.bodySmall.fontSize,
    color: colors.textPrimary,
  },
  inputWithAccessory: {
    paddingRight: 48,
  },
  accessoryWrap: {
    position: "absolute",
    right: 12,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  inputError: {
    borderColor: colors.error,
  },
  error: {
    fontSize: typography.caption.fontSize,
    color: colors.error,
  },
});

export default TextField;
