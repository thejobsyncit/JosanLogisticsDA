import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Image } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/theme";
import { Header } from "@/components/Header";
import { reportFailedDelivery } from "@/services/trips";

const EXCEPTION_REASONS = [
  "Customer unavailable",
  "Wrong delivery address",
  "Damaged cargo",
  "Missing package/items",
  "Vehicle breakdown",
  "Traffic delay / Road closure",
  "Customer refused delivery",
  "Other",
];

export default function ExceptionReportScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [selectedReason, setSelectedReason] = useState<string>(EXCEPTION_REASONS[0]);
  const [notes, setNotes] = useState<string>("");
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const takePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      alert("Camera permission required.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (!result.canceled && result.assets?.[0]?.uri) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await reportFailedDelivery({
        tripId: id || "",
        reason: "other",
        notes: `${selectedReason}${notes.trim() ? `: ${notes.trim()}` : ""}`,
        photoUri: photoUri || undefined,
      });
      alert("Delivery exception reported to dispatcher.");
      router.back();
    } catch (err: any) {
      alert(err.message || "Failed to report exception.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.flex}>
      <Header title="Report Issue / Exception" />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>What issue occurred?</Text>
        <Text style={styles.subtitle}>Select the reason for delivery exception or delay:</Text>

        <View style={styles.reasonsList}>
          {EXCEPTION_REASONS.map((reason) => (
            <TouchableOpacity
              key={reason}
              style={[styles.reasonCard, selectedReason === reason && styles.reasonCardSelected]}
              onPress={() => setSelectedReason(reason)}
            >
              <Text style={[styles.reasonText, selectedReason === reason && styles.reasonTextSelected]}>
                {selectedReason === reason ? "🔘 " : "⚪ "}
                {reason}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Additional Details / Notes:</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Describe the situation for dispatch..."
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={4}
        />

        <Text style={[styles.label, { marginTop: 16 }]}>Photo Evidence (Optional):</Text>
        {photoUri ? (
          <View style={styles.photoContainer}>
            <Image source={{ uri: photoUri }} style={styles.photoPreview} />
            <TouchableOpacity style={styles.retakeBtn} onPress={takePhoto}>
              <Text style={styles.retakeBtnText}>Change Photo</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.photoBox} onPress={takePhoto}>
            <Ionicons name="camera-outline" size={24} color={Colors.primary} />
            <Text style={styles.photoBoxText}>Take Photo Evidence</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={submitting}>
          {submitting ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.submitBtnText}>Submit Exception Report</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 20, fontWeight: "700", color: Colors.darkCharcoal, marginBottom: 4 },
  subtitle: { fontSize: 14, color: Colors.textSecondary, marginBottom: 16 },
  reasonsList: { marginBottom: 20 },
  reasonCard: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 8,
  },
  reasonCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primarySoft,
  },
  reasonText: { fontSize: 14, color: Colors.textPrimary },
  reasonTextSelected: { color: Colors.primary, fontWeight: "600" },
  label: { fontSize: 14, fontWeight: "600", color: Colors.textPrimary, marginBottom: 8 },
  textInput: {
    backgroundColor: Colors.warmOffWhite,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: Colors.textPrimary,
    height: 90,
    textAlignVertical: "top",
  },
  photoBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 14,
    backgroundColor: Colors.primarySoft,
    marginBottom: 24,
  },
  photoBoxText: { fontSize: 14, fontWeight: "600", color: Colors.primary },
  photoContainer: { marginBottom: 24, alignItems: "center" },
  photoPreview: { width: "100%", height: 180, borderRadius: 10 },
  retakeBtn: { marginTop: 8 },
  retakeBtnText: { fontSize: 14, color: Colors.primary, fontWeight: "600" },
  submitBtn: {
    backgroundColor: Colors.danger,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  submitBtnText: { color: Colors.white, fontSize: 16, fontWeight: "700" },
});
