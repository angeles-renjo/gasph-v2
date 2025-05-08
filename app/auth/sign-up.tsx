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
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState, useEffect } from 'react';
import { FontAwesome5, FontAwesome } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/hooks/stores/useAuthStore';
import { supabase } from '@/utils/supabase/supabase';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Colors, Spacing, Typography, BorderRadius } from '@/styles/theme';
import { useDebounce } from '@/hooks/useDebounce';

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
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Real-time validation states
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [usernameExists, setUsernameExists] = useState(false);
  const [emailExists, setEmailExists] = useState(false);

  // Debounce values to prevent too many database calls
  const debouncedUsername = useDebounce(username, 500);
  const debouncedEmail = useDebounce(email, 500);

  const {
    control,
    handleSubmit,
    formState: { errors },
    setError,
    clearErrors,
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      fullName: '',
      username: '',
      email: '',
      password: '',
    },
  });

  // Check username availability when debounced value changes
  useEffect(() => {
    const checkUsername = async () => {
      if (!debouncedUsername || debouncedUsername.length < 3) return;

      setIsCheckingUsername(true);
      try {
        const { data, error } = await supabase.rpc('check_username_exists', {
          username_to_check: debouncedUsername,
        });

        setUsernameExists(!!data);

        if (data) {
          setError('username', {
            type: 'manual',
            message: 'This username is already taken',
          });
        } else {
          // Only clear errors if it was a "username exists" error
          if (errors.username?.message === 'This username is already taken') {
            clearErrors('username');
          }
        }
      } catch (error) {
        console.error('Error checking username:', error);
      } finally {
        setIsCheckingUsername(false);
      }
    };

    checkUsername();
  }, [debouncedUsername, setError, clearErrors, errors.username?.message]);

  // Check email availability when debounced value changes
  useEffect(() => {
    const checkEmail = async () => {
      if (!debouncedEmail || !debouncedEmail.includes('@')) return;

      setIsCheckingEmail(true);
      try {
        const { data, error } = await supabase.rpc('check_email_exists', {
          email_to_check: debouncedEmail,
        });

        setEmailExists(!!data);

        if (data) {
          setError('email', {
            type: 'manual',
            message: 'This email is already registered',
          });
        } else {
          // Only clear errors if it was a "email exists" error
          if (errors.email?.message === 'This email is already registered') {
            clearErrors('email');
          }
        }
      } catch (error) {
        console.error('Error checking email:', error);
      } finally {
        setIsCheckingEmail(false);
      }
    };

    checkEmail();
  }, [debouncedEmail, setError, clearErrors, errors.email?.message]);

  const onSubmit = async (data: SignupFormData) => {
    // Stop submission if username or email already exists
    if (usernameExists) {
      setError('username', {
        type: 'manual',
        message: 'This username is already taken',
      });
      return;
    }

    if (emailExists) {
      setError('email', {
        type: 'manual',
        message: 'This email is already registered',
      });
      return;
    }

    try {
      setFormSubmitting(true);

      // 1. Sign up the user
      const { error: signUpError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
            username: data.username,
          },
        },
      });

      if (signUpError) throw signUpError;

      // 2. Now sign in the user immediately
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (signInError) throw signInError;

      // 3. Initialize auth state
      await initialize();

      // 4. Show welcome message and redirect to home
      Alert.alert(
        'Account Created',
        'Welcome to GasPh! You are now signed in.',
        [{ text: 'OK', onPress: () => router.replace('/') }]
      );
    } catch (error: any) {
      if (
        error.message &&
        (error.message.includes('profiles_username_key') ||
          (error.message.toLowerCase().includes('username') &&
            error.message.toLowerCase().includes('unique constraint')))
      ) {
        setError('username', {
          type: 'manual',
          message: 'This username is already taken',
        });
      } else if (
        error.message &&
        (error.message.includes('users_email_key') ||
          (error.message.toLowerCase().includes('email') &&
            error.message.toLowerCase().includes('unique constraint')))
      ) {
        setError('email', {
          type: 'manual',
          message: 'This email is already registered',
        });
      } else {
        Alert.alert(
          'Sign Up Failed',
          error?.message || 'An unexpected error occurred'
        );
      }
    } finally {
      setFormSubmitting(false);
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
                onChangeText={(text) => {
                  onChange(text);
                  setEmail(text);
                }}
                onBlur={onBlur}
                value={value}
                error={errors.email?.message}
                keyboardType='email-address'
                autoCapitalize='none'
                autoComplete='email'
                rightIcon={
                  isCheckingEmail ? (
                    <ActivityIndicator size='small' color={Colors.primary} />
                  ) : emailExists ? (
                    <FontAwesome5
                      name='times-circle'
                      size={16}
                      color={Colors.error}
                    />
                  ) : value && value.includes('@') && !errors.email ? (
                    <FontAwesome5
                      name='check-circle'
                      size={16}
                      color={Colors.success}
                    />
                  ) : null
                }
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
                onChangeText={(text) => {
                  onChange(text);
                  setUsername(text);
                }}
                onBlur={onBlur}
                value={value}
                error={errors.username?.message}
                autoCapitalize='none'
                rightIcon={
                  isCheckingUsername ? (
                    <ActivityIndicator size='small' color={Colors.primary} />
                  ) : usernameExists ? (
                    <FontAwesome5
                      name='times-circle'
                      size={16}
                      color={Colors.error}
                    />
                  ) : value && value.length >= 3 && !errors.username ? (
                    <FontAwesome5
                      name='check-circle'
                      size={16}
                      color={Colors.success}
                    />
                  ) : null
                }
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
            loading={formSubmitting}
            style={styles.button}
            fullWidth
            disabled={
              isCheckingUsername ||
              isCheckingEmail ||
              usernameExists ||
              emailExists
            }
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
            disabled={googleSignInLoading || formSubmitting}
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
