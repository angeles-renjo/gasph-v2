import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { FontAwesome5 } from "@expo/vector-icons";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

// Define form schema with Zod for validation
const signupSchema = z
  .object({
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z
      .string()
      .min(6, "Password must be at least 6 characters"),
    username: z.string().min(3, "Username must be at least 3 characters"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type SignupFormData = z.infer<typeof signupSchema>;

export default function SignUpScreen() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [loading, setLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      username: "",
    },
  });

  const onSubmit = async (data: SignupFormData) => {
    try {
      setLoading(true);
      // Pass only the required data for signup
      await signUp({
        email: data.email,
        password: data.password,
      });

      // Show success message
      Alert.alert(
        "Sign Up Successful",
        "Your account has been created. Please check your email to verify your account.",
        [{ text: "OK", onPress: () => router.replace("/auth/sign-in") }]
      );
    } catch (error: any) {
      Alert.alert(
        "Sign Up Failed",
        error?.message || "An unexpected error occurred"
      );
    } finally {
      setLoading(false);
    }
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  logoContainer: {
    alignItems: "center",
    marginTop: 30,
    marginBottom: 20,
  },
  appTitle: {
    fontSize: 32,
    fontWeight: "bold",
    marginTop: 16,
    color: "#2a9d8f",
  },
  appSubtitle: {
    fontSize: 16,
    color: "#666",
    marginTop: 8,
  },
  formContainer: {
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 24,
    color: "#333",
    textAlign: "center",
  },
  button: {
    marginTop: 16,
  },
  linkContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 24,
  },
  linkText: {
    color: "#666",
    fontSize: 16,
  },
  link: {
    color: "#2a9d8f",
    fontWeight: "bold",
    fontSize: 16,
  },
});
