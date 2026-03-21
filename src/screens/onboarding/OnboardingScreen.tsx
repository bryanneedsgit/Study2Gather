import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { COURSE_OPTIONS, SCHOOL_OPTIONS } from "@/constants/onboardingOptions";
import { FlowProgress } from "@/components/FlowProgress";
import { FormErrorBanner } from "@/components/FormErrorBanner";
import { FormField } from "@/components/FormField";
import { useSession } from "@/context/SessionContext";
import { formatUnknownError } from "@/utils/errors";
import { validateAgeInput, validateRequired } from "@/utils/validation";

function OptionChips({
  options,
  value,
  onSelect,
  disabled
}: {
  options: readonly string[];
  value: string;
  onSelect: (v: string) => void;
  disabled: boolean;
}) {
  return (
    <View style={styles.chips} accessibilityRole="radiogroup">
      {options.map((opt) => {
        const selected = value === opt;
        return (
          <TouchableOpacity
            key={opt}
            style={[styles.chip, selected && styles.chipSelected]}
            onPress={() => onSelect(opt)}
            disabled={disabled}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
          >
            <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{opt}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function SectionLabel({ children }: { children: string }) {
  return (
    <Text style={styles.sectionLabel} accessibilityRole="header">
      {children}
    </Text>
  );
}

export function OnboardingScreen() {
  const { completeOnboarding, user } = useSession();
  const [schoolChoice, setSchoolChoice] = useState<string>(SCHOOL_OPTIONS[0]);
  const [schoolOther, setSchoolOther] = useState("");
  const [courseChoice, setCourseChoice] = useState<string>(COURSE_OPTIONS[0]);
  const [courseOther, setCourseOther] = useState("");
  const [ageText, setAgeText] = useState("");
  const [ageError, setAgeError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ school?: string; course?: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const resolvedSchool = schoolChoice === "Other" ? schoolOther.trim() : schoolChoice;
  const resolvedCourse = courseChoice === "Other" ? courseOther.trim() : courseChoice;

  const onSubmit = async () => {
    setFormError(null);
    setFieldErrors({});
    setAgeError(null);

    const se = validateRequired("School", resolvedSchool);
    const ce = validateRequired("Course", resolvedCourse);
    const otherSchoolErr =
      schoolChoice === "Other" && !schoolOther.trim() ? "Enter your school name." : undefined;
    const otherCourseErr =
      courseChoice === "Other" && !courseOther.trim() ? "Enter your course name." : undefined;

    const ageResult = validateAgeInput(ageText);
    if (ageResult.error) setAgeError(ageResult.error);

    setFieldErrors({
      ...(se || otherSchoolErr ? { school: se ?? otherSchoolErr } : {}),
      ...(ce || otherCourseErr ? { course: ce ?? otherCourseErr } : {})
    });

    if (se || ce || otherSchoolErr || otherCourseErr) return;
    if (ageResult.error || ageResult.value === undefined) return;

    setSubmitting(true);
    try {
      await completeOnboarding({
        school: resolvedSchool,
        course: resolvedCourse,
        age: ageResult.value
      });
    } catch (e) {
      const raw = formatUnknownError(e);
      if (raw.includes("invalid_age")) setFormError("Age must be between 16 and 99.");
      else if (raw.includes("missing_fields")) setFormError("Please fill all fields.");
      else setFormError(raw || "Could not save. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <FlowProgress currentStep={2} totalSteps={2} subtitle="Your profile" />

          <Text style={styles.title}>Finish your profile</Text>
          <Text style={styles.lead}>
            We use this for study partner matching. You can update details later in Profile.
          </Text>
          {user?.email ? (
            <View style={styles.emailPill}>
              <Text style={styles.emailLabel}>Signed in as</Text>
              <Text style={styles.emailValue}>{user.email}</Text>
            </View>
          ) : null}

          <View style={styles.card}>
            <SectionLabel>School</SectionLabel>
            <Text style={styles.hint}>Choose a campus or tap Other to type your own.</Text>
            <OptionChips
              options={SCHOOL_OPTIONS}
              value={schoolChoice}
              onSelect={setSchoolChoice}
              disabled={submitting}
            />
            {fieldErrors.school && schoolChoice !== "Other" ? (
              <Text style={styles.inlineError} accessibilityRole="alert">
                {fieldErrors.school}
              </Text>
            ) : null}
            {schoolChoice === "Other" ? (
              <FormField
                label="School name"
                required
                hint="Full name of your school or university."
                value={schoolOther}
                onChangeText={(t) => {
                  setSchoolOther(t);
                  setFieldErrors((f) => ({ ...f, school: undefined }));
                }}
                placeholder="e.g. National University of Singapore"
                editable={!submitting}
                error={fieldErrors.school}
              />
            ) : null}

            <View style={styles.sectionSpacer} />

            <SectionLabel>Course</SectionLabel>
            <Text style={styles.hint}>Subject or module you’re studying.</Text>
            <OptionChips
              options={COURSE_OPTIONS}
              value={courseChoice}
              onSelect={setCourseChoice}
              disabled={submitting}
            />
            {fieldErrors.course && courseChoice !== "Other" ? (
              <Text style={styles.inlineError} accessibilityRole="alert">
                {fieldErrors.course}
              </Text>
            ) : null}
            {courseChoice === "Other" ? (
              <FormField
                label="Course name"
                required
                hint="e.g. course code or title."
                value={courseOther}
                onChangeText={(t) => {
                  setCourseOther(t);
                  setFieldErrors((f) => ({ ...f, course: undefined }));
                }}
                placeholder="e.g. Linear Algebra"
                editable={!submitting}
                error={fieldErrors.course}
              />
            ) : null}

            <View style={styles.sectionSpacer} />

            <FormField
              label="Age"
              required
              hint="You must be at least 16 years old."
              error={ageError}
            >
              <TextInput
                placeholder="e.g. 20"
                placeholderTextColor="#9CA3AF"
                value={ageText}
                onChangeText={(t) => {
                  setAgeText(t);
                  setAgeError(null);
                }}
                keyboardType="number-pad"
                editable={!submitting}
                style={[styles.ageInput, ageError ? styles.ageInputError : null]}
                accessibilityLabel="Age"
              />
            </FormField>

            <FormErrorBanner message={formError} />

            <TouchableOpacity
              style={[styles.primary, submitting && styles.primaryDisabled]}
              onPress={onSubmit}
              disabled={submitting}
              activeOpacity={0.85}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryText}>Continue to Discover</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F3F4F6" },
  flex: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#111827",
    letterSpacing: -0.4,
    marginBottom: 8
  },
  lead: {
    fontSize: 15,
    color: "#6B7280",
    lineHeight: 22,
    marginBottom: 16
  },
  emailPill: {
    alignSelf: "flex-start",
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 20
  },
  emailLabel: { fontSize: 11, fontWeight: "700", color: "#1D4ED8", textTransform: "uppercase" },
  emailValue: { fontSize: 15, fontWeight: "600", color: "#1E3A8A", marginTop: 2 },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 6,
    letterSpacing: -0.2
  },
  hint: {
    fontSize: 13,
    color: "#6B7280",
    lineHeight: 18,
    marginBottom: 12
  },
  sectionSpacer: { height: 8 },
  chips: { flexDirection: "row", flexWrap: "wrap", marginBottom: 4 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginRight: 8,
    marginBottom: 8
  },
  chipSelected: {
    backgroundColor: "#DBEAFE",
    borderColor: "#2563EB"
  },
  chipText: { fontSize: 14, color: "#374151", fontWeight: "600" },
  chipTextSelected: { color: "#1D4ED8" },
  inlineError: {
    fontSize: 13,
    color: "#B91C1C",
    fontWeight: "600",
    marginTop: 8,
    marginBottom: 4
  },
  ageInput: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
    color: "#111827",
    backgroundColor: "#FFFFFF"
  },
  ageInputError: {
    borderColor: "#DC2626",
    borderWidth: 2,
    backgroundColor: "#FFFBFB"
  },
  primary: {
    backgroundColor: "#2563EB",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 12
  },
  primaryDisabled: { opacity: 0.65 },
  primaryText: { color: "#FFFFFF", fontSize: 17, fontWeight: "700" }
});
