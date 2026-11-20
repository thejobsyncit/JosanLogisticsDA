import React from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LoginErrorInfo } from "@/utils/loginError";

const JOSAN_ORANGE = "#F77F28";

export interface LoginErrorModalProps {
  visible: boolean;
  error: LoginErrorInfo | null;
  onDismiss: () => void;
  onRetry?: () => void;
}

/**
 * Maps login error categories to contextual icons.
 */
function getCategoryIcon(category?: string): keyof typeof Ionicons.glyphMap {
  switch (category) {
    case "ACCOUNT_NOT_FOUND":
      return "person-remove-outline";
    case "INVALID_CREDENTIALS":
      return "lock-closed-outline";
    case "ACCOUNT_INACTIVE":
      return "ban-outline";
    case "NETWORK_ERROR":
      return "cloud-offline-outline";
    case "REQUEST_TIMEOUT":
      return "timer-outline";
    case "SERVER_ERROR":
      return "server-outline";
    case "TOO_MANY_ATTEMPTS":
      return "warning-outline";
    case "SESSION_EXPIRED":
      return "log-out-outline";
    case "UNEXPECTED_ERROR":
    default:
      return "alert-circle-outline";
  }
}

/**
 * Unified branded error modal popup for Josan Logistics Driver App login.
 * Supports all 9 error categories, optional retry for network/timeout errors,
 * and masks internal details.
 */
export function LoginErrorModal({ visible, error, onDismiss, onRetry }: LoginErrorModalProps) {
  if (!error) return null;

  const iconName = getCategoryIcon(error.category);
  const showRetry = Boolean(error.canRetry && onRetry);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.dialog} accessibilityRole="alert">
          {/* Accent icon container */}
          <View style={styles.iconContainer}>
            <Ionicons name={iconName} size={30} color={JOSAN_ORANGE} />
          </View>

          {/* Title */}
          <Text style={styles.title}>{error.title}</Text>

          {/* Message */}
          <Text style={styles.message}>{error.message}</Text>

          {/* Action Buttons */}
          {showRetry ? (
            <View style={styles.buttonRow}>
              <Pressable
                style={({ pressed }) => [styles.dismissSecondaryButton, pressed && styles.buttonPressed]}
                onPress={onDismiss}
                accessibilityRole="button"
                accessibilityLabel="Dismiss error dialog"
              >
                <Text style={styles.dismissSecondaryText}>Dismiss</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.retryPrimaryButton, pressed && styles.buttonPressed]}
                onPress={() => {
                  onDismiss();
                  onRetry?.();
                }}
                accessibilityRole="button"
                accessibilityLabel="Retry authentication request"
              >
                <Text style={styles.retryPrimaryText}>Retry</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable
              style={({ pressed }) => [styles.okButton, pressed && styles.buttonPressed]}
              onPress={onDismiss}
              accessibilityRole="button"
              accessibilityLabel="OK, dismiss error message"
            >
              <Text style={styles.okButtonText}>OK</Text>
            </Pressable>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  dialog: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 22,
    alignItems: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(247, 127, 40, 0.12)",
    borderWidth: 1.5,
    borderColor: "rgba(247, 127, 40, 0.28)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F1F1F",
    textAlign: "center",
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  buttonRow: {
    width: "100%",
    flexDirection: "row",
    gap: 12,
  },
  dismissSecondaryButton: {
    flex: 1,
    height: 48,
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  dismissSecondaryText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#4B5563",
  },
  retryPrimaryButton: {
    flex: 1,
    height: 48,
    backgroundColor: JOSAN_ORANGE,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  retryPrimaryText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  okButton: {
    width: "100%",
    height: 48,
    backgroundColor: JOSAN_ORANGE,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonPressed: {
    opacity: 0.88,
  },
  okButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
});

export default LoginErrorModal;
