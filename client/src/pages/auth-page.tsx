import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { BriefcaseIcon } from "lucide-react";

function GoogleIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="h-5 w-5"
    >
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState("login");
  const {
    user,
    isLoading,
    loginMutation,
    registerMutation,
    googleSignIn,
    loginSchema,
    registerSchema,
  } = useAuth();
  const [location, navigate] = useLocation();

  const loginForm = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const registerForm = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      fullName: "",
    },
  });

  const onLoginSubmit = (data: { email: string; password: string }) => {
    loginMutation.mutate(data);
  };

  const onRegisterSubmit = async (data: {
    email: string;
    password: string;
    fullName: string;
  }) => {
    try {
      await registerMutation.mutateAsync({
        email: data.email,
        password: data.password,
        fullName: data.fullName
      });
      navigate("/");
    } catch (error) {
      console.error("Registration error:", error);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await googleSignIn();
      // Navigation is handled by the useEffect below once the user state updates
    } catch (error) {
      console.error("Google sign in failed:", error);
    }
  };

  // If user is already logged in, redirect to dashboard
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-900">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col md:flex-row">
      {/* Left Column - Auth Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-md">
          <div className="flex justify-center mb-8">
            <div className="bg-primary-600 text-white p-3 rounded-md">
              <BriefcaseIcon className="h-8 w-8" />
            </div>
            <div className="ml-3">
              <h1 className="text-3xl font-bold text-white">JAMS</h1>
              <p className="text-gray-400">Job Application Management System</p>
            </div>
          </div>

          <Tabs
            defaultValue="login"
            value={activeTab}
            onValueChange={setActiveTab}
          >
            <TabsList className="grid grid-cols-2 w-full bg-gray-800">
              <TabsTrigger
                value="login"
                className="data-[state=active]:bg-gray-700"
              >
                Login
              </TabsTrigger>
              <TabsTrigger
                value="register"
                className="data-[state=active]:bg-gray-700"
              >
                Register
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="mt-6">
              <div className="mb-6">
                <Button
                  variant="outline"
                  className="flex items-center justify-center w-full bg-gray-750 border-gray-700 hover:bg-gray-700 text-white mb-6"
                  onClick={handleGoogleSignIn}
                  type="button"
                >
                  <GoogleIcon />
                  <span className="ml-2">Sign in with Google</span>
                </Button>

                <div className="relative flex items-center my-8">
                  <div className="flex-grow border-t border-gray-700"></div>
                  <span className="flex-shrink mx-4 text-gray-400 text-sm">
                    or continue with email
                  </span>
                  <div className="flex-grow border-t border-gray-700"></div>
                </div>
              </div>

              <Form {...loginForm}>
                <form
                  onSubmit={loginForm.handleSubmit(onLoginSubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={loginForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="Enter your email"
                            {...field}
                            className="bg-gray-700 border-gray-600 text-white"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={loginForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="Enter your password"
                            {...field}
                            className="bg-gray-700 border-gray-600 text-white"
                          />
                        </FormControl>
                        <FormMessage />
                        <div className="flex justify-end mt-1">
                          <Button
                            variant="link"
                            className="text-primary-400 hover:text-primary-300 p-0 h-auto text-xs"
                          >
                            Forgot password?
                          </Button>
                        </div>
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    className="w-full bg-primary-600 hover:bg-primary-700"
                    disabled={loginMutation.isPending}
                  >
                    {loginMutation.isPending ? "Logging in..." : "Login"}
                  </Button>
                </form>
              </Form>
            </TabsContent>

            <TabsContent value="register" className="mt-6">
              <div className="mb-6">
                <Button
                  variant="outline"
                  className="flex items-center justify-center w-full bg-gray-750 border-gray-700 hover:bg-gray-700 text-white mb-6"
                  onClick={handleGoogleSignIn}
                  type="button"
                >
                  <GoogleIcon />
                  <span className="ml-2">Sign up with Google</span>
                </Button>

                <div className="relative flex items-center my-8">
                  <div className="flex-grow border-t border-gray-700"></div>
                  <span className="flex-shrink mx-4 text-gray-400 text-sm">
                    or continue with email
                  </span>
                  <div className="flex-grow border-t border-gray-700"></div>
                </div>
              </div>

              <Form {...registerForm}>
                <form
                  onSubmit={registerForm.handleSubmit(onRegisterSubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={registerForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="Enter your email"
                            {...field}
                            className="bg-gray-700 border-gray-600 text-white"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={registerForm.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter your full name"
                            {...field}
                            className="bg-gray-700 border-gray-600 text-white"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={registerForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="Create a password"
                            {...field}
                            className="bg-gray-700 border-gray-600 text-white"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    className="w-full bg-primary-600 hover:bg-primary-700"
                    disabled={registerMutation.isPending}
                  >
                    {registerMutation.isPending ? (
                      <div className="flex items-center justify-center">
                        <span className="mr-2">Creating account...</span>
                        <div className="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent"></div>
                      </div>
                    ) : (
                      "Create Account"
                    )}
                  </Button>
                </form>
              </Form>
            </TabsContent>
          </Tabs>

          <div className="mt-8 text-center">
            <div className="relative flex items-center my-8">
              <div className="flex-grow border-t border-gray-700"></div>
              <span className="flex-shrink mx-4 text-gray-400 text-sm">
                or try without an account
              </span>
              <div className="flex-grow border-t border-gray-700"></div>
            </div>
            <Button
              variant="outline"
              className="bg-gray-750 border-gray-700 hover:bg-gray-700 text-white"
              onClick={() => {
                localStorage.setItem("demoMode", "true");
                window.location.href = "/?demo=true";
              }}
            >
              Try Demo Version
            </Button>
          </div>
        </div>
      </div>

      {/* Right Column - Hero Section */}
      <div className="hidden md:flex md:w-1/2 bg-gray-850 text-white p-10 flex-col justify-center">
        <div className="max-w-md mx-auto">
          <h2 className="text-3xl font-bold mb-6">
            Manage Your Job Search, All in One Place
          </h2>
          <p className="text-gray-300 mb-8">
            JAMS helps you organize applications, track interviews, and manage
            documents with powerful AI assistance.
          </p>

          <div className="space-y-6">
            <div className="flex items-start">
              <div className="bg-primary-900/50 p-2 rounded-md mr-4">
                <BriefcaseIcon className="h-5 w-5 text-primary-400" />
              </div>
              <div>
                <h3 className="font-medium mb-1">Application Tracking</h3>
                <p className="text-gray-400 text-sm">
                  Visualize your job pipeline with an intuitive kanban board
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="bg-blue-900/50 p-2 rounded-md mr-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5 text-blue-400"
                >
                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                  <polyline points="14 2 14 8 20 8" />
                  <path d="M16 13H8" />
                  <path d="M16 17H8" />
                  <path d="M10 9H8" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium mb-1">Document Management</h3>
                <p className="text-gray-400 text-sm">
                  Store and version multiple resumes and cover letters
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="bg-purple-900/50 p-2 rounded-md mr-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5 text-purple-400"
                >
                  <path d="M12 8V4H8" />
                  <rect width="16" height="12" x="4" y="8" rx="2" />
                  <path d="M2 14h2" />
                  <path d="M20 14h2" />
                  <path d="M15 13v2" />
                  <path d="M9 13v2" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium mb-1">AI Interview Assistant</h3>
                <p className="text-gray-400 text-sm">
                  Get real-time help during interviews and practice with AI
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
