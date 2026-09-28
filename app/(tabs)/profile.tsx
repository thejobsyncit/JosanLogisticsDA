import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, radius, spacing, typography } from "@constants/theme";
import { useAuth } from "@/hooks/useAuth";
import { useDriverPerformance } from "@/hooks/useDriverProfile";
import { Card } from "@/components/Card";
import { ConfirmationModal } from "@/components/ConfirmationModal";
import { TextField } from "@/components/TextField";
import { PrimaryButton } from "@/components/PrimaryButton";
import { initialsFromName } from "@utils/format";
import { SosModal } from "@/components/SosModal";

const MENU_ITEMS: { key: string; label: string; icon: keyof typeof Ionicons.glyphMap; route: string }[] = [
  { key: "earnings", label: "My Earnings & Payouts", icon: "wallet-outline", route: "/earnings" },
  { key: "vehicle", label: "Assigned Vehicle", icon: "car-outline", route: "/vehicle" },
  { key: "schedule", label: "Shift Schedule", icon: "calendar-outline", route: "/schedule" },
  { key: "documents", label: "Documents", icon: "document-text-outline", route: "/documents" },
  { key: "settings", label: "Settings", icon: "settings-outline", route: "/settings" },
  { key: "help", label: "Help & Support", icon: "help-circle-outline", route: "/help" },
];

