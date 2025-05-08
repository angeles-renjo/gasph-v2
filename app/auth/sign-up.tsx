import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { FontAwesome5, FontAwesome } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/hooks/stores/useAuthStore';
import { supabase } from '@/utils/supabase/supabase';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Colors, Spacing, Typography, BorderRadius } from '@/styles/theme';

// Validation schema
const signupSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type SignupFormData = z.infer<typeof signupSchema>;

export default function SignUpScreen() {
  const router = useRouter();
  const { signUp, loading } = useAuth();
  const initialize = useAuthStore((state) => state.initialize);
  const [googleSignInLoading, setGoogleSignInLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      fullName: '',
      username: '',
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: SignupFormData) => {
    try {
      await signUp({
        email: data.email,
        password: data.password,
      });

      Alert.alert(
        'Sign Up Successful',
        'Your account has been created. Please check your email to verify your account.',
        [{ text: 'OK', onPress: () => router.replace('/') }]
      );
    } catch (error: any) {
      if (
        error.message &&
        (error.message.includes('profiles_username_key') ||
          (error.message.toLowerCase().includes('username') &&
            error.message.toLowerCase().includes('unique constraint')))
      ) {
        Alert.alert(
          'Sign Up Failed',
          'This username is already taken. Please choose a different one.'
        );
      } else if (
        error.message &&
        (error.message.includes('users_email_key') ||
          (error.message.toLowerCase().includes('email') &&
            error.message.toLowerCase().includes('unique constraint')))
      ) {
        Alert.alert(
          'Sign Up Failed',
          'This email address is already registered. Please try logging in.'
        );
      } else {
        Alert.alert(
          'Sign Up Failed',
          error?.message || 'An unexpected error occurred'
        );
      }
    }
  };

  const handleGoogleSignUp = async () => {
    try {
      setGoogleSignInLoading(true);
      console.log('Starting Google sign-up...');

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'gasph://auth/callback',
        },
      });

      console.log('Sign-up response:', data, error);

      if (error) throw error;

      if (data?.url) {
        console.log('Opening URL in browser:', data.url);
        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          'gasph://auth/callback'
        );

        console.log('Browser result:', result);

        if (result.type === 'success') {
          console.log('Auth successful');

          // Process the tokens directly here
          const { url } = result;

          if (url.includes('#')) {
            try {
              console.log('Extracting tokens from URL');
              const fragment = url.split('#')[1];
              const params = new URLSearchParams(fragment);
              const accessToken = params.get('access_token');
              const refreshToken = params.get('refresh_token');

              if (accessToken && refreshToken) {
                console.log('Got tokens, setting session');
                // Set the session directly with the tokens
                const { data: sessionData, error: sessionError } =
                  await supabase.auth.setSession({
                    access_token: accessToken,
                    refresh_token: refreshToken,
                  });

                if (sessionError) {
                  console.error('Error setting session:', sessionError);
                  throw sessionError;
                }

                if (sessionData.session) {
                  console.log('Session set successfully, initializing auth');

                  // Re-initialize auth store to update the UI state
                  await initialize();

                  console.log('Auth initialized, navigating to home');
                  // Navigate to home
                  router.replace('/');
                }
              } else {
                console.error('Tokens not found in URL');
              }
            } catch (tokenError) {
              console.error('Error processing tokens:', tokenError);
            }
          }
        }
      }
    } catch (error: any) {
      console.error('Google sign-up error:', error);
      Alert.alert(
        'Google Sign Up Failed',
        error?.message || 'An unexpected error occurred during Google Sign Up.'
      );
    } finally {
      setGoogleSignInLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps='handled'
      >
        <View style={styles.headerContainer}>
          <Image
            source={require('@/assets/icons/adaptive-icon.png')}
            style={styles.logo}
          />
          <Text style={styles.appName}>GasPh</Text>
          <Text style={styles.tagline}>
            Find gas stations and report prices in real-time
          </Text>
        </View>

        <Card style={styles.card}>
          <Controller
            control={control}
            name='fullName'
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label='Full Name'
                placeholder='John Doe'
                leftIcon={
                  <FontAwesome5 name='user' size={16} color={Colors.iconGray} />
                }
                onChangeText={onChange}
                onBlur={onBlur}
                value={value}
                error={errors.fullName?.message}
                autoCapitalize='words'
                autoComplete='name'
              />
            )}
          />

          <Controller
            control={control}
            name='email'
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label='Email'
                placeholder='you@example.com'
                leftIcon={
                  <FontAwesome5
                    name='envelope'
                    size={16}
                    color={Colors.iconGray}
                  />
                }
                onChangeText={onChange}
                onBlur={onBlur}
                value={value}
                error={errors.email?.message}
                keyboardType='email-address'
                autoCapitalize='none'
                autoComplete='email'
              />
            )}
          />

          <Controller
            control={control}
            name='username'
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label='Username'
                placeholder='Choose a username'
                leftIcon={
                  <FontAwesome5 name='at' size={16} color={Colors.iconGray} />
                }
                onChangeText={onChange}
                onBlur={onBlur}
                value={value}
                error={errors.username?.message}
                autoCapitalize='none'
              />
            )}
          />

          <Controller
            control={control}
            name='password'
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label='Password'
                placeholder='Create a password'
                leftIcon={
                  <FontAwesome5 name='lock' size={16} color={Colors.iconGray} />
                }
                onChangeText={onChange}
                onBlur={onBlur}
                value={value}
                error={errors.password?.message}
                isPassword={true}
                secureTextEntry
                autoComplete='new-password'
              />
            )}
          />

          <Button
            title='Create account'
            onPress={handleSubmit(onSubmit)}
            loading={loading}
            style={styles.button}
            fullWidth
          />

          <View style={styles.separatorContainer}>
            <View style={styles.separatorLine} />
            <Text style={styles.separatorText}>OR CONTINUE WITH</Text>
            <View style={styles.separatorLine} />
          </View>

          <Button
            title='Sign up with Google'
            onPress={handleGoogleSignUp}
            loading={googleSignInLoading}
            variant='outline'
            style={styles.googleButton}
            leftIcon={
              <FontAwesome
                name='google'
                size={18}
                color='#4285F4'
                style={styles.googleLogo}
              />
            }
            fullWidth
            disabled={googleSignInLoading || loading}
          />

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/auth/sign-in')}>
              <Text style={styles.footerLink}>Log in</Text>
            </TouchableOpacity>
          </View>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundGray2 || '#f5f5f5',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xxl,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  logo: {
    width: 60,
    height: 60,
    marginBottom: Spacing.sm,
  },
  appName: {
    fontSize: Typography.fontSizeXXLarge * 1.5,
    fontWeight: Typography.fontWeightBold,
    color: Colors.primary,
    marginBottom: Spacing.xs,
  },
  tagline: {
    fontSize: Typography.fontSizeMedium,
    color: Colors.textGray,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  card: {
    padding: Spacing.xl,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: Spacing.sm,
    elevation: 3,
  },
  button: {
    marginTop: Spacing.xl,
  },
  separatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.xl,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.mediumGray,
  },
  separatorText: {
    marginHorizontal: Spacing.md,
    color: Colors.textGray,
    fontSize: Typography.fontSizeSmall,
    fontWeight: Typography.fontWeightMedium,
  },
  googleButton: {
    marginTop: Spacing.md,
  },
  googleLogo: {
    marginRight: Spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.xl,
  },
  footerText: {
    color: Colors.textGray,
    fontSize: Typography.fontSizeMedium,
  },
  footerLink: {
    color: Colors.primary,
    fontWeight: Typography.fontWeightBold,
    fontSize: Typography.fontSizeMedium,
  },
});
