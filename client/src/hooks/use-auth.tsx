import { createContext, ReactNode, useContext, useEffect } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { User as SelectUser } from "@shared/schema";
import { getQueryFn, apiRequest } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  UserCredential,
  sendPasswordResetEmail,
  browserLocalPersistence,
  setPersistence,
} from "firebase/auth";
import { auth, googleProvider } from "../lib/firebase";
import { QUERY_KEYS, updateUserStore, clearQueryStore } from "@/lib/query-store";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";

const loginSchema = z.object({
  email: z.string().email("Must be a valid email"),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = z.object({
  email: z.string().email("Must be a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  fullName: z.string().min(1, "Full name is required"),
});

type LoginData = z.infer<typeof loginSchema>;
type RegisterData = z.infer<typeof registerSchema>;

type AuthContextType = {
  user: Omit<SelectUser, "password"> | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<
    Omit<SelectUser, "password">,
    Error,
    LoginData
  >;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<
    Omit<SelectUser, "password">,
    Error,
    RegisterData
  >;
  forgotPasswordMutation: UseMutationResult<void, Error, { email: string }>;
  googleSignIn: () => Promise<void>;
  loginSchema: typeof loginSchema;
  registerSchema: typeof registerSchema;
};

// Create a minimal mock for UseMutationResult
const createMockMutation = () => ({
  mutate: () => {},
  mutateAsync: async () => ({}),
  isPending: false,
  isError: false,
  isSuccess: false,
  isIdle: true,
  status: "idle",
  data: undefined,
  error: null,
  reset: () => {},
  context: undefined,
  failureCount: 0,
  failureReason: null,
  variables: undefined,
});

// Create the context with a default value to prevent the "must be used within a Provider" error
export const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: false,
  error: null,
  loginMutation: createMockMutation() as any,
  logoutMutation: createMockMutation() as any,
  registerMutation: createMockMutation() as any,
  forgotPasswordMutation: createMockMutation() as any,
  googleSignIn: async () => {},
  loginSchema,
  registerSchema,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const {
    data: user,
    error,
    isLoading,
  } = useQuery<Omit<SelectUser, "password"> | undefined, Error>({
    queryKey: QUERY_KEYS.USER.CURRENT,
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  // Listen for Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const idToken = await firebaseUser.getIdToken();
          const res = await apiRequest("POST", "/api/firebase-auth", {
            idToken,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
          });
          const userData = await res.json();
          updateUserStore(userData);
        } catch (error) {
          console.error("Error syncing Firebase user with backend:", error);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Regular email/password login
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      try {
        if (auth.currentUser) {
          await signOut(auth);
        }

        await setPersistence(auth, browserLocalPersistence);

        let firebaseResult: UserCredential;
        try {
          firebaseResult = await signInWithEmailAndPassword(
            auth,
            credentials.email,
            credentials.password
          );
        } catch (firebaseError: any) {
          switch (firebaseError.code) {
            case 'auth/invalid-credential':
              throw new Error('Invalid email or password. Please try again.');
            case 'auth/user-not-found':
              throw new Error('No account found with this email.');
            case 'auth/wrong-password':
              throw new Error('Incorrect password.');
            case 'auth/too-many-requests':
              throw new Error('Too many attempts. Please try again later.');
            default:
              console.error('Firebase auth error:', firebaseError);
              throw new Error('Authentication failed. Please try again.');
          }
        }

        const idToken = await firebaseResult.user.getIdToken();

        const res = await apiRequest("POST", "/api/firebase-auth", {
          idToken,
          email: credentials.email,
          displayName: firebaseResult.user.displayName || '',
          photoURL: firebaseResult.user.photoURL || '',
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || "Authentication failed");
        }

        return await res.json();
      } catch (error: any) {
        await signOut(auth);
        throw new Error(error.message || "Login failed");
      }
    },
    onSuccess: (user: Omit<SelectUser, "password">) => {
      updateUserStore(user);
      toast({
        title: "Welcome back!",
        description: "You have successfully logged in.",
      });
      setLocation('/');
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Google Sign In
  const googleSignIn = async () => {
    try {
      if (auth.currentUser) {
        await signOut(auth);
      }

      try {
        const result = await signInWithPopup(auth, googleProvider);
        const idToken = await result.user.getIdToken();

        const res = await apiRequest("POST", "/api/firebase-auth", {
          idToken,
          email: result.user.email,
          displayName: result.user.displayName,
          photoURL: result.user.photoURL,
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || "Failed to authenticate with server");
        }

        const userData = await res.json();
        updateUserStore(userData);

        toast({
          title: "Google Sign In Successful",
          description: "You have successfully signed in with Google.",
        });
        
        // Force a refetch of the user data
        await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USER.CURRENT });
        
        return userData;
      } catch (firebaseError: any) {
        console.error("Firebase Google sign in error:", firebaseError);
        switch (firebaseError.code) {
          case 'auth/operation-not-allowed':
            throw new Error('Google sign-in is not enabled. Please contact support.');
          case 'auth/popup-blocked':
            throw new Error('Popup was blocked. Please allow popups for this site.');
          case 'auth/popup-closed-by-user':
            throw new Error('Sign-in was cancelled.');
          case 'auth/unauthorized-domain':
            throw new Error('This domain is not authorized for Google sign-in.');
          default:
            throw new Error(firebaseError.message || 'Google sign-in failed');
        }
      }
    } catch (error: any) {
      console.error("Google sign in error:", error);
      toast({
        title: "Google Sign In Failed",
        description: error.message || "An error occurred during Google sign in",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Registration with email/password
  const registerMutation = useMutation({
    mutationFn: async (userData: RegisterData) => {
      try {
        if (auth.currentUser) {
          await signOut(auth);
        }

        try {
          await createUserWithEmailAndPassword(
            auth,
            userData.email,
            userData.password,
          );
        } catch (firebaseError: any) {
          console.log("Firebase registration failed, trying backend only:", firebaseError);
          if (firebaseError.code === "auth/email-already-in-use") {
            throw new Error("Email is already in use in Firebase");
          }
        }

        const res = await apiRequest("POST", "/api/register", userData);
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || "Registration failed");
        }
        return await res.json();
      } catch (error: any) {
        throw new Error(error.message || "Registration failed");
      }
    },
    onSuccess: (user: Omit<SelectUser, "password">) => {
      updateUserStore(user);
      toast({
        title: "Account created",
        description: "Your account has been successfully created.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Forgot Password
  const forgotPasswordMutation = useMutation({
    mutationFn: async ({ email }: { email: string }) => {
      await sendPasswordResetEmail(auth, email);
    },
    onSuccess: () => {
      toast({
        title: "Password Reset Email Sent",
        description: "Check your email for a password reset link.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Password Reset Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Logout from both Firebase and our backend
  const logoutMutation = useMutation({
    mutationFn: async () => {
      await signOut(auth);
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      clearQueryStore();
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
      setLocation('/auth');
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
        forgotPasswordMutation,
        googleSignIn,
        loginSchema,
        registerSchema,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  // Context will always have at least the default values
  const context = useContext(AuthContext);
  return context;
}