/** Driver Profile — identity, performance summary, account editing, photo upload & editing. */
export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { driver, logout, updateProfile } = useAuth();
  const { data: performance } = useDriverPerformance();
  const [confirmingLogout, setConfirmingLogout] = useState(false);
  const [showSosModal, setShowSosModal] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // Profile Edit Form State
  const [editName, setEditName] = useState(driver?.name ?? "");
  const [editPhone, setEditPhone] = useState(driver?.phone ?? "");
  const [editEmail, setEditEmail] = useState(driver?.email ?? "");
  const [editVehiclePlate, setEditVehiclePlate] = useState(driver?.vehiclePlate ?? "");
  const [editAvatarUrl, setEditAvatarUrl] = useState(driver?.avatarUrl ?? "");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; phone?: string; email?: string }>({});

  const openEditModal = () => {
    setEditName(driver?.name ?? "");
    setEditPhone(driver?.phone ?? "");
    setEditEmail(driver?.email ?? "");
    setEditVehiclePlate(driver?.vehiclePlate ?? "");
    setEditAvatarUrl(driver?.avatarUrl ?? "");
    setErrors({});
    setIsEditingProfile(true);
  };

  const handlePickImage = async (source: "camera" | "library") => {
    setShowPhotoOptions(false);
    try {
      if (source === "camera") {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Permission Required", "Camera permission is needed to take a profile photo.");
          return;
        }
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Permission Required", "Photo gallery access is needed to select a profile photo.");
          return;
        }
      }

      const pickerOptions: ImagePicker.ImagePickerOptions = {
        mediaTypes: ["images"],
        allowsEditing: true, // Opens built-in crop & edit interface
        aspect: [1, 1],
        quality: 0.8,
      };

      const result =
        source === "camera"
          ? await ImagePicker.launchCameraAsync(pickerOptions)
          : await ImagePicker.launchImageLibraryAsync(pickerOptions);

      if (!result.canceled && result.assets && result.assets[0]) {
        const newUri = result.assets[0].uri;
        setEditAvatarUrl(newUri);
        
        // Save immediately to backend & state
        setIsUploadingPhoto(true);
        await updateProfile({ avatarUrl: newUri });
        Alert.alert("Success", "Profile photo updated successfully!");
      }
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Failed to update profile photo.");
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = async () => {
    setShowPhotoOptions(false);
    try {
      setIsUploadingPhoto(true);
      setEditAvatarUrl("");
      await updateProfile({ avatarUrl: "" });
      Alert.alert("Photo Removed", "Profile photo has been removed.");
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Failed to remove photo.");
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleSaveProfile = async () => {
    const errs: { name?: string; phone?: string; email?: string } = {};
    if (!editName.trim()) errs.name = "Name cannot be empty.";
    if (!editPhone.trim()) errs.phone = "Phone number is required.";
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSaving(true);
    try {
      await updateProfile({
        name: editName.trim(),
        phone: editPhone.trim(),
        email: editEmail.trim(),
        vehiclePlate: editVehiclePlate.trim() || undefined,
        avatarUrl: editAvatarUrl,
      });
      setIsEditingProfile(false);
      Alert.alert("Success", "Profile updated successfully!");
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Failed to update profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const currentPhoto = isEditingProfile ? editAvatarUrl : driver?.avatarUrl;

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={[
        styles.content,
        { paddingTop: Math.max(insets.top + spacing.sm, spacing.lg) },
      ]}
    >
      <View style={styles.header}>
        <View style={styles.avatarWrap}>
          <Pressable
            style={styles.avatar}
            onPress={() => setShowPhotoOptions(true)}
            accessibilityRole="button"
            accessibilityLabel="Change profile photo"
          >
            {isUploadingPhoto ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : driver?.avatarUrl ? (
              <Image source={{ uri: driver.avatarUrl }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>{initialsFromName(driver?.name ?? "Driver")}</Text>
            )}
          </Pressable>
          <Pressable
            style={styles.avatarEditBadge}
            accessibilityRole="button"
            accessibilityLabel="Edit profile photo"
            onPress={() => setShowPhotoOptions(true)}
          >
            <Ionicons name="camera" size={14} color={colors.white} />
          </Pressable>
        </View>

        <Text style={styles.name}>{driver?.name ?? "Driver"}</Text>
        <Text style={styles.subtext}>
          {driver?.employeeId ?? "--"} · {driver?.hub ?? "Unassigned Hub"}
        </Text>

        <Pressable style={styles.editButton} onPress={openEditModal} accessibilityRole="button">
          <Ionicons name="create-outline" size={16} color={colors.primary} />
          <Text style={styles.editButtonText}>Edit Profile</Text>
        </Pressable>
      </View>

      <Card style={styles.infoCard}>
        <View style={styles.infoCardHeader}>
          <Text style={styles.sectionTitle}>Personal Details</Text>
          <Pressable onPress={openEditModal} accessibilityRole="button">
            <Text style={styles.cardEditLink}>Edit</Text>
          </Pressable>
        </View>
        <InfoRow icon="call-outline" label="Phone" value={driver?.phone ?? "--"} />
        <InfoRow icon="mail-outline" label="Email" value={driver?.email ?? "--"} />
        <InfoRow icon="car-outline" label="Vehicle" value={driver?.vehiclePlate ?? "Not assigned"} />
      </Card>

      {performance ? (
        <Card style={styles.performanceCard}>
          <Text style={styles.sectionTitle}>Performance</Text>
          <View style={styles.statsRow}>
            <Stat label="Rating" value={performance.rating.toFixed(1)} />
            <Stat label="On-Time" value={`${performance.onTimeDeliveryPct}%`} />
            <Stat label="Success" value={`${performance.successfulDeliveryPct}%`} />
            <Stat label="Safety" value={`${performance.safetyScorePct}%`} />
          </View>
        </Card>
      ) : null}

      <Card style={styles.menuCard}>
        {MENU_ITEMS.map((item, index) => (
          <View key={item.key}>
            <Pressable
              style={styles.menuRow}
              accessibilityRole="button"
              accessibilityLabel={item.label}
              onPress={() => router.navigate(item.route as any)}
            >
              <Ionicons name={item.icon} size={20} color={colors.textPrimary} />
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </Pressable>
            {index < MENU_ITEMS.length - 1 ? <View style={styles.divider} /> : null}
          </View>
        ))}
      </Card>

      <Pressable
        style={styles.sosRow}
        accessibilityRole="button"
        accessibilityLabel="Emergency SOS"
        onPress={() => setShowSosModal(true)}
      >
        <Ionicons name="alert-circle" size={20} color={colors.error} />
        <Text style={styles.sosLabel}>🚨 Emergency SOS Alert</Text>
      </Pressable>

      <Pressable
        style={styles.logoutRow}
        accessibilityRole="button"
        accessibilityLabel="Log out"
        onPress={() => setConfirmingLogout(true)}
      >
        <Ionicons name="log-out-outline" size={20} color={colors.error} />
        <Text style={styles.logoutLabel}>Log Out</Text>
      </Pressable>

      {/* Photo Options Modal */}
      <Modal
        visible={showPhotoOptions}
        animationType="fade"
        transparent
        onRequestClose={() => setShowPhotoOptions(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowPhotoOptions(false)}>
          <View style={styles.actionSheetContainer}>
            <Text style={styles.actionSheetTitle}>Profile Photo</Text>
            <Text style={styles.actionSheetSubtitle}>Add or edit your profile picture</Text>

            <Pressable style={styles.actionOption} onPress={() => handlePickImage("camera")}>
              <Ionicons name="camera-outline" size={22} color={colors.primary} />
              <Text style={styles.actionOptionText}>Take Photo</Text>
            </Pressable>

            <Pressable style={styles.actionOption} onPress={() => handlePickImage("library")}>
              <Ionicons name="images-outline" size={22} color={colors.primary} />
              <Text style={styles.actionOptionText}>Choose from Gallery</Text>
            </Pressable>

            {currentPhoto ? (
              <Pressable style={styles.actionOption} onPress={handleRemovePhoto}>
                <Ionicons name="trash-outline" size={22} color={colors.error} />
                <Text style={[styles.actionOptionText, { color: colors.error }]}>Remove Current Photo</Text>
              </Pressable>
            ) : null}

            <Pressable style={styles.actionCancel} onPress={() => setShowPhotoOptions(false)}>
              <Text style={styles.actionCancelText}>Cancel</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      {/* Edit Profile Modal */}
      <Modal visible={isEditingProfile} animationType="slide" transparent onRequestClose={() => setIsEditingProfile(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <Pressable onPress={() => setIsEditingProfile(false)} hitSlop={8}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.formContent} keyboardShouldPersistTaps="handled">
              {/* Profile Photo Editor Section in Modal */}
              <View style={styles.modalAvatarContainer}>
                <View style={styles.modalAvatarWrap}>
                  <View style={styles.avatar}>
                    {editAvatarUrl ? (
                      <Image source={{ uri: editAvatarUrl }} style={styles.avatarImage} />
                    ) : (
                      <Text style={styles.avatarText}>{initialsFromName(editName || "Driver")}</Text>
                    )}
                  </View>
                  <Pressable style={styles.avatarEditBadge} onPress={() => setShowPhotoOptions(true)}>
                    <Ionicons name="camera" size={14} color={colors.white} />
                  </Pressable>
                </View>
                <Pressable style={styles.changePhotoButton} onPress={() => setShowPhotoOptions(true)}>
                  <Ionicons name="image-outline" size={16} color={colors.primary} />
                  <Text style={styles.changePhotoText}>
                    {editAvatarUrl ? "Change Photo" : "Add Profile Photo"}
                  </Text>
                </Pressable>
              </View>

              <TextField
                label="Full Name"
                value={editName}
                onChangeText={(val) => {
                  setEditName(val);
                  if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
                }}
                error={errors.name}
              />

              <TextField
                label="Phone Number"
                value={editPhone}
                onChangeText={(val) => {
                  setEditPhone(val);
                  if (errors.phone) setErrors((prev) => ({ ...prev, phone: undefined }));
                }}
                keyboardType="phone-pad"
                error={errors.phone}
              />

              <TextField
                label="Email Address"
                value={editEmail}
                onChangeText={(val) => {
                  setEditEmail(val);
                  if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                error={errors.email}
              />

              <TextField
                label="Assigned Vehicle Plate"
                value={editVehiclePlate}
                onChangeText={setEditVehiclePlate}
                autoCapitalize="characters"
              />

              <View style={styles.modalActions}>
                <PrimaryButton label="Save Changes" onPress={handleSaveProfile} loading={saving} />
                <Pressable style={styles.cancelButton} onPress={() => setIsEditingProfile(false)} disabled={saving}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <SosModal visible={showSosModal} onClose={() => setShowSosModal(false)} />

      <ConfirmationModal
        visible={confirmingLogout}
        title="Log out?"
        message="You'll need to sign in again to view your trips."
        confirmLabel="Log Out"
        destructive
        onConfirm={async () => {
          setConfirmingLogout(false);
          await logout();
        }}
        onCancel={() => setConfirmingLogout(false)}
      />
    </ScrollView>
  );
}

function InfoRow({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={18} color={colors.textSecondary} />
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
  header: { alignItems: "center", gap: 4, marginBottom: spacing.sm },
  avatarWrap: { position: "relative", marginBottom: spacing.xs },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: 76,
    height: 76,
    borderRadius: 38,
    resizeMode: "cover",
  },
  avatarText: {
    fontSize: typography.h2.fontSize,
    fontWeight: "700",
    color: colors.primary,
  },
  avatarEditBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: colors.primary,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.card,
  },
  name: {
    fontSize: typography.h3.fontSize,
    fontWeight: typography.h3.fontWeight,
    color: colors.textPrimary,
  },
  subtext: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.textSecondary,
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    marginTop: spacing.xs,
  },
  editButtonText: {
    fontSize: typography.caption.fontSize,
    fontWeight: "700",
    color: colors.primary,
  },
  infoCard: { gap: spacing.sm + 2 },
  infoCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  cardEditLink: {
    fontSize: typography.bodySmall.fontSize,
    fontWeight: "700",
    color: colors.primary,
  },
  infoRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  infoLabel: { fontSize: typography.bodySmall.fontSize, color: colors.textSecondary, width: 60 },
  infoValue: { flex: 1, fontSize: typography.bodySmall.fontSize, color: colors.textPrimary, fontWeight: "600", textAlign: "right" },
  performanceCard: { gap: spacing.sm + 4 },
  sectionTitle: {
    fontSize: typography.h3.fontSize,
    fontWeight: typography.h3.fontWeight,
    color: colors.textPrimary,
  },
  statsRow: { flexDirection: "row", justifyContent: "space-between" },
  stat: { alignItems: "center", gap: 2 },
  statValue: { fontSize: typography.bodyMedium.fontSize, fontWeight: "700", color: colors.textPrimary },
  statLabel: { fontSize: typography.caption.fontSize, color: colors.textSecondary },
  menuCard: { padding: 0, overflow: "hidden" },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  menuLabel: { flex: 1, fontSize: typography.bodySmall.fontSize, fontWeight: "600", color: colors.textPrimary },
  divider: { height: 1, backgroundColor: colors.border, marginLeft: spacing.md + 28 },
  logoutRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  logoutLabel: { fontSize: typography.bodySmall.fontSize, fontWeight: "700", color: colors.error },
  sosRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
    backgroundColor: "#FEE2E2",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FCA5A5",
    marginTop: spacing.xs,
  },
  sosLabel: { fontSize: typography.bodySmall.fontSize, fontWeight: "800", color: colors.error },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    padding: spacing.lg,
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: typography.h2.fontSize,
    fontWeight: typography.h2.fontWeight,
    color: colors.textPrimary,
  },
  modalAvatarContainer: {
    alignItems: "center",
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  modalAvatarWrap: {
    position: "relative",
  },
  changePhotoButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  changePhotoText: {
    fontSize: typography.bodySmall.fontSize,
    fontWeight: "600",
    color: colors.primary,
  },
  formContent: {
    gap: spacing.md,
    paddingBottom: spacing.lg,
  },
  modalActions: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  cancelButton: {
    paddingVertical: spacing.sm,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.textSecondary,
    fontWeight: "600",
  },

  // Action Sheet / Photo Modal Styles
  actionSheetContainer: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    padding: spacing.lg,
    gap: spacing.sm,
    width: "100%",
  },
  actionSheetTitle: {
    fontSize: typography.h3.fontSize,
    fontWeight: typography.h3.fontWeight,
    color: colors.textPrimary,
    textAlign: "center",
  },
  actionSheetSubtitle: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: spacing.xs,
  },
  actionOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.background,
    borderRadius: radius.button,
  },
  actionOptionText: {
    fontSize: typography.bodyMedium.fontSize,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  actionCancel: {
    marginTop: spacing.xs,
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  actionCancelText: {
    fontSize: typography.bodyMedium.fontSize,
    fontWeight: "700",
    color: colors.textSecondary,
  },
});
