import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Header } from "@/components/Header";
import { Card } from "@/components/Card";
import { TextField } from "@/components/TextField";
import { PrimaryButton } from "@/components/PrimaryButton";
import { ConfirmationModal } from "@/components/ConfirmationModal";
import { colors, radius, spacing, typography } from "@constants/theme";
import { getVehicle, saveVehicleDetails, deleteVehicleDetails } from "@/services/driver";
import { useAuth } from "@/hooks/useAuth";

export default function VehicleScreen() {
  const { updateProfile } = useAuth();
  const [vehicle, setVehicle] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Modal & Edit State
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  // Form Fields
  const [plate, setPlate] = useState("");
  const [model, setModel] = useState("");
  const [capacity, setCapacity] = useState("");
  const [odometer, setOdometer] = useState("");
  const [insurance, setInsurance] = useState("");
  const [inspection, setInspection] = useState("");
  const [status, setStatus] = useState<"operational" | "maintenance" | "decommissioned">("operational");
  const [errors, setErrors] = useState<{ plate?: string; model?: string }>({});

  const fetchVehicleData = async () => {
    try {
      const data = await getVehicle();
      setVehicle(data);
    } catch (e) {
      console.warn("Failed to load vehicle:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicleData();
  }, []);

  const openAddModal = () => {
    setIsEditing(false);
    setPlate("");
    setModel("");
    setCapacity("14000");
    setOdometer("45200");
    setInsurance("2027-04-30");
    setInspection("2027-01-15");
    setStatus("operational");
    setErrors({});
    setIsModalVisible(true);
  };

  const openEditModal = () => {
    if (!vehicle) return openAddModal();
    setIsEditing(true);
    setPlate(vehicle.vehiclePlate || "");
    setModel(vehicle.vehicleType || "");
    setCapacity(vehicle.capacityKg ? String(vehicle.capacityKg) : "14000");
    setOdometer(vehicle.odometerKm ? String(vehicle.odometerKm) : "45200");
    setInsurance(vehicle.insuranceExpiry || "2027-04-30");
    setInspection(vehicle.inspectionExpiry || "2027-01-15");
    setStatus(vehicle.status || "operational");
    setErrors({});
    setIsModalVisible(true);
  };

  const handleSave = async () => {
    const errs: { plate?: string; model?: string } = {};
    if (!plate.trim()) errs.plate = "Vehicle plate number is required.";
    if (!model.trim()) errs.model = "Vehicle type/model is required.";
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSaving(true);
    try {
      const updatedData = {
        vehiclePlate: plate.trim().toUpperCase(),
        vehicleType: model.trim(),
        capacityKg: capacity ? parseInt(capacity, 10) : 14000,
        odometerKm: odometer ? parseInt(odometer, 10) : 45200,
        insuranceExpiry: insurance.trim() || "2027-04-30",
        inspectionExpiry: inspection.trim() || "2027-01-15",
        status,
      };

      await saveVehicleDetails(updatedData);
      await updateProfile({ vehiclePlate: updatedData.vehiclePlate });
      setVehicle(updatedData);
      setIsModalVisible(false);
      Alert.alert(
        "Success",
        isEditing ? "Vehicle details updated successfully!" : "Vehicle assigned successfully!"
      );
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Failed to save vehicle details.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setConfirmingDelete(false);
    setSaving(true);
    try {
      await deleteVehicleDetails();
      await updateProfile({ vehiclePlate: "" });
      setVehicle(null);
      Alert.alert("Unassigned", "Assigned vehicle has been removed.");
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Failed to delete vehicle details.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const statusBadgeStyle =
    status === "maintenance"
      ? styles.statusBadgeWarning
      : status === "decommissioned"
      ? styles.statusBadgeError
      : styles.statusBadgeSuccess;

  const statusTextLabel =
    vehicle?.status === "maintenance"
      ? "🟡 Under Maintenance"
      : vehicle?.status === "decommissioned"
      ? "🔴 Decommissioned"
      : "🟢 Operational";

  return (
    <View style={styles.flex}>
      <Header
        title="Assigned Vehicle Details"
        rightElement={
          <Pressable
            onPress={vehicle ? openEditModal : openAddModal}
            style={styles.headerIconButton}
            accessibilityRole="button"
            accessibilityLabel={vehicle ? "Edit vehicle" : "Add vehicle"}
          >
            <Ionicons name={vehicle ? "create-outline" : "add"} size={20} color={colors.primary} />
          </Pressable>
        }
      />

      <ScrollView contentContainerStyle={styles.content}>
        {!vehicle || !vehicle.vehiclePlate ? (
          // Empty State Component
          <Card style={styles.emptyCard}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="car-outline" size={48} color={colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>No Vehicle Assigned</Text>
            <Text style={styles.emptySubtitle}>
              You currently do not have a vehicle assigned to your driver profile. Click below to add or assign a vehicle.
            </Text>
            <PrimaryButton label="+ Add Assigned Vehicle" onPress={openAddModal} style={styles.addBtn} />
          </Card>
        ) : (
          // Vehicle Details View
          <>
            {/* Header Dark Card */}
            <View style={styles.headerCard}>
              <Text style={styles.plateText}>{vehicle.vehiclePlate}</Text>
              <Text style={styles.modelText}>{vehicle.vehicleType}</Text>
              <View style={[styles.statusBadge, statusBadgeStyle]}>
                <Text style={styles.statusText}>{statusTextLabel}</Text>
              </View>
            </View>

            {/* Specifications Card */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Specifications</Text>
              <DetailRow label="Vehicle Type" value={vehicle.vehicleType} />
              <DetailRow label="Cargo Capacity" value={`${vehicle.capacityKg || 14000} kg`} />
              <DetailRow label="Current Odometer" value={`${vehicle.odometerKm || 45200} km`} />
            </View>

            {/* Compliance & Inspection Card */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Compliance & Inspection</Text>
              <DetailRow label="Insurance Expiry" value={vehicle.insuranceExpiry || "2027-04-30"} />
              <DetailRow label="LTA Inspection Expiry" value={vehicle.inspectionExpiry || "2027-01-15"} />
              <DetailRow
                label="Maintenance Status"
                value={
                  vehicle.status === "maintenance"
                    ? "In Maintenance"
                    : vehicle.status === "decommissioned"
                    ? "Decommissioned"
                    : "Passed (Up to date)"
                }
              />
            </View>

            {/* Action Buttons Row */}
            <View style={styles.actionsContainer}>
              <Pressable style={styles.editCardBtn} onPress={openEditModal}>
                <Ionicons name="pencil" size={18} color={colors.white} />
                <Text style={styles.editCardBtnText}>Edit Vehicle</Text>
              </Pressable>

              <Pressable style={styles.deleteCardBtn} onPress={() => setConfirmingDelete(true)}>
                <Ionicons name="trash-outline" size={18} color={colors.error} />
                <Text style={styles.deleteCardBtnText}>Unassign Vehicle</Text>
              </Pressable>
            </View>
          </>
        )}
      </ScrollView>

      {/* Add / Edit Vehicle Modal */}
      <Modal visible={isModalVisible} animationType="slide" transparent onRequestClose={() => setIsModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{isEditing ? "Edit Vehicle Details" : "Add Vehicle Details"}</Text>
              <Pressable onPress={() => setIsModalVisible(false)} hitSlop={8}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.formContent} keyboardShouldPersistTaps="handled">
              <TextField
                label="Vehicle Plate Number *"
                value={plate}
                onChangeText={(val) => {
                  setPlate(val);
                  if (errors.plate) setErrors((prev) => ({ ...prev, plate: undefined }));
                }}
                autoCapitalize="characters"
                placeholder="e.g. SG-8819"
                error={errors.plate}
              />

              <TextField
                label="Vehicle Model / Type *"
                value={model}
                onChangeText={(val) => {
                  setModel(val);
                  if (errors.model) setErrors((prev) => ({ ...prev, model: undefined }));
                }}
                placeholder="e.g. Josan EV Express Cargo Truck"
                error={errors.model}
              />

              <TextField
                label="Cargo Capacity (kg)"
                value={capacity}
                onChangeText={setCapacity}
                keyboardType="numeric"
                placeholder="e.g. 14000"
              />

              <TextField
                label="Current Odometer (km)"
                value={odometer}
                onChangeText={setOdometer}
                keyboardType="numeric"
                placeholder="e.g. 45200"
              />

              <TextField
                label="Insurance Expiry Date"
                value={insurance}
                onChangeText={setInsurance}
                placeholder="YYYY-MM-DD"
              />

              <TextField
                label="LTA Inspection Expiry Date"
                value={inspection}
                onChangeText={setInspection}
                placeholder="YYYY-MM-DD"
              />

              <View style={styles.statusSelectContainer}>
                <Text style={styles.statusSelectLabel}>Operational Status</Text>
                <View style={styles.statusOptionsRow}>
                  <Pressable
                    style={[styles.statusChip, status === "operational" && styles.statusChipActiveOp]}
                    onPress={() => setStatus("operational")}
                  >
                    <Text style={[styles.statusChipText, status === "operational" && styles.statusChipTextActive]}>
                      Operational
                    </Text>
                  </Pressable>

                  <Pressable
                    style={[styles.statusChip, status === "maintenance" && styles.statusChipActiveMaint]}
                    onPress={() => setStatus("maintenance")}
                  >
                    <Text style={[styles.statusChipText, status === "maintenance" && styles.statusChipTextActive]}>
                      Maintenance
                    </Text>
                  </Pressable>

                  <Pressable
                    style={[styles.statusChip, status === "decommissioned" && styles.statusChipActiveDecom]}
                    onPress={() => setStatus("decommissioned")}
                  >
                    <Text style={[styles.statusChipText, status === "decommissioned" && styles.statusChipTextActive]}>
                      Decom.
                    </Text>
                  </Pressable>
                </View>
              </View>

              <View style={styles.modalActions}>
                <PrimaryButton label={isEditing ? "Save Changes" : "Assign Vehicle"} onPress={handleSave} loading={saving} />
                <Pressable style={styles.cancelBtn} onPress={() => setIsModalVisible(false)} disabled={saving}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        visible={confirmingDelete}
        title="Unassign & Delete Vehicle?"
        message="Are you sure you want to remove this assigned vehicle from your profile?"
        confirmLabel="Unassign & Delete"
        destructive
        onConfirm={handleDelete}
        onCancel={() => setConfirmingDelete(false)}
      />
    </View>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
  headerIconButton: {
    width: 40,
    height: 40,
    borderRadius: radius.button,
    backgroundColor: colors.softBeige,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCard: {
    backgroundColor: colors.darkCharcoal,
    borderRadius: radius.card,
    padding: spacing.xl,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: colors.gold,
  },
  plateText: { color: colors.gold, fontSize: 26, fontWeight: "800", letterSpacing: 1 },
  modelText: { color: colors.textMuted, fontSize: 14, marginTop: 4 },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    marginTop: 12,
  },
  statusBadgeSuccess: { backgroundColor: "rgba(22, 163, 74, 0.2)" },
  statusBadgeWarning: { backgroundColor: "rgba(212, 175, 90, 0.2)" },
  statusBadgeError: { backgroundColor: "rgba(220, 38, 38, 0.2)" },
  statusText: { color: "#34D399", fontSize: 12, fontWeight: "700" },

  sectionCard: {
    backgroundColor: colors.card,
    borderRadius: radius.card,
    padding: spacing.md + 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: colors.darkCharcoal, marginBottom: 14 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.softBeige,
  },
  label: { fontSize: 14, color: colors.textSecondary },
  value: { fontSize: 14, fontWeight: "600", color: colors.darkCharcoal },

  // Actions row
  actionsContainer: {
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  editCardBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs + 2,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md - 2,
    borderRadius: radius.button,
  },
  editCardBtnText: {
    fontSize: typography.bodyMedium.fontSize,
    fontWeight: "700",
    color: colors.white,
  },
  deleteCardBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs + 2,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.error,
    paddingVertical: spacing.md - 2,
    borderRadius: radius.button,
  },
  deleteCardBtnText: {
    fontSize: typography.bodyMedium.fontSize,
    fontWeight: "700",
    color: colors.error,
  },

  // Empty state styles
  emptyCard: {
    alignItems: "center",
    padding: spacing.xl,
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xs,
  },
  emptyTitle: {
    fontSize: typography.h2.fontSize,
    fontWeight: typography.h2.fontWeight,
    color: colors.textPrimary,
  },
  emptySubtitle: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.textSecondary,
    textAlign: "center",
    paddingHorizontal: spacing.md,
    lineHeight: 20,
  },
  addBtn: {
    width: "100%",
    marginTop: spacing.sm,
  },

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
    maxHeight: "88%",
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
  formContent: {
    gap: spacing.md,
    paddingBottom: spacing.lg,
  },
  statusSelectContainer: {
    gap: spacing.xs,
  },
  statusSelectLabel: {
    fontSize: typography.bodySmall.fontSize,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  statusOptionsRow: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  statusChip: {
    flex: 1,
    paddingVertical: spacing.sm + 2,
    alignItems: "center",
    borderRadius: radius.button,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusChipActiveOp: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  statusChipActiveMaint: {
    backgroundColor: colors.gold,
    borderColor: colors.gold,
  },
  statusChipActiveDecom: {
    backgroundColor: colors.error,
    borderColor: colors.error,
  },
  statusChipText: {
    fontSize: typography.caption.fontSize,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  statusChipTextActive: {
    color: colors.white,
    fontWeight: "700",
  },
  modalActions: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  cancelBtn: {
    paddingVertical: spacing.sm,
    alignItems: "center",
  },
  cancelBtnText: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.textSecondary,
    fontWeight: "600",
  },
});
