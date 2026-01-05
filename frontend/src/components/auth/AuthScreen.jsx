import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Brain, Buildings, Envelope, Lock, User, Sparkle } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { apiService } from '../../lib/apiService'; // Ensure this path is correct
import { useNavigate } from 'react-router-dom';

export function AuthScreen({ onAuth }) {
    const navigate = useNavigate(); 
  const [isLoading, setIsLoading] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [signupForm, setSignupForm] = useState({ name: '', email: '', password: '', company: ''});

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginForm.email || !loginForm.password) {
      toast.error("Please fill in all fields.");
      return;
    }
    setIsLoading(true);
    try {
      const response = await apiService.login(loginForm);
      localStorage.setItem('authToken', response.token);
      toast.success('Welcome back!');
      console.log('Navigating to dashboard...');
      
      navigate('/app');
    } catch (error) {
      toast.error(error.message || "Login failed. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!signupForm.name || !signupForm.email || !signupForm.password || !signupForm.company) {
      toast.error("Please fill in all fields.");
      return;
    }
    setIsLoading(true);
    try {
      const response = await apiService.signup(signupForm);
      localStorage.setItem('authToken', response.token);
      toast.success('Account created successfully!');
      console.log('Navigating to dashboard... signup');
      navigate('/app/projects'); // Navigate to the projects page after signup
    } catch (error) {
      toast.error(error.message || "Signup failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // --- ALL YOUR JSX REMAINS EXACTLY THE SAME ---
    // --- NO CHANGES NEEDED IN THE RETURN STATEMENT ---
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(120,119,198,0.1),transparent_50%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,154,158,0.1),transparent_50%)] pointer-events-none" />
        
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="w-full max-w-md"
        >
            <div className="text-center mb-8">
            
            <h1 className="text-3xl font-bold tracking-tight">GPTStudio</h1>
            <p className="text-muted-foreground mt-2">Build and deploy custom AI assistants</p>
            </div>

            <Card className="backdrop-blur-sm bg-card/80 border-border/50 shadow-xl">
            <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
                </TabsList>
                
                <TabsContent value="login">
                <form onSubmit={handleLogin}>
                    <CardHeader className="space-y-1 pb-4">
                    <CardTitle className="text-xl">Welcome back</CardTitle>
                    <CardDescription>Sign in to your account to continue</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="login-email">Email</Label>
                        <div className="relative">
                        <div className="absolute inset-y-0 left-0 flex items-center justify-center w-10">
                            <Envelope size={18} className="text-muted-foreground" />
                        </div>
                        <Input
                            id="login-email"
                            type="email"
                            placeholder="you@company.com"
                            className="pl-10 h-11"
                            value={loginForm.email}
                            onChange={(e) => setLoginForm(prev => ({ ...prev, email: e.target.value }))}
                            required
                        />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="login-password">Password</Label>
                        <div className="relative">
                        <div className="absolute inset-y-0 left-0 flex items-center justify-center w-10">
                            <Lock size={18} className="text-muted-foreground" />
                        </div>
                        <Input
                            id="login-password"
                            type="password"
                            placeholder="Enter your password"
                            className="pl-10 h-11"
                            value={loginForm.password}
                            onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                            required
                        />
                        </div>
                    </div>
                    </CardContent>
                    <CardFooter>
                    <Button type="submit" className="w-full h-11" disabled={isLoading}>
                        {isLoading ? (
                        <div className="flex items-center justify-center">
                            <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            className="w-5 h-5 border-2 border-current border-t-transparent rounded-full"
                            />
                        </div>
                        ) : (
                        'Sign In'
                        )}
                    </Button>
                    </CardFooter>
                </form>
                </TabsContent>
                
                <TabsContent value="signup">
                <form onSubmit={handleSignup}>
                    <CardHeader className="space-y-1 pb-4">
                    <CardTitle className="text-xl">Create account</CardTitle>
                    <CardDescription>Get started with your AI platform today</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                        <Label htmlFor="signup-name">Full Name</Label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 flex items-center justify-center w-10">
                            <User size={18} className="text-muted-foreground" />
                            </div>
                            <Input
                            id="signup-name"
                            placeholder="John Doe"
                            className="pl-10 h-11"
                            value={signupForm.name}
                            onChange={(e) => setSignupForm(prev => ({ ...prev, name: e.target.value }))}
                            required
                            />
                        </div>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="signup-company">Company</Label>
                        <div className="relative">
                        <div className="absolute inset-y-0 left-0 flex items-center justify-center w-10">
                            <Buildings size={18} className="text-muted-foreground" />
                        </div>
                        <Input
                            id="signup-company"
                            placeholder="Your Company"
                            className="pl-10 h-11"
                            value={signupForm.company}
                            onChange={(e) => setSignupForm(prev => ({ ...prev, company: e.target.value }))}
                            required
                        />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="signup-email">Email</Label>
                        <div className="relative">
                        <div className="absolute inset-y-0 left-0 flex items-center justify-center w-10">
                            <Envelope size={18} className="text-muted-foreground" />
                        </div>
                        <Input
                            id="signup-email"
                            type="email"
                            placeholder="you@company.com"
                            className="pl-10 h-11"
                            value={signupForm.email}
                            onChange={(e) => setSignupForm(prev => ({ ...prev, email: e.target.value }))}
                            required
                        />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="signup-password">Password</Label>
                        <div className="relative">
                        <div className="absolute inset-y-0 left-0 flex items-center justify-center w-10">
                            <Lock size={18} className="text-muted-foreground" />
                        </div>
                        <Input
                            id="signup-password"
                            type="password"
                            placeholder="Create a strong password"
                            className="pl-10 h-11"
                            value={signupForm.password}
                            onChange={(e) => setSignupForm(prev => ({ ...prev, password: e.target.value }))}
                            required
                        />
                        </div>
                    </div>
                    </CardContent>
                    <CardFooter>
                    <Button type="submit" className="w-full h-11" disabled={isLoading}>
                        {isLoading ? (
                        <div className="flex items-center justify-center">
                            <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            className="w-5 h-5 border-2 border-current border-t-transparent rounded-full"
                            />
                        </div>
                        ) : (
                        <div className="flex items-center gap-2">
                            <Sparkle size={18} weight="duotone" />
                            Create Account
                        </div>
                        )}
                    </Button>
                    </CardFooter>
                </form>
                </TabsContent>
            </Tabs>
            </Card>
            
            <p className="text-center text-sm text-muted-foreground mt-6">
            By signing up, you agree to our Terms of Service and Privacy Policy
            </p>
        </motion.div>
    </div>
  );
}